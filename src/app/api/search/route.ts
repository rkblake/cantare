import { type NextRequest, NextResponse } from 'next/server';
import { getTracks, getAllAlbums, getAllArtistsWithImage } from '@/database/sqlite';
import type { Track, Album, ArtistWithImage } from '@/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');

  if (!q || q.trim() === '') {
    return NextResponse.json({ tracks: [], albums: [], artists: [] });
  }

  const query = q.toLowerCase().trim();

  const tracks = await getTracks();
  const albums = await getAllAlbums();
  const artists = await getAllArtistsWithImage();

  const filteredTracks = tracks.filter((track: Track) => {
    const matchesTitle = track.title?.toLowerCase().includes(query) ?? false;
    const matchesArtist = track.artist?.name?.toLowerCase().includes(query) ?? false;
    const matchesAlbum = track.album?.name?.toLowerCase().includes(query) ?? false;
    return matchesTitle || matchesArtist || matchesAlbum;
  });

  const filteredAlbums = albums.filter((album: Album) => {
    const matchesName = album.name?.toLowerCase().includes(query) ?? false;
    const matchesArtist = album.artist?.toLowerCase().includes(query) ?? false;
    return matchesName || matchesArtist;
  });

  const filteredArtists = artists.filter((artist: ArtistWithImage) =>
    artist.name?.toLowerCase().includes(query)
  );

  return NextResponse.json({
    tracks: filteredTracks,
    albums: filteredAlbums,
    artists: filteredArtists,
  });
}

