import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import AnswerMemory from '@/models/AnswerMemory';

export async function GET() {
  try {
    await dbConnect();
    const answers = await AnswerMemory.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ answers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { id, answer, verifiedByUser, autoFillAllowed, deleteId } = body;

    if (deleteId) {
      await AnswerMemory.findByIdAndDelete(deleteId);
      return NextResponse.json({ success: true });
    }

    if (!id) {
      return NextResponse.json({ error: 'Missing answer entry ID' }, { status: 400 });
    }

    const entry = await AnswerMemory.findById(id);
    if (!entry) {
      return NextResponse.json({ error: 'Answer Memory entry not found' }, { status: 404 });
    }

    if (answer !== undefined) entry.answer = answer;
    if (verifiedByUser !== undefined) entry.verifiedByUser = verifiedByUser;
    if (autoFillAllowed !== undefined) entry.autoFillAllowed = autoFillAllowed;

    await entry.save();

    return NextResponse.json({ success: true, answer: entry });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
