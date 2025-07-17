import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/database';
import type { Album, Artist } from '@/types';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  db.read();

  const artist = db.data.artists.find((artist: Artist) => artist.id === id);

  if (!artist) {
    return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
  }

  const albums = db.data.albums.filter((album: Album) => album.artist === artist.name);

  return NextResponse.json({ artist, albums });
}
