import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/database';
import type { Album, Track } from '@/types';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  db.read();

  const album = db.data.albums.find((album: Album) => album.id === id);

  if (!album) {
    return NextResponse.json({ error: 'Album not found' }, { status: 404 });
  }

  const tracks = db.data.tracks.filter((track: Track) => track.album === album.name);

  return NextResponse.json({ album, tracks });
}
