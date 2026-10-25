import 'dotenv/config';
import dns from 'dns';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (err) {
  console.warn('DNS resolver override failed:', err);
}

import path from 'path';
import fs from 'fs';
import { chromium, BrowserContext, Page } from 'playwright';
import dbConnect from '../lib/db/connect';
import Job from '../models/Job';
import Application, { ApplicationState } from '../models/Application';
import UserProfile from '../models/UserProfile';
import AnswerMemory from '../models/AnswerMemory';
import ActivityLog from '../models/ActivityLog';
import Resume from '../models/Resume';
import { GreenhouseAdapter } from '../automation/adapters/GreenhouseAdapter';
import { LeverAdapter } from '../automation/adapters/LeverAdapter';
import { AshbyAdapter } from '../automation/adapters/AshbyAdapter';
import { GenericFormAdapter } from '../automation/adapters/GenericFormAdapter';
import { ATSAdapter, FormFieldInfo } from '../automation/adapters/types';
import { aiClassifyQuestion } from '../lib/ai/gemini';


// Ensure storage folders exist
const STORAGE_DIR = path.join(process.cwd(), 'storage');
const SCREENSHOTS_DIR = path.join(STORAGE_DIR, 'screenshots');
const RESUMES_DIR = path.join(STORAGE_DIR, 'resumes');

