import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import UserProfile from '@/models/UserProfile';

export async function GET() {
  try {
    await dbConnect();
    const profile = await UserProfile.findOne();
    return NextResponse.json({ profile });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { personal, professional, education, links, workAuthorization, skills, projects, experience, certifications } = body;

    let profile = await UserProfile.findOne();
    if (!profile) {
      profile = new UserProfile({});
    }

    const updateField = (section: string, sourceData: any) => {
      if (!sourceData) return;
      
      // If the field is a top-level array value (like skills)
      if (section === 'skills') {
        profile.skills = {
          value: sourceData,
          source: 'manual',
          verified: true,
          lastUpdated: new Date()
        };
        return;
      }

      if (['projects', 'experience', 'certifications'].includes(section)) {
        profile[section] = {
          value: sourceData,
          source: 'manual',
          verified: true,
          lastUpdated: new Date()
        };
        return;
      }

      // If it is a nested section (like personal, professional, education)
      Object.keys(sourceData).forEach(key => {
        if (profile[section][key]) {
          profile[section][key].value = sourceData[key];
          profile[section][key].source = 'manual';
          profile[section][key].verified = true;
          profile[section][key].lastUpdated = new Date();
        } else {
          // Initialize key if it doesn't exist in schema model
          profile[section][key] = {
            value: sourceData[key],
            source: 'manual',
            verified: true,
            lastUpdated: new Date()
          };
        }
      });
    };

    updateField('personal', personal);
    updateField('professional', professional);
    updateField('education', education);
    updateField('links', links);
    updateField('workAuthorization', workAuthorization);
    updateField('skills', skills);
    updateField('projects', projects);
    updateField('experience', experience);
    updateField('certifications', certifications);

    profile.isOnboarded = true;
    await profile.save();

    return NextResponse.json({ success: true, profile });
  } catch (err: any) {
    console.error('Failed to update UserProfile:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
