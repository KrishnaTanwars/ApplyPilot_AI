import mongoose, { Schema, Document } from 'mongoose';

export type ApplicationState =
  | 'RECEIVED' | 'PARSING' | 'PARSED' | 'URL_VALIDATING' | 'URL_VALIDATED' | 'PAGE_READING' | 'PAGE_READ'
  | 'ANALYZING' | 'ANALYZED' | 'ELIGIBILITY_CHECKING' | 'ELIGIBLE' | 'INELIGIBLE' | 'RESUME_SELECTING'
  | 'READY_TO_APPLY' | 'BROWSER_STARTING' | 'APPLICATION_OPENED' | 'FORM_SCANNING' | 'FORM_FILLING'
  | 'WAITING_FOR_USER' | 'WAITING_FOR_CAPTCHA' | 'WAITING_FOR_LOGIN' | 'WAITING_FOR_OTP' | 'REVIEW_REQUIRED'
  | 'SUBMITTING' | 'SUBMITTED' | 'FAILED' | 'CANCELLED';

export interface IApplication extends Document {
  jobId: mongoose.Types.ObjectId;
  selectedResumeId?: mongoose.Types.ObjectId;
  status: 'Analyzed' | 'Ready' | 'In Progress' | 'Waiting for User' | 'Review Required' | 'Submitted' | 'Failed' | 'Skipped' | 'Not Eligible' | 'Cancelled';
  currentState: ApplicationState;
  currentUrl: string;
  currentStep: string;
  atsType: 'greenhouse' | 'lever' | 'ashby' | 'workday' | 'generic' | 'unknown';
  startedAt?: Date;
  submittedAt?: Date;
  pausedAt?: Date;
  failureReason?: string;
  humanActionRequired?: {
    questionText: string;
    reason: string;
    category: string;
    options?: string[];
    normalizedIntent?: string;
  } | null;
  matchScore: number;
  eligibility: 'ELIGIBLE' | 'LIKELY_ELIGIBLE' | 'UNCERTAIN' | 'NOT_ELIGIBLE';
  fieldAnswers: Array<{
    fieldId: string;
    label: string;
    normalizedLabel: string;
    fieldType: string;
    value: string;
    confidence: number;
    source: string; // profile, memory, manual
  }>;
  screenshots: string[]; // paths to local saved files
  logs: string[]; // human readable step logs
  submissionEvidence?: {
    timestamp: Date;
    finalUrl: string;
    confirmationText?: string;
    screenshotPath?: string;
    applicationId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema = new Schema<IApplication>({
  jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
  selectedResumeId: { type: Schema.Types.ObjectId, ref: 'Resume' },
  status: {
    type: String,
    enum: ['Analyzed', 'Ready', 'In Progress', 'Waiting for User', 'Review Required', 'Submitted', 'Failed', 'Skipped', 'Not Eligible', 'Cancelled'],
    default: 'Analyzed'
  },
  currentState: { type: String, default: 'RECEIVED' },
  currentUrl: { type: String, default: '' },
  currentStep: { type: String, default: 'Initialization' },
  atsType: { type: String, enum: ['greenhouse', 'lever', 'ashby', 'workday', 'generic', 'unknown'], default: 'unknown' },
  startedAt: { type: Date },
  submittedAt: { type: Date },
  pausedAt: { type: Date },
  failureReason: { type: String },
  humanActionRequired: {
    questionText: { type: String },
    reason: { type: String },
    category: { type: String },
    options: [{ type: String }],
    normalizedIntent: { type: String }
  },
  matchScore: { type: Number, default: 0 },
  eligibility: { type: String, enum: ['ELIGIBLE', 'LIKELY_ELIGIBLE', 'UNCERTAIN', 'NOT_ELIGIBLE'], default: 'UNCERTAIN' },
  fieldAnswers: [{
    fieldId: { type: String, required: true },
    label: { type: String, required: true },
    normalizedLabel: { type: String, default: '' },
    fieldType: { type: String, required: true },
    value: { type: String, default: '' },
    confidence: { type: Number, default: 1.0 },
    source: { type: String, default: 'profile' }
  }],
  screenshots: [{ type: String }],
  logs: [{ type: String }],
  submissionEvidence: {
    timestamp: { type: Date },
    finalUrl: { type: String },
    confirmationText: { type: String },
    screenshotPath: { type: String },
    applicationId: { type: String }
  }
}, {
  timestamps: true
});

export default mongoose.models.Application || mongoose.model<IApplication>('Application', ApplicationSchema);
