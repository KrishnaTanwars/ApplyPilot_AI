import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Application from '@/models/Application';
import Job from '@/models/Job';
import AnswerMemory from '@/models/AnswerMemory';
import ActivityLog from '@/models/ActivityLog';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const application = await Application.findById(id).populate('jobId');
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    return NextResponse.json({ application });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const { action, answer, saveForFuture, originalQuestion, category, intent } = body;

    const application = await Application.findById(id);
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (action === 'start') {
      // Start Playwright browser
      application.status = 'In Progress';
      application.currentState = 'BROWSER_STARTING';
      application.startedAt = new Date();
      application.logs.push(`${new Date().toLocaleTimeString()} - Launching automated headed session`);
      await application.save();
      
      await ActivityLog.create({
        message: 'Application started by user',
        level: 'info',
        applicationId: application._id,
        jobId: application.jobId
      });

      return NextResponse.json({ success: true, application });
    }

    if (action === 'resume') {
      if (!answer) {
        return NextResponse.json({ error: 'Answer is required to resume' }, { status: 400 });
      }

      // Add to fieldAnswers list
      if (application.humanActionRequired) {
        const questionText = application.humanActionRequired.questionText;
        const currentAnswers = application.fieldAnswers || [];
        
        // Find existing or push
        const existingIdx = currentAnswers.findIndex((a: any) => a.label === questionText);
        const newAns = {
          fieldId: application.humanActionRequired.normalizedIntent || `q_${Date.now()}`,
          label: questionText,
          normalizedLabel: application.humanActionRequired.normalizedIntent || '',
          fieldType: 'text',
          value: answer,
          confidence: 100,
          source: 'manual' as const
        };

        if (existingIdx >= 0) {
          currentAnswers[existingIdx] = newAns;
        } else {
          currentAnswers.push(newAns);
        }

        application.fieldAnswers = currentAnswers;
      }

      // Save for Future check
      if (saveForFuture && originalQuestion) {
        await AnswerMemory.findOneAndUpdate(
          { normalizedIntent: intent || originalQuestion.toLowerCase().replace(/[^a-z0-9]/g, '') },
          {
            originalQuestion,
            answer,
            answerType: 'text',
            category: category || 'UNKNOWN',
            verifiedByUser: true,
            autoFillAllowed: true,
            $inc: { usageCount: 1 }
          },
          { upsert: true }
        );
      }

      // Reset human action, set state back to filling
      application.humanActionRequired = null;
      application.status = 'In Progress';
      application.currentState = 'FORM_FILLING';
      application.logs.push(`${new Date().toLocaleTimeString()} - User provided answer; resuming automation.`);
      await application.save();

      return NextResponse.json({ success: true, application });
    }

    if (action === 'approve_submit') {
      // Transition to SUBMITTING state
      application.status = 'In Progress';
      application.currentState = 'SUBMITTING';
      application.logs.push(`${new Date().toLocaleTimeString()} - User approved submission; clicking submit.`);
      await application.save();

      return NextResponse.json({ success: true, application });
    }

    if (action === 'cancel') {
      application.status = 'Cancelled';
      application.currentState = 'CANCELLED';
      application.logs.push(`${new Date().toLocaleTimeString()} - Application cancelled by user.`);
      await application.save();
      
      return NextResponse.json({ success: true, application });
    }

    return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
