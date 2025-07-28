import { NextResponse, type NextRequest } from 'next/server';
import { getArtists } from '@/database/sqlite';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 20;
  const artists = await getArtists(page, limit);
  const hasMore = artists.length === limit;
  return NextResponse.json({ data: artists, hasMore });
}
