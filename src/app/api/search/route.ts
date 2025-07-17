import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/database';
import type { Track, Album, Artist } from '@/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');

  db.read();

  if (!q || typeof q !== 'string' || q.trim() === '') {
    // Return a default set of data if no query is provided
    const recentTracks = db.data.tracks.slice(-10).reverse();
    const recentAlbums = db.data.albums.slice(-10).reverse();
    const featuredArtists = db.data.artists.slice(-10).reverse();

    return NextResponse.json({
      tracks: recentTracks,
      albums: recentAlbums,
      artists: featuredArtists,
    });
  }

  const query = q.toLowerCase().trim();

  const filteredTracks = db.data.tracks.filter((track: Track) =>
    track.title?.toLowerCase().includes(query) ??
    track.artist?.toLowerCase().includes(query) ??
    track.album?.toLowerCase().includes(query)
  );

  const filteredAlbums = db.data.albums.filter((album: Album) =>
    album.name?.toLowerCase().includes(query) ??
    album.artist?.toLowerCase().includes(query)
  );

  const filteredArtists = db.data.artists.filter((artist: Artist) =>
    artist.name?.toLowerCase().includes(query)
  );

  return NextResponse.json({
    tracks: filteredTracks,
    albums: filteredAlbums,
    artists: filteredArtists,
  });
}
