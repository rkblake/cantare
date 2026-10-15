import { type NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import { getTrack } from '@/database/sqlite';
import path from 'path';

const mimeTypes: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.flac': 'audio/flac',
  '.ogg': 'audio/ogg',
  '.oga': 'audio/ogg',
  '.opus': 'audio/ogg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.aiff': 'audio/aiff',
  '.aif': 'audio/aiff',
  '.wma': 'audio/x-ms-wma',
};

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('q');

  if (!id) {
    return NextResponse.json({ error: 'Invalid track ID' }, { status: 400 });
  }

  const track = await getTrack(id);

  if (!track?.filePath) {
    return NextResponse.json({ error: 'Track or file path not found' }, { status: 404 });
  }

  const filePath = track.filePath;

  try {
    const stat = await fs.stat(filePath);
    const fileSize = stat.size;
    const range = req.headers.get('range');

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] ?? 'application/octet-stream';

    if (range) {
      const rangeMatch = /^bytes=(\d*)-(\d*)$/.exec(range);
      const startStr = rangeMatch?.[1] ?? '';
      const endStr = rangeMatch?.[2] ?? '';
      const hasStart = startStr !== '';
      const hasEnd = endStr !== '';

      let start: number;
      let end: number;
      if (!hasStart && hasEnd) {
        // Suffix range: the last N bytes of the file.
        const suffixLength = parseInt(endStr, 10);
        start = Math.max(fileSize - suffixLength, 0);
        end = fileSize - 1;
      } else {
        start = parseInt(startStr, 10);
        end = hasEnd ? parseInt(endStr, 10) : fileSize - 1;
      }

      if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || start > end || start >= fileSize) {
        return new NextResponse(null, {
          status: 416,
          headers: { 'Content-Range': `bytes */${fileSize}` },
        });
      }

      end = Math.min(end, fileSize - 1);
      const chunksize = (end - start) + 1;

      const file = await fs.open(filePath, 'r');
      const buffer = Buffer.alloc(chunksize);
      await file.read(buffer, 0, chunksize, start);
      await file.close();

      const headers = new Headers();
      headers.set('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      headers.set('Accept-Ranges', 'bytes');
      headers.set('Content-Length', chunksize.toString());
      headers.set('Content-Type', contentType);

      return new NextResponse(buffer, {
        status: 206,
        headers,
      });
    } else {
      const file = await fs.open(filePath, 'r');
      const stream = new ReadableStream({
        async start(controller) {
          const buffer = Buffer.alloc(1024 * 1024); // 1MB chunks
          while (true) {
            const { bytesRead } = await file.read(buffer, 0, buffer.length, null);
            if (bytesRead === 0) {
              break;
            }
            controller.enqueue(buffer.slice(0, bytesRead));
          }
          await file.close();
          controller.close();
        },
      });

      const headers = new Headers();
      headers.set('Accept-Ranges', 'bytes');
      headers.set('Content-Length', fileSize.toString());
      headers.set('Content-Type', contentType);

      return new NextResponse(stream, {
        status: 200,
        headers,
      });
    }
  } catch (error) {

    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return NextResponse.json({ error: 'File not found for this track' }, { status: 404 });
    }
    console.error(`Error streaming file ${filePath}: `, error);
    return NextResponse.json({ error: 'Error streaming file' }, { status: 500 });
  }
}
