import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { db } from '@/database/';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('q');

  if (!id) {
    return NextResponse.json({ error: 'Invalid track ID' }, { status: 400 });
  }

  db.read();
  const track = db.data.tracks.find((t: any) => t.id === id);

  if (!track?.filePath) {
    return NextResponse.json({ error: 'Track or file path not found' }, { status: 404 });
  }

  const filePath = track.filePath;

  try {
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    
    const fileStream = fs.createReadStream(filePath);
    const stream = new ReadableStream({
      start(controller) {
        fileStream.on("data", (chunk) => controller.enqueue(chunk));
        fileStream.on("end", () => controller.close());
        fileStream.on("error", (err) => controller.error(err));
      },
    });

    const headers = new Headers();
    headers.set('Content-Length', fileSize.toString());
    headers.set('Content-Type', 'audio/mpeg');

    return new NextResponse(stream, {
      status: 200,
      headers,
    });

  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return NextResponse.json({ error: 'File not found for this track' }, { status: 404 });
    }
    console.error(`Error streaming file ${filePath}: `, error);
    return NextResponse.json({ error: 'Error streaming file' }, { status: 500 });
  }
}
