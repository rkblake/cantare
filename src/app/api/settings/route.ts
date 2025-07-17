import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/database';
import { scanMusicDirectory } from '@/database/utils';
// import type { Settings } from '@/types';

export async function GET(_req: NextRequest) {
  db.read();
  return NextResponse.json(db.data.settings);
}

export async function POST(req: NextRequest) {
  db.read();
  const body = await req.json();
  const { action, ...settingsData } = body;

  if (action === 'scan') {
    const { musicDirectory } = settingsData;
    if (!musicDirectory) {
      return NextResponse.json({ error: 'musicDirectory is required for scan' }, { status: 400 });
    }
    db.data.settings.musicDirectory = musicDirectory;
    db.write();

    try {
      const scanResult = await scanMusicDirectory(musicDirectory);
      db.data.tracks = scanResult.tracks;
      db.data.albums = scanResult.albums;
      db.data.artists = scanResult.artists;
      db.write();
      return NextResponse.json({
        message: 'Scan complete',
        counts: {
          tracks: scanResult.tracks.length,
          albums: scanResult.albums.length,
          artists: scanResult.artists.length
        }
      });
    } catch (error: unknown) {
      console.error('Scan failed: ', error);
      let message = 'An unknown error occurred.';
      if (error instanceof Error) {
        message = error.message;
      }
      return NextResponse.json({ error: 'Scan failed', message }, { status: 500 });
    }
  } else {
    db.data.settings = { ...db.data.settings, ...settingsData };
    db.write();
    return NextResponse.json(db.data.settings);
  }
}
