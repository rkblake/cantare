import { type NextRequest, NextResponse } from 'next/server';
import { getArtist, getAlbumsFromArtist } from '@/database/sqlite';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const artist = await getArtist(id);

  if (!artist) {
    return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
  }

  const albums = await getAlbumsFromArtist(artist);

  return NextResponse.json({ artist, albums });
}