[STORAGE_DIR, SCREENSHOTS_DIR, RESUMES_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Active browser sessions mapped by Application ID
interface ActiveSession {
  context: BrowserContext;
  page: Page;
  adapter: ATSAdapter;
}
const activeSessions: Map<string, ActiveSession> = new Map();

// Instantiate adapters
const adapters = [
  new GreenhouseAdapter(),
  new LeverAdapter(),
  new AshbyAdapter(),
  new GenericFormAdapter() // fallback
];

async function logActivity(
  message: string,
  level: 'info' | 'warn' | 'error' | 'debug' = 'info',
  jobId?: any,
  appId?: any,
  details?: any
) {
  console.log(`[${level.toUpperCase()}] ${message}`);
  try {
    await ActivityLog.create({
      message,
      level,
      jobId,
      applicationId: appId,
      details: details ? new Map(Object.entries(details)) : undefined
    });
    
    if (appId) {
      await Application.findByIdAndUpdate(appId, {
        $push: { logs: `${new Date().toLocaleTimeString()} - ${message}` }
      });
    }
  } catch (err) {
    console.error('Failed to log activity to database:', err);
  }
}

/**
 * Maps form fields to Profile keys or Answer Memory
 */
async function getAnswerForField(
  field: FormFieldInfo,
  profile: any,
  appId: string
): Promise<{ value: string; source: 'profile' | 'memory' | 'manual'; confidence: number; category?: string }> {
  const normLabel = field.normalizedLabel;

  // 1. Try Deterministic Profile Fields
  if (normLabel.includes('name')) {
    if (normLabel.includes('first') || normLabel.includes('given')) {
      return { value: profile.personal?.fullName?.value?.split(' ')[0] || '', source: 'profile', confidence: 100 };
    }
    if (normLabel.includes('last') || normLabel.includes('family') || normLabel.includes('surname')) {
      const names = profile.personal?.fullName?.value?.split(' ') || [];
      return { value: names.length > 1 ? names[names.length - 1] : '', source: 'profile', confidence: 100 };
    }
    return { value: profile.personal?.fullName?.value || '', source: 'profile', confidence: 100 };
  }
  
  if (normLabel.includes('email')) {
    return { value: profile.personal?.email?.value || '', source: 'profile', confidence: 100 };
  }
  
  if (normLabel.includes('phone') || normLabel.includes('mobile') || normLabel.includes('contact')) {
    return { value: profile.personal?.phone?.value || '', source: 'profile', confidence: 100 };
  }

  if (normLabel.includes('linkedin')) {
    return { value: profile.links?.linkedin?.value || '', source: 'profile', confidence: 100 };
  }

  if (normLabel.includes('github')) {
    return { value: profile.links?.github?.value || '', source: 'profile', confidence: 100 };
  }

  if (normLabel.includes('website') || normLabel.includes('portfolio')) {
    return { value: profile.links?.portfolio?.value || profile.links?.personalWebsite?.value || '', source: 'profile', confidence: 100 };
  }

  if (normLabel.includes('university') || normLabel.includes('college') || normLabel.includes('school')) {
    return { value: profile.education?.university?.value || '', source: 'profile', confidence: 100 };
  }

  if (normLabel.includes('gpa') || normLabel.includes('cgpa')) {
    return { value: String(profile.education?.cgpa?.value || ''), source: 'profile', confidence: 100 };
  }

  if (normLabel.includes('graduation') || normLabel.includes('gradyear')) {
    return { value: String(profile.education?.graduationYear?.value || ''), source: 'profile', confidence: 100 };
  }

  // 2. Try Answer Memory
  // Check if we have a matching verified intent or question text
  const matchMemory = await AnswerMemory.findOne({
    $or: [
      { originalQuestion: new RegExp(field.label, 'i') },
      { normalizedIntent: normLabel }
    ]
  });

  if (matchMemory && matchMemory.verifiedByUser) {
    return {
      value: matchMemory.answer,
      source: 'memory',
      confidence: matchMemory.autoFillAllowed ? 90 : 70,
      category: matchMemory.category
    };
  }

  // 3. Let Gemini Classify and check if it is safe to autofill
  try {
    const aiResult = await aiClassifyQuestion(field.label, field.options, profile);
    
    // If AI found a match in profile and marked it safe
    if (!aiResult.needsHumanInput && aiResult.suggestedAnswer) {
      return {
        value: aiResult.suggestedAnswer,
        source: 'profile',
        confidence: 80,
        category: aiResult.category
      };
    }

    return {
      value: '',
      source: 'manual',
      confidence: 0,
      category: aiResult.category
    };
  } catch (err) {
    console.error('Gemini classification in field answer matcher failed:', err);
    return { value: '', source: 'manual', confidence: 0, category: 'UNKNOWN' };
  }
}

async function captureScreenshot(page: Page, appId: string, name: string): Promise<string> {
  const filename = `${appId}_${name}_${Date.now()}.png`;
  const filePath = path.join(SCREENSHOTS_DIR, filename);
  try {
    await page.screenshot({ path: filePath });
    return filePath;
  } catch (err) {
    console.error('Failed to capture screenshot:', err);
    return '';
  }
}

/**
 * Core Automation State Machine Loop
 */
async function processApplications() {
  await dbConnect();

  // Find apps that need active automation processing
  const apps = await Application.find({
    status: { $in: ['In Progress', 'Ready'] },
    currentState: { $in: ['BROWSER_STARTING', 'FORM_FILLING', 'SUBMITTING'] }
  });

  for (const app of apps) {
    const appId = app._id.toString();
    
    try {
      const job = await Job.findById(app.jobId);
      if (!job) {
        await Application.findByIdAndUpdate(appId, { status: 'Failed', failureReason: 'Linked Job not found' });
        continue;
      }

      const profile = await UserProfile.findOne();
      if (!profile || !profile.isOnboarded) {
        await logActivity('UserProfile is not onboarded; skipping automation', 'warn', job._id, appId);
        continue;
      }

      // STATE: BROWSER_STARTING
      if (app.currentState === 'BROWSER_STARTING') {
        await logActivity('Starting Playwright headed browser instance...', 'info', job._id, appId);
        
        const profilePath = path.resolve(process.env.BROWSER_PROFILE_DIR || './storage/browser-profile');
        const context = await chromium.launchPersistentContext(profilePath, {
          headless: false, // headed browser required
          viewport: { width: 1280, height: 800 },
          args: ['--disable-blink-features=AutomationControlled'] // normal browser feel
        });

        const page = await context.newPage();
        
        // Save status
        await Application.findByIdAndUpdate(appId, {
          currentState: 'APPLICATION_OPENED',
          currentUrl: job.finalUrl || job.originalUrl
        });

        await logActivity(`Opening application link: ${job.finalUrl || job.originalUrl}`, 'info', job._id, appId);
        await page.goto(job.finalUrl || job.originalUrl, { waitUntil: 'load', timeout: 45000 });
        await page.waitForTimeout(2000);

        // Detect appropriate adapter
        let activeAdapter: ATSAdapter | null = null;
        for (const adapter of adapters) {
          if (await adapter.detect(page)) {
            activeAdapter = adapter;
            break;
          }
        }

        if (!activeAdapter) {
          throw new Error('No compatible form adapter found for page.');
        }

        await logActivity(`Detected ATS format: ${activeAdapter.constructor.name}`, 'info', job._id, appId);

        // Scan Form
        await Application.findByIdAndUpdate(appId, { currentState: 'FORM_SCANNING' });
        const scanResult = await activeAdapter.scanForm(page);
        
        await logActivity(`Form scanned. Identified ${scanResult.fields.length} input controls.`, 'info', job._id, appId);
        
        // Cache active session
        activeSessions.set(appId, {
          context,
          page,
          adapter: activeAdapter
        });

        // Set currentState to FORM_FILLING to transition to filling inputs
        app.currentState = 'FORM_FILLING';
      }

      // STATE: FORM_FILLING (or transitioning from SCANNING)
      if (app.currentState === 'FORM_FILLING') {
        const session = activeSessions.get(appId);
        if (!session) {
          // Re-initialize if worker restarted
          await Application.findByIdAndUpdate(appId, { currentState: 'BROWSER_STARTING' });
          continue;
        }

        const { page, adapter } = session;
        await logActivity('Scanning and filling known fields...', 'info', job._id, appId);

        // Re-scan fields to capture dynamic rendering additions
        const scanResult = await adapter.scanForm(page);
        let humanPauseRequired = false;
        
        const filledAnswers: any[] = [...app.fieldAnswers];

        for (const field of scanResult.fields) {
          // Skip if field is already filled in this application instance
          if (filledAnswers.some(ans => ans.fieldId === field.fieldId && ans.value !== '')) {
            continue;
          }

          // Handle Resume upload category
          if (field.fieldType === 'file') {
            const activeResume = await Resume.findById(app.selectedResumeId);
            if (activeResume) {
              const localFilePath = path.join(RESUMES_DIR, activeResume.safeFilename);
              if (fs.existsSync(localFilePath)) {
                await logActivity(`Uploading resume: ${activeResume.originalFilename}`, 'info', job._id, appId);
                const uploadSuccess = await adapter.uploadResume(page, field.fieldId, localFilePath);
                if (uploadSuccess) {
                  filledAnswers.push({
                    fieldId: field.fieldId,
                    label: field.label,
                    normalizedLabel: field.normalizedLabel,
                    fieldType: 'file',
                    value: activeResume.originalFilename,
                    confidence: 100,
                    source: 'profile'
                  });
                }
              }
            }
            continue;
          }

          // Solve other inputs
          const answer = await getAnswerForField(field, profile, appId);

          // Classify safety logic (Section 26 & Section 23)
          const isSensitive = [
            'SALARY', 'WORK_AUTHORIZATION', 'VISA', 'SPONSORSHIP', 'RELOCATION',
            'LEGAL_DECLARATION', 'CRIMINAL_HISTORY', 'DISABILITY', 'VETERAN_STATUS',
            'CONFLICT_OF_INTEREST', 'BACKGROUND_CHECK', 'ASSESSMENT', 'UNKNOWN'
          ].includes(answer.category || '');

          if (isSensitive || !answer.value || answer.confidence < 60) {
            // Need human input!
            humanPauseRequired = true;
            
            // Capture pause screenshot
            const ssPath = await captureScreenshot(page, appId, 'pause');
            await logActivity(`Automation paused for human review on question: "${field.label}"`, 'warn', job._id, appId);

            await Application.findByIdAndUpdate(appId, {
              status: 'Waiting for User',
              currentState: 'WAITING_FOR_USER',
              pausedAt: new Date(),
              humanActionRequired: {
                questionText: field.label,
                reason: `Unverified answer or sensitive topic (${answer.category || 'UNKNOWN'}).`,
                category: answer.category || 'UNKNOWN',
                options: field.options,
                normalizedIntent: field.normalizedLabel
              },
              fieldAnswers: filledAnswers,
              screenshots: [ssPath]
            });
            break;
          } else {
            // Safe to fill automatically
            await logActivity(`Auto-filling: ${field.label} -> "${answer.value}"`, 'info', job._id, appId);
            await adapter.fillField(page, field, answer.value);
            
            filledAnswers.push({
              fieldId: field.fieldId,
              label: field.label,
              normalizedLabel: field.normalizedLabel,
              fieldType: field.fieldType,
              value: answer.value,
              confidence: answer.confidence,
              source: answer.source
            });
          }
        }

        if (!humanPauseRequired) {
          // All fields successfully filled! Review step.
          const ssPath = await captureScreenshot(page, appId, 'review');
          await logActivity('All form fields completed. Transitioning to Review Required.', 'info', job._id, appId);
          
          await Application.findByIdAndUpdate(appId, {
            status: 'Review Required',
            currentState: 'REVIEW_REQUIRED',
            fieldAnswers: filledAnswers,
            screenshots: [ssPath]
          });
        }
      }

      // STATE: SUBMITTING
      if (app.currentState === 'SUBMITTING') {
        const session = activeSessions.get(appId);
        if (!session) {
          await Application.findByIdAndUpdate(appId, { status: 'Failed', failureReason: 'Active browser context was lost' });
          continue;
        }

        const { page, adapter } = session;
        await logActivity('Executing form submission...', 'info', job._id, appId);
        
        // Re-read scanned form details
        const scanResult = await adapter.scanForm(page);
        
        // Take screenshot before clicking submit
        const preSubmitSS = await captureScreenshot(page, appId, 'presubmit');

        // Click Submit
        await page.click(scanResult.submitSelector);
        
        // Wait for redirect or success text element (up to 15s)
        await page.waitForTimeout(5000);
        
        const postSubmitSS = await captureScreenshot(page, appId, 'postsubmit');
        
        // Scan for common success markers (e.g. 'thank you', 'received', 'submitted')
        const success = await page.evaluate(() => {
          const pageText = document.body.innerText.toLowerCase();
          return pageText.includes('thank') || pageText.includes('success') || pageText.includes('submitted') || pageText.includes('received') || pageText.includes('application confirmation');
        });

        if (success) {
          await logActivity('Submission successful!', 'info', job._id, appId);
          await Application.findByIdAndUpdate(appId, {
            status: 'Submitted',
            currentState: 'SUBMITTED',
            submittedAt: new Date(),
            submissionEvidence: {
              timestamp: new Date(),
              finalUrl: page.url(),
              confirmationText: 'Found success confirmation keywords in page body.',
              screenshotPath: postSubmitSS
            }
          });
        } else {
          // Flag as uncertain
          await logActivity('Submission finished, but could not detect success keywords on landing page.', 'warn', job._id, appId);
          await Application.findByIdAndUpdate(appId, {
            status: 'Submitted', // Keep Submitted but note uncertainty
            currentState: 'SUBMITTED',
            submittedAt: new Date(),
            failureReason: 'SUBMISSION_UNCERTAIN: Confirm manually on webpage.',
            submissionEvidence: {
              timestamp: new Date(),
              finalUrl: page.url(),
              confirmationText: 'Submission finished, but no explicit confirmation landing text detected.',
              screenshotPath: postSubmitSS
            }
          });
        }

        // Cleanup Playwright session
        await page.close();
        await session.context.close();
        activeSessions.delete(appId);
      }

    } catch (err: any) {
      await logActivity(`Automation engine error: ${err.message}`, 'error', app.jobId, appId);
      
      const session = activeSessions.get(appId);
      if (session) {
        try {
          const ssPath = await captureScreenshot(session.page, appId, 'failure');
          await Application.findByIdAndUpdate(appId, {
            status: 'Failed',
            currentState: 'FAILED',
            failureReason: err.message,
            $push: { screenshots: ssPath }
          });
          
          await session.page.close();
          await session.context.close();
        } catch {}
        activeSessions.delete(appId);
      } else {
        await Application.findByIdAndUpdate(appId, {
          status: 'Failed',
          currentState: 'FAILED',
          failureReason: err.message
        });
      }
    }
  }
}

// Main execution loop
async function runWorker() {
  console.log('ApplyPilot AI Background Worker started. Listening for state shifts in MongoDB...');
  
  while (true) {
    try {
      await processApplications();
    } catch (err) {
      console.error('Worker loop exception occurred:', err);
    }
    // Poll every 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
}

runWorker();
