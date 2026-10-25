import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import ActivityLog from '@/models/ActivityLog';

export async function GET() {
  try {
    await dbConnect();
    const logs = await ActivityLog.find({})
      .populate('jobId')
      .populate('applicationId')
      .sort({ timestamp: -1 })
      .limit(100);
      
    return NextResponse.json({ logs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
