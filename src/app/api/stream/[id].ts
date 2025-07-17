import type { NextApiRequest, NextApiResponse } from "next";
import fs from 'fs';
// import path from 'path';
import { db } from '@/database/';
// import { Track } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid track ID' });
  }

  db.read()
  const track = db.data.tracks.find(t => t.id === id);

  if (!track || !track.filePath) {
    return res.status(404).json({ error: 'Track or file path not found' });
  }

  const filePath = track.filePath;

  try {
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range ?? 'bytes=0-';

    if (range) {
      const parts = range.replace(/bytes=/, "").split('-');
      if (parts.length > 0) {
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        if (!isNaN(start) && !isNaN(end)) {
          const chunksize = (end - start) + 1;
          if (chunksize > 0) {
            const file = fs.createReadStream(filePath, { start, end });
            if (file) {
              const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'audio/mpeg', // TODO: dynamic based on file type
              };
              res.writeHead(206, head);
              file.pipe(res);
            }
          }
        }
      }
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg',
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return res.status(404).json({ error: 'File not found for this track' });
    }
    console.error(`Error streaming file ${filePath}: `, error);
    res.status(500).json({ error: 'Error streaming file' });
  }
}
