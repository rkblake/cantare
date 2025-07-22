import { type NextRequest, NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/database/sqlite';
import { scanMusicDirectorySql } from '@/database/utils';
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

    try {
      await scanMusicDirectorySql(musicDirectory);

      return NextResponse.json({ message: 'Scan complete', });
    } catch (error: unknown) {
      console.error('Scan failed: ', error);
      let message = 'An unknown error occurred.';
      if (error instanceof Error) {
        message = error.message;
      }
      return NextResponse.json({ error: 'Scan failed', message }, { status: 500 });
    }
  } else {
    await updateSettings(settingsData);
    const settings = await getSettings();
    return NextResponse.json(settings);
  }
}

