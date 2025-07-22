import type { NextApiRequest, NextApiResponse } from 'next';
import { getAlbumCount, getArtistCount, getSettings, getTrackCount, updateSettings } from '@/database/sqlite';
// import { Settings } from '@/types';
import { scanMusicDirectorySql } from '@/database/utils';

type Body = {
  action: string;
  musicDirectory: string;
}

export async function GET(_req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json(await getSettings());
}

export async function POST(req: NextApiRequest, res: NextApiResponse) {
  const { action, ...settingsData } = req.body as Body;

  if (action === 'scan') {
    const { musicDirectory } = settingsData;
    if (!musicDirectory) {
      return res.status(400).json({ error: 'musicDirectory is required for scan' });
    }

    await updateSettings({ musicDirectory });

    try {
      await scanMusicDirectorySql(musicDirectory);
      res.status(200).json({ message: 'Scan complete', counts: { tracks: getTrackCount(), albums: getAlbumCount(), length, artists: getArtistCount() } });
    } catch (error: unknown) {
      console.error('Scan failed: ', error);
      let message = '';
      if (error instanceof Error) message = error.message;
      res.status(500).json({ error: 'Scan failed', message });
    }
  } else {
    await updateSettings(settingsData)

    res.status(200).json(await getSettings());
  }
}

