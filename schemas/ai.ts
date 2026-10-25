import { z } from 'zod';

export const ParsedJobMessageSchema = z.object({
  company: z.string().describe('Name of the company hiring'),
  role: z.string().describe('Job title or role name'),
  location: z.string().default('unknown').describe('Job location'),
  workMode: z.enum(['remote', 'hybrid', 'onsite', 'unknown']).default('unknown'),
  employmentType: z.enum(['full-time', 'internship', 'part-time', 'unknown']).default('unknown'),
  salary: z.string().default('').describe('Salary details if mentioned'),
  experienceMin: z.number().default(0).describe('Minimum years of experience required'),
  experienceMax: z.number().default(0).describe('Maximum years of experience if mentioned, else 0'),
  qualifications: z.array(z.string()).default([]).describe('Required degrees or courses'),
  branches: z.array(z.string()).default([]).describe('Allowed branches of study (e.g. CSE, IT)'),
  batches: z.array(z.number()).default([]).describe('Eligible graduation batch years (e.g. 2026, 2027)'),
  requiredSkills: z.array(z.string()).default([]).describe('Mandatory skills required for the role'),
  preferredSkills: z.array(z.string()).default([]).describe('Preferred/bonus skills'),
  deadline: z.string().default('').describe('Deadline string if mentioned'),
  confidenceScore: z.number().min(0).max(100).describe('AI confidence score in extraction')
});

export type ParsedJobMessage = z.infer<typeof ParsedJobMessageSchema>;

export const OfficialJobDataSchema = z.object({
  company: z.string(),
  role: z.string(),
  location: z.string().default('unknown'),
  workMode: z.enum(['remote', 'hybrid', 'onsite', 'unknown']).default('unknown'),
  employmentType: z.enum(['full-time', 'internship', 'part-time', 'unknown']).default('unknown'),
  salary: z.string().default(''),
  experienceMin: z.number().default(0),
  experienceMax: z.number().default(0),
  qualifications: z.array(z.string()).default([]),
  branches: z.array(z.string()).default([]),
  batches: z.array(z.number()).default([]),
  requiredSkills: z.array(z.string()).default([]),
  preferredSkills: z.array(z.string()).default([]),
  atsType: z.enum(['greenhouse', 'lever', 'ashby', 'workday', 'generic', 'unknown']).default('unknown'),
  jobDescriptionSummary: z.string().describe('A 2-3 sentence summary of what the job does')
});

export type OfficialJobData = z.infer<typeof OfficialJobDataSchema>;

export const EligibilityResultSchema = z.object({
  eligibility: z.enum(['ELIGIBLE', 'LIKELY_ELIGIBLE', 'UNCERTAIN', 'NOT_ELIGIBLE']),
  reasons: z.array(z.string()).describe('Detailed reasons explaining the eligibility decision'),
  missingRequirements: z.array(z.string()).describe('Specific requirements from the job description that the user is missing')
});

export type EligibilityResult = z.infer<typeof EligibilityResultSchema>;

export const MatchResultSchema = z.object({
  totalScore: z.number().min(0).max(100).describe('Overall match score out of 100'),
  componentScores: z.object({
    skills: z.number().min(0).max(100),
    education: z.number().min(0).max(100),
    experience: z.number().min(0).max(100),
    projects: z.number().min(0).max(100)
  }),
  matchingSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  strengths: z.array(z.string()).describe('Strong matching points'),
  concerns: z.array(z.string()).describe('Potential warning flags or gaps'),
  explanation: z.string().describe('A paragraph explaining the match score and fit'),
  recommendation: z.enum(['Strong Match', 'Good Match', 'Moderate Match', 'Weak Match'])
});

export type MatchResult = z.infer<typeof MatchResultSchema>;

export const ResumeSelectionResultSchema = z.object({
  selectedResumeCategory: z.enum(['Data Analyst', 'BI Analyst', 'AI/ML', 'Python', 'General Tech', 'Custom']),
  confidenceScore: z.number().min(0).max(100),
  reasons: z.array(z.string()).describe('Why this resume was selected'),
  alternativeCategory: z.enum(['Data Analyst', 'BI Analyst', 'AI/ML', 'Python', 'General Tech', 'Custom']).optional()
});

export type ResumeSelectionResult = z.infer<typeof ResumeSelectionResultSchema>;

export const QuestionClassificationSchema = z.object({
  category: z.enum([
    'SAFE_PROFILE', 'SAFE_EDUCATION', 'SAFE_SKILLS', 'SAFE_PROJECT', 'PREFERENCE',
    'SALARY', 'WORK_AUTHORIZATION', 'VISA', 'SPONSORSHIP', 'RELOCATION',
    'LEGAL_DECLARATION', 'DEMOGRAPHIC', 'DISABILITY', 'VETERAN_STATUS',
    'CRIMINAL_HISTORY', 'CONFLICT_OF_INTEREST', 'BACKGROUND_CHECK', 'ASSESSMENT', 'UNKNOWN'
  ]),
  normalizedIntent: z.string().describe('Lower_snake_case key identifying the intent, e.g. visa_sponsorship_needed, relocation_willingness'),
  needsHumanInput: z.boolean().describe('True if user interaction is required (sensitive categories or missing data)'),
  explanation: z.string().describe('Reason for this classification'),
  suggestedAnswer: z.string().default('').describe('Best guess answer based on profile or standard response (if safe)')
});

export type QuestionClassification = z.infer<typeof QuestionClassificationSchema>;

export const FieldMappingSuggestionSchema = z.object({
  mappedProfileKey: z.string().describe('The dotted profile path, e.g. personal.fullName, or link to answer memory, or empty if unknown'),
  confidence: z.number().min(0).max(100),
  explanation: z.string()
});

export type FieldMappingSuggestion = z.infer<typeof FieldMappingSuggestionSchema>;
