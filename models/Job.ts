import mongoose, { Schema, Document } from 'mongoose';

export interface IJob extends Document {
  rawMessage: string;
  sourceType: 'whatsapp' | 'direct_url';
  company: string;
  role: string;
  location: string;
  workMode: 'remote' | 'hybrid' | 'onsite' | 'unknown';
  employmentType: 'full-time' | 'internship' | 'part-time' | 'unknown';
  experienceMin: number;
  experienceMax: number;
  qualifications: string[];
  batches: number[];
  requiredSkills: string[];
  preferredSkills: string[];
  salary: string;
  deadline?: Date;
  originalUrl: string;
  normalizedUrl: string;
  finalUrl: string;
  domain: string;
  atsType: 'greenhouse' | 'lever' | 'ashby' | 'workday' | 'generic' | 'unknown';
  status: 'new' | 'analyzed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>({
  rawMessage: { type: String, default: '' },
  sourceType: { type: String, enum: ['whatsapp', 'direct_url'], default: 'direct_url' },
  company: { type: String, required: true },
  role: { type: String, required: true },
  location: { type: String, default: 'unknown' },
  workMode: { type: String, enum: ['remote', 'hybrid', 'onsite', 'unknown'], default: 'unknown' },
  employmentType: { type: String, enum: ['full-time', 'internship', 'part-time', 'unknown'], default: 'unknown' },
  experienceMin: { type: Number, default: 0 },
  experienceMax: { type: Number, default: 0 },
  qualifications: [{ type: String }],
  batches: [{ type: Number }],
  requiredSkills: [{ type: String }],
  preferredSkills: [{ type: String }],
  salary: { type: String, default: '' },
  deadline: { type: Date },
  originalUrl: { type: String, default: '' },
  normalizedUrl: { type: String, required: true, index: true },
  finalUrl: { type: String, default: '' },
  domain: { type: String, default: '' },
  atsType: {
    type: String,
    enum: ['greenhouse', 'lever', 'ashby', 'workday', 'generic', 'unknown'],
    default: 'unknown'
  },
  status: { type: String, enum: ['new', 'analyzed', 'failed'], default: 'new' }
}, {
  timestamps: true
});

export default mongoose.models.Job || mongoose.model<IJob>('Job', JobSchema);
