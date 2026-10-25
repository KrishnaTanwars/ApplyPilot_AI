import { aiCheckEligibility } from '@/lib/ai/gemini';
import { EligibilityResult } from '@/schemas/ai';

/**
 * Checks candidate eligibility for a parsed job.
 * Combines deterministic checks with Gemini AI analysis to verify graduation batch and experience restrictions.
 */
export async function checkEligibility(profile: any, job: any): Promise<EligibilityResult> {
  // 1. Perform deterministic checks first to shield against AI hallucination
  const reasons: string[] = [];
  const missingRequirements: string[] = [];

  // Get profile fields
  const gradYear = profile.education?.graduationYear?.value || 0;
  const experienceYears = profile.professional?.yearsOfExperience?.value || 0;
  const currentStatus = profile.professional?.currentStatus?.value || 'student';

  // Extract job constraints
  const jobBatches = job.batches || [];
  const jobExpMin = job.experienceMin || 0;

  // Rule A: Graduation year checking
  if (jobBatches.length > 0 && gradYear > 0) {
    const isBatchMatched = jobBatches.includes(gradYear);
    if (!isBatchMatched) {
      // If job is specifically for final years or specific batches and we aren't in it
      missingRequirements.push(`Graduation year (Requires: ${jobBatches.join(', ')}, Candidate: ${gradYear})`);
      reasons.push(`Job is restricted to graduation batches: ${jobBatches.join(', ')}`);
    }
  }

  // Rule B: Experience checking
  if (jobExpMin > 0 && currentStatus === 'student' && experienceYears < jobExpMin) {
    // If job requires professional experience, and candidate is a student with insufficient commercial years
    missingRequirements.push(`Professional experience (Requires: ${jobExpMin}+ years, Candidate: ${experienceYears} years)`);
    reasons.push(`Job requires ${jobExpMin} years of commercial experience; candidate is a student with ${experienceYears} years.`);
  }

  // If deterministic rules find an absolute mismatch, return early as NOT_ELIGIBLE
  if (missingRequirements.length > 0) {
    return {
      eligibility: 'NOT_ELIGIBLE',
      reasons,
      missingRequirements
    };
  }

  // 2. Fall back to semantic AI eligibility check for skill constraints or complex phrasing
  try {
    const aiResult = await aiCheckEligibility(profile, job);
    
    // Safety override: If AI made them eligible but we found deterministic conflicts, enforce NOT_ELIGIBLE
    if (aiResult.eligibility === 'ELIGIBLE' && missingRequirements.length > 0) {
      return {
        eligibility: 'NOT_ELIGIBLE',
        reasons: [...reasons, ...aiResult.reasons],
        missingRequirements: [...missingRequirements, ...aiResult.missingRequirements]
      };
    }
    
    return aiResult;
  } catch (err: any) {
    console.error('Gemini AI eligibility engine failed:', err);
    // Safe default if AI fails
    return {
      eligibility: 'UNCERTAIN',
      reasons: ['Deterministic checks passed, but semantic AI eligibility check failed.'],
      missingRequirements: []
    };
  }
}
