import { aiCalculateMatchScore } from '@/lib/ai/gemini';
import { MatchResult } from '@/schemas/ai';

/**
 * Calculates a match score out of 100 between candidate profile and job requirements.
 * Integrates with Gemini AI using structured matching weights.
 */
export async function calculateMatchScore(profile: any, job: any): Promise<MatchResult> {
  try {
    return await aiCalculateMatchScore(profile, job);
  } catch (err: any) {
    console.error('Gemini AI match engine failed, generating deterministic fallback:', err);
    
    // Deterministic fallback matching
    const profileSkills = (profile.skills?.value || []).map((s: string) => s.toLowerCase());
    const reqSkills = (job.requiredSkills || []).map((s: string) => s.toLowerCase());
    
    const matchingSkills = reqSkills.filter((s: string) => profileSkills.some((p: string) => p.includes(s) || s.includes(p)));
    const missingSkills = reqSkills.filter((s: string) => !matchingSkills.includes(s));
    
    const skillScore = reqSkills.length > 0 ? Math.round((matchingSkills.length / reqSkills.length) * 100) : 100;
    
    // Education match
    const gradYear = profile.education?.graduationYear?.value || 0;
    const isBatchMatched = job.batches?.length > 0 ? job.batches.includes(gradYear) : true;
    const educationScore = isBatchMatched ? 100 : 50;

    const totalScore = Math.round((skillScore * 0.6) + (educationScore * 0.4));
    const recommendation = totalScore >= 85 ? 'Strong Match' : totalScore >= 70 ? 'Good Match' : totalScore >= 55 ? 'Moderate Match' : 'Weak Match';

    return {
      totalScore,
      componentScores: {
        skills: skillScore,
        education: educationScore,
        experience: 50,
        projects: 50
      },
      matchingSkills: matchingSkills.map((s: string) => s.toUpperCase()),
      missingSkills: missingSkills.map((s: string) => s.toUpperCase()),
      strengths: ['Deterministic skill checks match multiple keywords.'],
      concerns: ['AI Matching Engine was unavailable; score is based on simple keyword matches.'],
      explanation: 'Keyword overlap analysis was used to calculate fit because the AI evaluation failed.',
      recommendation
    };
  }
}
