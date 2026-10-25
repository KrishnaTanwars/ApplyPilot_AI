import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dbConnect from '@/lib/db/connect';
import Resume from '@/models/Resume';

// Ensure resumes storage directory exists
const RESUMES_DIR = path.join(process.cwd(), 'storage', 'resumes');
if (!fs.existsSync(RESUMES_DIR)) {
  fs.mkdirSync(RESUMES_DIR, { recursive: true });
}

export async function GET() {
  try {
    await dbConnect();
    const resumes = await Resume.find({});
    return NextResponse.json({ resumes });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string || 'General Tech';
    const targetRolesStr = formData.get('targetRoles') as string || '';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // 1. Convert to Buffer and write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Enforce 10MB limit
    if (buffer.length > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
    }

    const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const filePath = path.join(RESUMES_DIR, safeName);
    
    await fs.promises.writeFile(filePath, buffer);

    // 2. Generate file hash for validation & duplicate prevention
    const hash = crypto.createHash('md5').update(buffer).digest('hex');

    // 3. Extract roles array
    const targetRoles = targetRolesStr
      .split(',')
      .map(r => r.trim())
      .filter(r => r.length > 0);

    // 4. Create database entry
    const resumeEntry = await Resume.create({
      originalFilename: file.name,
      safeFilename: safeName,
      category,
      targetRoles,
      extractedSkills: [], // skills will be filled in during job matching if needed
      fileHash: hash,
      isActive: true
    });

    return NextResponse.json({ success: true, resume: resumeEntry });
  } catch (err: any) {
    console.error('Resume upload endpoint failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await dbConnect();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Resume ID is required' }, { status: 400 });
    }

    const resume = await Resume.findById(id);
    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    // Delete file from local filesystem
    const filePath = path.join(RESUMES_DIR, resume.safeFilename);
    if (fs.existsSync(filePath)) {
      try {
        await fs.promises.unlink(filePath);
      } catch (err) {
        console.error('Failed to delete resume file from disk:', err);
      }
    }

    // Delete database record
    await Resume.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
