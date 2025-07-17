import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/database';
// import { Settings } from '@/types';
import { scanMusicDirectory } from '@/database/utils';

type Body = {
  action: string;
  musicDirectory: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  db.read();

  if (req.method === 'GET') {
    res.status(200).json(db.data.settings);
  } else if (req.method === 'POST') {
    const { action, ...settingsData } = req.body as Body;

    if (action === 'scan') {
      const { musicDirectory } = settingsData;
      if (!musicDirectory) {
        return res.status(400).json({ error: 'musicDirectory is required for scan' });
      }
      db.data.settings.musicDirectory = musicDirectory;
      db.write();

      try {
        const scanResult = await scanMusicDirectory(musicDirectory);
        db.data.tracks = scanResult.tracks;
        db.data.albums = scanResult.albums;
        db.data.artists = scanResult.artists;
        db.write();
        res.status(200).json({ message: 'Scan complete', counts: { tracks: scanResult.tracks.length, albums: scanResult.albums, length, artists: scanResult.artists.length } });
      } catch (error: unknown) {
        console.error('Scan failed: ', error);
        let message;
        if (error instanceof Error) message = error.message;
        res.status(500).json({ error: 'Scan failed', message });
      }
    } else {
      db.data.settings = { ...db.data.settings, ...settingsData };
      db.write();
      res.status(200).json(db.data.settings);
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end('Method ${req.method} Not Allowed');
  }
}
