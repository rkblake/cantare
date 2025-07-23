import fs from 'fs/promises';
import path from 'path';
import { parseFile } from 'music-metadata';
import type { Track } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import type { IAudioMetadata } from 'music-metadata';
import {
  createAlbum,
  createArtist,
  createTrack,
  getAlbumByNameAndArtistId,
  getArtistByName,
  clearMusicData
} from "@/database/sqlite";

const artworkDir = path.join(process.cwd(), '.data', 'artwork');

async function extractArtwork(metadata: IAudioMetadata, albumId: string): Promise<string | undefined> {
  const picture = metadata.common.picture?.[0];
  if (!picture) {
    return undefined;
  }

  try {
    await fs.mkdir(artworkDir, { recursive: true });
    const extension = picture.format.split('/')[1] ?? 'jpg';
    const artworkPath = path.join(artworkDir, `${albumId}.${extension}`);

    await fs.writeFile(artworkPath, picture.data);

    return `/api/artwork/${albumId}.${extension}`;
  } catch (error) {
    console.error(`Failed to save artwork for album ${albumId}:`, error);
    return undefined;
  }
}

export async function scanMusicDirectorySql(directory: string) {
  await clearMusicData();

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

            const artistName = common.artist ?? common.albumartist ?? 'Unknown Artist';
            let artist = await getArtistByName(artistName);
            if (!artist) {
              artist = {
                id: uuidv4(),
                name: artistName,
                albumIds: [],
                trackIds: [],
              };
              await createArtist(artist);
            }

            const albumName = common.album ?? 'Unknown Album';
            let album = await getAlbumByNameAndArtistId(albumName, artist.id);
            if (!album) {
              const albumId = uuidv4();
              album = {
                id: albumId,
                name: albumName,
                artist: artist.id,
                year: common.year ?? null,
                trackIds: [],
                artworkPath: await extractArtwork(metadata, albumId),
              };
              await createAlbum(album);
            }

            const track: Track = {
              id: uuidv4(),
              filePath: fullPath,
              title: common.title ?? path.parse(entry.name).name,
              artist: artist.id,
              album: album.id,
              albumArtist: common.albumartist ?? common.artist ?? 'Unknown Artist',
              genre: Array.isArray(common.genre) ? common.genre.join(', ') : common.genre ?? null,
              year: common.year ?? null,
              duration: metadata.format.duration ?? null,
              trackNumber: common.track?.no,
              diskNumber: common.disk?.no,
            };
            await createTrack(track);

          } catch (metaError) {
            console.warn(`Could not parse metadata for ${fullPath}: `, metaError);
            await createTrack({
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

  await walk(directory);
}

