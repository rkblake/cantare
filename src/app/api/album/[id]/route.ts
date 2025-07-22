import { type NextRequest, NextResponse } from 'next/server';
import { getAlbum, getTracks } from '@/database/sqlite';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const album = await getAlbum(id);

  if (!album) {
    return NextResponse.json({ error: 'Album not found' }, { status: 404 });
  }

  const allTracks = await getTracks();
  const albumTracks = allTracks.filter((track) => track.album === album.name);

  return NextResponse.json({ album, tracks: albumTracks });
}

