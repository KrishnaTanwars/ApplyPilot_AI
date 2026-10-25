import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import SystemSetting from '@/models/SystemSetting';

export async function GET() {
  try {
    await dbConnect();
    const settingsList = await SystemSetting.find({});
    // Map list to key-value object
    const settings: Record<string, any> = {};
    settingsList.forEach(s => {
      settings[s.key] = s.value;
    });
    return NextResponse.json({ settings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    for (const key of Object.keys(body)) {
      await SystemSetting.findOneAndUpdate(
        { key },
        { value: body[key] },
        { upsert: true }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
