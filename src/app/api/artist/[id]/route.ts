import { type NextRequest, NextResponse } from 'next/server';
import { getArtist, getAlbums } from '@/database/sqlite';
import type { Album } from '@/types';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  const artist = await getArtist(id);

  if (!artist) {
    return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
  }

  const albums = await getAlbums();
  const artistAlbums = albums.filter((album: Album) => album.artist === artist.name);

  return NextResponse.json({ artist, albums: artistAlbums });
}

