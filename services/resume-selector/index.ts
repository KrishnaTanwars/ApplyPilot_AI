import Resume from '@/models/Resume';
import { aiSelectResume } from '@/lib/ai/gemini';
import { ResumeSelectionResult } from '@/schemas/ai';

export interface SelectedResumeInfo {
  resumeId: string;
  filename: string;
  category: string;
  confidenceScore: number;
  reasons: string[];
  alternativeResumeId?: string;
  alternativeFilename?: string;
}

/**
 * Automatically evaluates active resumes and selects the best one for a job.
 */
export async function selectBestResume(job: any): Promise<SelectedResumeInfo | null> {
  // 1. Fetch active resumes
  const activeResumes = await Resume.find({ isActive: true });
  
  if (activeResumes.length === 0) {
    return null;
  }

  // If only one active resume, return it immediately
  if (activeResumes.length === 1) {
    const single = activeResumes[0];
    return {
      resumeId: single._id.toString(),
      filename: single.originalFilename,
      category: single.category,
      confidenceScore: 100,
      reasons: ['Only one active resume is available.']
    };
  }

  // 2. Call AI selector to determine the ideal category for the job
  let aiResult: ResumeSelectionResult;
  try {
    aiResult = await aiSelectResume(job);
  } catch (err) {
    console.error('AI resume selection failed, falling back to default:', err);
    // Fallback: select first resume
    const first = activeResumes[0];
    return {
      resumeId: first._id.toString(),
      filename: first.originalFilename,
      category: first.category,
      confidenceScore: 50,
      reasons: ['AI selector failed; defaulted to the first active resume.']
    };
  }

  // 3. Match AI suggestion with active resumes
  let chosen = activeResumes.find(r => r.category === aiResult.selectedResumeCategory);
  
  // If not found, try to search by target roles or fall back to general tech / first resume
  if (!chosen) {
    chosen = activeResumes.find(r => r.category === 'General Tech') || activeResumes[0];
  }

  // Find alternative if suggested
  let altResume;
  if (aiResult.alternativeCategory) {
    altResume = activeResumes.find(r => r.category === aiResult.alternativeCategory && r._id.toString() !== chosen._id.toString());
  }

  return {
    resumeId: chosen._id.toString(),
    filename: chosen.originalFilename,
    category: chosen.category,
    confidenceScore: aiResult.confidenceScore,
    reasons: aiResult.reasons,
    alternativeResumeId: altResume?._id.toString(),
    alternativeFilename: altResume?.originalFilename
  };
}
