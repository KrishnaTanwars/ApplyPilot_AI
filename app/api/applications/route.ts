import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Application from '@/models/Application';
import Job from '@/models/Job';

export async function GET() {
  try {
    await dbConnect();
    // Populate the linked Job document to display company and role names in tables
    const applications = await Application.find({})
      .populate('jobId')
      .sort({ createdAt: -1 });
      
    return NextResponse.json({ applications });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
