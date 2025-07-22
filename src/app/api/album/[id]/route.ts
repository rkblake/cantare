import { type NextRequest, NextResponse } from 'next/server';
import { getAlbum, getTracksFromAlbum } from '@/database/sqlite';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const album = await getAlbum(id);

  if (!album) {
    return NextResponse.json({ error: 'Album not found' }, { status: 404 });
  }

  const tracks = await getTracksFromAlbum(album);

  return NextResponse.json({ album, tracks });
}

