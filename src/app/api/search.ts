import type { NextApiRequest, NextApiResponse } from "next";
import { db } from '@/database';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { q } = req.query;
  db.read();

  if (!q || typeof q !== 'string' || q.trim() == '') {
    const recentTracks = db.data.tracks.slice(-10).reverse();
    return res.status(200).json({
      tracks: recentTracks,
      albums: [],
      artists: [],
    });
  }

  const query = q.toLowerCase().trim();

  const filteredTracks = db.data.tracks.filter((track) => {
    return track.title?.toLowerCase().includes(query) ??
      track.artist?.toLowerCase().includes(query) ??
      track.album?.toLowerCase().includes(query) ??
      track.albumArtist?.toLowerCase().includes(query)
  });

  const filteredAlbums = db.data.albums.filter(album => {
    return album.name?.toLowerCase().includes(query) ??
      album.artist?.toLowerCase().includes(query)
  });

  const filteredArtists = db.data.artists.filter(artist => {
    return artist.name?.toLowerCase().includes(query);
  });

  res.status(200).json({
    tracks: filteredTracks,
    albums: filteredAlbums,
    artists: filteredArtists
  });
}
