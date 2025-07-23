import { type NextRequest, NextResponse } from 'next/server';
import { getArtist, getAlbumsFromArtist } from '@/database/sqlite';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const artist = await getArtist(id);

  if (!artist) {
    return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
  }

  const artistAlbums = await getAlbumsFromArtist(artist);

  let imageUrl = '/images/default-artist.svg';
  if (artistAlbums && artistAlbums.length > 0) {
    const firstAlbum = artistAlbums[0];
    if (firstAlbum?.artworkPath) {
      imageUrl = `/api/artwork/${firstAlbum.id}`;
    }
  }

  return NextResponse.json({ imageUrl });
}


