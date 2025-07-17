import fs from 'fs/promises';
import path from 'path';
import { parseFile } from 'music-metadata';
import type { Track, Album, Artist } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database';

export async function scanMusicDirectory(directory: string): Promise<{ tracks: Track[], albums: Album[], artists: Artist[] }> {
  const tracks: Track[] = [];
  const albumsMap = new Map<string, Album>();
  const artistsMap = new Map<string, Artist>();

  async function walk(dir: string) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile() && /\.(mp3|flac|aac|wav)$/i.test(entry.name)) {
          try {
            const metadata = await parseFile(fullPath);
            const common = metadata.common;

            const track: Track = {
              id: uuidv4(),
              filePath: fullPath,
              title: common.title ?? path.parse(entry.name).name,
              artist: common.artist ?? common.albumartist ?? 'Unkown Artist',
              album: common.album ?? 'Unknown Album',
              albumArtist: common.albumartist ?? common.artist ?? 'Unkwown Artist',
              genre: Array.isArray(common.genre) ? common.genre.join(', ') : common.genre ?? null,
              year: common.year ?? null,
              duration: metadata.format.duration ?? null,
              trackNumber: common.track?.no,
              diskNumber: common.disk?.no,
              // artworkPath: await extrackArtwork(metadata, track.id), // TODO: extract artwork
            };

            tracks.push(track);

            const albumKey = `${track.album}||${track.albumArtist}`;
            if (!albumsMap.has(albumKey)) {
              albumsMap.set(albumKey, {
                id: uuidv4(),
                name: track.album,
                artist: track.albumArtist,
                year: track.year,
                artworkPath: track.artworkPath,
                trackIds: []
              });
            }
            albumsMap.get(albumKey)!.trackIds.push(track.id);

            if (track.artist && track.artist !== track.albumArtist) {
              const artistKey = track.artist;
              if (!artistsMap.has(artistKey)) {
                artistsMap.set(artistKey, {
                  id: uuidv4(),
                  name: artistKey,
                  albumIds: [],
                  trackIds: []
                });
              }
              artistsMap.get(artistKey)!.trackIds.push(track.id);
            }

            const albumArtistKey = track.albumArtist ?? 'Unknown Artist';
            if (!artistsMap.has(albumArtistKey)) {
              artistsMap.set(albumArtistKey, {
                id: uuidv4(),
                name: albumArtistKey,
                albumIds: [],
                trackIds: []
              });
            }

            const albumEntry = albumsMap.get(albumKey);
            if (albumEntry && !artistsMap.get(albumArtistKey)!.albumIds.includes(albumEntry.id)) {
              artistsMap.get(albumArtistKey)!.albumIds.push(albumEntry.id);
            }
          } catch (metaError) {
            console.warn(`Could not parse metada for ${fullPath}: `, metaError);
            tracks.push({
              id: uuidv4(),
              filePath: fullPath,
              title: path.parse(entry.name).name,
              artist: 'Unknown Artist',
              album: 'Unknown Album',
              albumArtist: 'Unknown Artist',
              genre: null, year: null, duration: null, trackNumber: null, diskNumber: null
            });
          }
        }
      }
    } catch (readError) {
      console.error(`Could not read directory ${dir}: `, readError);
    }
  }

  // TODO: switch to diffing
  db.data.tracks = [];
  db.data.albums = [];
  db.data.artists = [];
  db.write();

  await walk(directory);

  const albums = Array.from(albumsMap.values());
  const artists = Array.from(artistsMap.values());

  return { tracks, albums, artists };
}
