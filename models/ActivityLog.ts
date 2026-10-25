import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityLog extends Document {
  timestamp: Date;
  message: string;
  level: 'trace' | 'debug' | 'info' | 'warn' | 'error';
  jobId?: mongoose.Types.ObjectId;
  applicationId?: mongoose.Types.ObjectId;
  details?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>({
  timestamp: { type: Date, default: Date.now, index: true },
  message: { type: String, required: true },
  level: {
    type: String,
    enum: ['trace', 'debug', 'info', 'warn', 'error'],
    default: 'info',
    index: true
  },
  jobId: { type: Schema.Types.ObjectId, ref: 'Job' },
  applicationId: { type: Schema.Types.ObjectId, ref: 'Application' },
  details: { type: Schema.Types.Map, of: Schema.Types.Mixed }
}, {
  timestamps: true
});

export default mongoose.models.ActivityLog || mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
