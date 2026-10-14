import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { stat } from 'fs/promises';
import { artworkDir } from '@/database/paths';

const imageMimeTypes: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  const safeFilename = path.basename(filename);
  const filePath = path.join(artworkDir, safeFilename);

  // Guard against path traversal.
  if (!filePath.startsWith(artworkDir + path.sep)) {
    return new NextResponse('Not found', { status: 404 });
  }

  try {
    const stats = await stat(filePath);
    if (!stats.isFile()) {
      return new NextResponse('Not found', { status: 404 });
    }

    const fileBuffer = await fs.readFile(filePath);
    const contentType = imageMimeTypes[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
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
