import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/database';
import type { Artist, Album } from '@/types';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  db.read();

  const artist = db.data.artists.find((artist: Artist) => artist.id === id);

  if (!artist) {
    return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
  }

  const firstAlbum: Album | undefined = db.data.albums.find(a => a.id === artist.albumIds[0]);
  const imageUrl = firstAlbum?.artworkPath ? `/api/artwork/${firstAlbum.id}` : '/images/default-artist.svg';

  return NextResponse.json({ imageUrl });
}
