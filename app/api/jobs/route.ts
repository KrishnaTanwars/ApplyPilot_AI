import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Job from '@/models/Job';
import Application from '@/models/Application';
import UserProfile from '@/models/UserProfile';
import ActivityLog from '@/models/ActivityLog';
import { parseJobMessage } from '@/services/job-parser';
import { validateUrlSafety, followRedirectChain, normalizeUrl } from '@/lib/security/url';
import { crawlAndParseJobPage } from '@/services/job-page-reader';
import { checkEligibility } from '@/services/eligibility';
import { calculateMatchScore } from '@/services/matching';
import { selectBestResume } from '@/services/resume-selector';

async function logMsg(message: string, level: 'info' | 'warn' | 'error' = 'info', jobId?: any, appId?: any) {
  try {
    await ActivityLog.create({
      message,
      level,
      jobId,
      applicationId: appId
    });
  } catch {}
}

// Background Analysis Runner
async function runAnalysisPipeline(jobId: string) {
  try {
    await dbConnect();
    const job = await Job.findById(jobId);
    if (!job) return;

    const profile = await UserProfile.findOne();
    if (!profile) {
      job.status = 'failed';
      await job.save();
      return;
    }

    // 1. Parsing message (State: RECEIVED -> PARSING)
    await logMsg('Background parser started', 'info', jobId);
    
    const parseResult = await parseJobMessage(job.rawMessage || job.originalUrl);
    
    // Update Job details
    job.company = parseResult.parsedData.company;
    job.role = parseResult.parsedData.role;
    job.location = parseResult.parsedData.location;
    job.workMode = parseResult.parsedData.workMode;
    job.employmentType = parseResult.parsedData.employmentType;
    job.salary = parseResult.parsedData.salary;
    job.experienceMin = parseResult.parsedData.experienceMin;
    job.experienceMax = parseResult.parsedData.experienceMax;
    job.qualifications = parseResult.parsedData.qualifications;
    job.branches = parseResult.parsedData.branches;
    job.batches = parseResult.parsedData.batches;
    job.requiredSkills = parseResult.parsedData.requiredSkills;
    job.preferredSkills = parseResult.parsedData.preferredSkills;
    
    await logMsg('Message parsed by Gemini AI successfully', 'info', jobId);

    // 2. Extracting & Validating links
    const targetUrl = parseResult.urls.length > 0 ? parseResult.urls[0] : job.originalUrl;
    if (!targetUrl) {
      throw new Error('No URLs found in job alert post');
    }

    job.originalUrl = targetUrl;
    await job.save();

    // Validate URL safety
    const safetyCheck = await validateUrlSafety(targetUrl);
    if (!safetyCheck.safe) {
      throw new Error(`URL Security Shield: ${safetyCheck.reason}`);
    }

    // Follow redirect chain
    await logMsg(`Following redirects for target link: ${targetUrl}`, 'info', jobId);
    const redirectDetails = await followRedirectChain(targetUrl);
    
    job.finalUrl = redirectDetails.finalUrl;
    job.normalizedUrl = normalizeUrl(redirectDetails.finalUrl);
    job.domain = safetyCheck.domain || '';
    job.atsType = redirectDetails.atsType;
    await job.save();

    // Check duplicate application
    const duplicateApp = await Application.findOne({
      $or: [
        { currentUrl: job.normalizedUrl },
        { currentUrl: job.finalUrl }
      ]
    });
    if (duplicateApp) {
      await logMsg(`Duplicate application check flagged matching: ${job.normalizedUrl}`, 'warn', jobId);
    }

    // 3. Reading job page
    await logMsg(`Crawling official application details from URL: ${job.finalUrl}`, 'info', jobId);
    const pageDetails = await crawlAndParseJobPage(job.finalUrl);
    
    // Overlay crawled details
    job.company = pageDetails.parsedData.company || job.company;
    job.role = pageDetails.parsedData.role || job.role;
    job.location = pageDetails.parsedData.location !== 'unknown' ? pageDetails.parsedData.location : job.location;
    job.workMode = pageDetails.parsedData.workMode !== 'unknown' ? pageDetails.parsedData.workMode : job.workMode;
    job.employmentType = pageDetails.parsedData.employmentType !== 'unknown' ? pageDetails.parsedData.employmentType : job.employmentType;
    job.requiredSkills = pageDetails.parsedData.requiredSkills.length > 0 ? pageDetails.parsedData.requiredSkills : job.requiredSkills;
    job.preferredSkills = pageDetails.parsedData.preferredSkills.length > 0 ? pageDetails.parsedData.preferredSkills : job.preferredSkills;
    job.atsType = pageDetails.atsType !== 'unknown' ? pageDetails.atsType : job.atsType;
    job.status = 'analyzed';
    await job.save();

    await logMsg('Job details extracted and merged from webpage successfully', 'info', jobId);

    // 4. Checking eligibility
    await logMsg('Evaluating candidate profile against job metrics...', 'info', jobId);
    const eligibilityDetails = await checkEligibility(profile, job);

    // 5. Calculating match score
    const matchDetails = await calculateMatchScore(profile, job);

    // 6. Selecting resume
    const resumeDetails = await selectBestResume(job);

    // Create Application
    const newApp = await Application.create({
      jobId: job._id,
      selectedResumeId: resumeDetails?.resumeId || undefined,
      status: eligibilityDetails.eligibility === 'NOT_ELIGIBLE' ? 'Not Eligible' : 'Analyzed',
      currentState: 'READY_TO_APPLY',
      atsType: job.atsType,
      currentUrl: job.finalUrl,
      matchScore: matchDetails.totalScore,
      eligibility: eligibilityDetails.eligibility,
      logs: [
        `${new Date().toLocaleTimeString()} - Job message analyzed`,
        `${new Date().toLocaleTimeString()} - Eligibility: ${eligibilityDetails.eligibility}`,
        `${new Date().toLocaleTimeString()} - Match Score: ${matchDetails.totalScore}`
      ]
    });

    await logMsg(`Application record created with status Ready, match score ${matchDetails.totalScore}`, 'info', jobId, newApp._id);

  } catch (err: any) {
    console.error('Job pipeline failed:', err);
    await logMsg(`Job pipeline failed: ${err.message}`, 'error', jobId);
    await Job.findByIdAndUpdate(jobId, { status: 'failed' });
  }
}

export async function GET() {
  try {
    await dbConnect();
    const jobs = await Job.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ jobs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { rawMessage, directUrl } = await request.json();

    if (!rawMessage && !directUrl) {
      return NextResponse.json({ error: 'Message content or direct URL is required' }, { status: 400 });
    }

    // Seed temporary fields first, then spawn pipeline
    const tempJob = await Job.create({
      rawMessage: rawMessage || '',
      originalUrl: directUrl || '',
      normalizedUrl: directUrl ? normalizeUrl(directUrl) : `temp_${Date.now()}`,
      company: 'Analyzing...',
      role: 'Analyzing...',
      status: 'new'
    });

    // Run async in background without awaiting HTTP request
    runAnalysisPipeline(tempJob._id.toString());

    return NextResponse.json({ success: true, jobId: tempJob._id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
