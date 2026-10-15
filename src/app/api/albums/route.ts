import { NextResponse, type NextRequest } from 'next/server';
import { getAlbums } from '@/database/sqlite';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 20;
  const albums = await getAlbums(page, limit + 1);
  const hasMore = albums.length > limit;
  return NextResponse.json({ data: albums.slice(0, limit), hasMore });
}
