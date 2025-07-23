import { type NextRequest, NextResponse } from 'next/server';
import { getTracks, getAlbums, getArtists } from '@/database/sqlite';
import type { Track, Album, Artist } from '@/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');

  if (!q || typeof q !== 'string' || q.trim() === '') {
    // Return a default set of data if no query is provided
    const tracks = await getTracks();
    const albums = await getAlbums();
    const artists = await getArtists();

    const recentTracks = tracks.slice(-10).reverse();
    const recentAlbums = albums.slice(-10).reverse();
    const featuredArtists = artists.slice(-10).reverse();

    return NextResponse.json({
      tracks: recentTracks,
      albums: recentAlbums,
      artists: featuredArtists,
    });
  }

  const query = q.toLowerCase().trim();

  const tracks = await getTracks();
  const albums = await getAlbums();
  const artists = await getArtists();

  const filteredTracks = tracks.filter((track: Track) =>
    track.title?.toLowerCase().includes(query) ??
    track.artist?.toLowerCase().includes(query) ??
    track.album?.toLowerCase().includes(query)
  );

  const filteredAlbums = albums.filter((album: Album) =>
    album.name?.toLowerCase().includes(query) ??
    album.artist?.toLowerCase().includes(query)
  );

  const filteredArtists = artists.filter((artist: Artist) =>
    artist.name?.toLowerCase().includes(query)
  );

  return NextResponse.json({
    tracks: filteredTracks,
    albums: filteredAlbums,
    artists: filteredArtists,
  });
}

