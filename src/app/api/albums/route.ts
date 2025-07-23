import { NextResponse } from 'next/server';
import { getAlbums } from '@/database/sqlite';

export async function GET() {
  const albums = await getAlbums();
  return NextResponse.json(albums);
}
