import { type NextRequest, NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/database/sqlite';
import type { Settings } from '@/types';

export async function GET(_req: NextRequest) {
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  const body = await req.json() as { action: string, settingsData: Settings };
  const { action, settingsData } = body;

  if (action === 'scan') {
    const musicDirectory = settingsData?.musicDirectory;
    if (!musicDirectory) {
      return NextResponse.json({ error: 'musicDirectory is required for scan' }, { status: 400 });
    }

    await updateSettings({ musicDirectory });

    // The scan is now initiated, but progress is handled by the /api/settings/scan endpoint.
    // This endpoint simply confirms the scan has been initiated.
    return NextResponse.json({ message: 'Scan initiated' });
  } else {
    await updateSettings(settingsData);
    const settings = await getSettings();
    return NextResponse.json(settings);
  }
}

