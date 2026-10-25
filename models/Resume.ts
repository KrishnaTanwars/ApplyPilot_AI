import mongoose, { Schema, Document } from 'mongoose';

export interface IResume extends Document {
  originalFilename: string;
  safeFilename: string;
  category: 'Data Analyst' | 'BI Analyst' | 'AI/ML' | 'Python' | 'General Tech' | 'Custom';
  targetRoles: string[];
  extractedSkills: string[];
  fileHash: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ResumeSchema = new Schema<IResume>({
  originalFilename: { type: String, required: true },
  safeFilename: { type: String, required: true, unique: true },
  category: {
    type: String,
    enum: ['Data Analyst', 'BI Analyst', 'AI/ML', 'Python', 'General Tech', 'Custom'],
    default: 'General Tech'
  },
  targetRoles: [{ type: String }],
  extractedSkills: [{ type: String }],
  fileHash: { type: String, required: true },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

export default mongoose.models.Resume || mongoose.model<IResume>('Resume', ResumeSchema);
