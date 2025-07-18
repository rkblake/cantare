import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { stat } from 'fs/promises';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  const artworkDir = path.join(process.cwd(), '.data', 'artwork');
  const filePath = path.join(artworkDir, filename) + '.jpeg';

  try {
    const stats = await stat(filePath);
    if (!stats.isFile()) {
      return new NextResponse('Not found', { status: 404 });
    }

    const fileBuffer = await fs.readFile(filePath);
    console.log('here');
    const extension = path.extname(filename).slice(1);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': `image/${extension}`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return new NextResponse('Not found', { status: 404 });
    }
    console.error(`Failed to serve artwork ${filename}:`, error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
