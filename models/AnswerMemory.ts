import mongoose, { Schema, Document } from 'mongoose';

export interface IAnswerMemory extends Document {
  originalQuestion: string;
  normalizedIntent: string; // e.g., 'relocation_willingness', 'visa_sponsorship_needed'
  answer: string;
  answerType: 'text' | 'select' | 'checkbox' | 'radio' | 'boolean' | 'unknown';
  category:
    | 'SAFE_PROFILE' | 'SAFE_EDUCATION' | 'SAFE_SKILLS' | 'SAFE_PROJECT' | 'PREFERENCE'
    | 'SALARY' | 'WORK_AUTHORIZATION' | 'VISA' | 'SPONSORSHIP' | 'RELOCATION'
    | 'LEGAL_DECLARATION' | 'DEMOGRAPHIC' | 'DISABILITY' | 'VETERAN_STATUS'
    | 'CRIMINAL_HISTORY' | 'CONFLICT_OF_INTEREST' | 'BACKGROUND_CHECK' | 'ASSESSMENT' | 'UNKNOWN';
  verifiedByUser: boolean;
  autoFillAllowed: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const AnswerMemorySchema = new Schema<IAnswerMemory>({
  originalQuestion: { type: String, required: true },
  normalizedIntent: { type: String, required: true, index: true },
  answer: { type: String, required: true },
  answerType: {
    type: String,
    enum: ['text', 'select', 'checkbox', 'radio', 'boolean', 'unknown'],
    default: 'unknown'
  },
  category: {
    type: String,
    enum: [
      'SAFE_PROFILE', 'SAFE_EDUCATION', 'SAFE_SKILLS', 'SAFE_PROJECT', 'PREFERENCE',
      'SALARY', 'WORK_AUTHORIZATION', 'VISA', 'SPONSORSHIP', 'RELOCATION',
      'LEGAL_DECLARATION', 'DEMOGRAPHIC', 'DISABILITY', 'VETERAN_STATUS',
      'CRIMINAL_HISTORY', 'CONFLICT_OF_INTEREST', 'BACKGROUND_CHECK', 'ASSESSMENT', 'UNKNOWN'
    ],
    default: 'UNKNOWN'
  },
  verifiedByUser: { type: Boolean, default: false },
  autoFillAllowed: { type: Boolean, default: false },
  usageCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Avoid duplicate entries of the same intent for global scope or query them easily
AnswerMemorySchema.index({ normalizedIntent: 1, answer: 1 });

export default mongoose.models.AnswerMemory || mongoose.model<IAnswerMemory>('AnswerMemory', AnswerMemorySchema);
