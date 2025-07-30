import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { parseFile } from 'music-metadata';
import type { Track, Album, Artist } from '@/types';
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

export async function scanMusicDirectorySql(
  directory: string,
  onProgress: (progress: { total: number, processed: number }) => void
) {
  await clearMusicData();

  const filesToProcess: string[] = [];
  async function discoverFiles(dir: string) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await discoverFiles(fullPath);
        } else if (entry.isFile() && /\.(mp3)$/i.test(entry.name)) { // TODO: add flac|aac|wav
          filesToProcess.push(fullPath);
        }
      }
    } catch (discoverError) {
      console.error(`Could not read directory ${dir} for discovery:`, discoverError);
    }
  }

  await discoverFiles(directory);
  const totalFiles = filesToProcess.length;
  let processedFiles = 0;

  async function processFile(fullPath: string) {
    try {
      const metadata = await parseFile(fullPath);
      const common = metadata.common;

      const artistName = common.artist ?? common.albumartist ?? 'Unknown Artist';
      let artist: Artist | undefined = await getArtistByName(artistName);
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
      let album: Album | undefined = await getAlbumByNameAndArtistId(albumName, artist.id);
      if (!album) {
        const albumId = uuidv4();
        album = {
          id: albumId,
          name: albumName,
          artist: artist.name,
          artist_id: artist.id,
          year: common.year ?? null,
          trackIds: [],
          artworkPath: await extractArtwork(metadata, albumId),
        };
        await createAlbum(album);
      }

      if (!album) {
        console.error(`Could not find or create album for track ${fullPath}`);
        return;
      }

      const track: Track = {
        id: uuidv4(),
        filePath: fullPath,
        title: common.title ?? path.parse(fullPath).name,
        artist: artist,
        album: album,
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
        title: path.parse(fullPath).name,
        artist: null,
        album: null,
        albumArtist: null,
        genre: null, year: null, duration: null, trackNumber: null, diskNumber: null
      });
    } finally {
      processedFiles++;
      onProgress({ total: totalFiles, processed: processedFiles });
    }
  }

  const CONCURRENT_LIMIT = os.cpus.length + 1;
  const queue = [...filesToProcess];

  async function worker() {
    while (queue.length > 0) {
      const file = queue.shift();
      if (file) {
        await processFile(file);
      }
    }
  }

  const workers = Array.from({ length: CONCURRENT_LIMIT }, () => worker());
  await Promise.all(workers);
}

