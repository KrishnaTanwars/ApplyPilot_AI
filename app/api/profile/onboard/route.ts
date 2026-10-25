import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import UserProfile from '@/models/UserProfile';
import SystemSetting from '@/models/SystemSetting';

export async function GET() {
  try {
    await dbConnect();
    const profile = await UserProfile.findOne();
    return NextResponse.json({ profile });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { personal, professional, workAuthorization, policy } = body;

    const profile = await UserProfile.findOne();
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Update personal fields
    if (personal) {
      Object.keys(personal).forEach(key => {
        if (profile.personal[key]) {
          profile.personal[key].value = personal[key];
          profile.personal[key].lastUpdated = new Date();
          profile.personal[key].verified = true;
        }
      });
    }

    // Update professional fields
    if (professional) {
      Object.keys(professional).forEach(key => {
        if (profile.professional[key]) {
          profile.professional[key].value = professional[key];
          profile.professional[key].lastUpdated = new Date();
          profile.professional[key].verified = true;
        }
      });
    }

    // Update work auth fields
    if (workAuthorization) {
      Object.keys(workAuthorization).forEach(key => {
        if (profile.workAuthorization[key]) {
          profile.workAuthorization[key].value = workAuthorization[key];
          profile.workAuthorization[key].lastUpdated = new Date();
          profile.workAuthorization[key].verified = true;
        }
      });
    }

    // Save profile and mark onboarding complete
    profile.isOnboarded = true;
    await profile.save();

    // Save policy systems settings
    if (policy) {
      await SystemSetting.findOneAndUpdate(
        { key: 'application_policy' },
        { value: policy.applicationPolicy || 'Always Review Before Submit' },
        { upsert: true }
      );
      await SystemSetting.findOneAndUpdate(
        { key: 'browser_mode' },
        { value: policy.browserMode || 'Headed' },
        { upsert: true }
      );
    }

    return NextResponse.json({ success: true, profile });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
