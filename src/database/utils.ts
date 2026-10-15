import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { parseFile } from 'music-metadata';
import type { Album, Artist } from '@/types';
import { v5 as uuidv5 } from 'uuid';
import type { IAudioMetadata } from 'music-metadata';
import {
  beginTransaction,
  commitTransaction,
  createAlbum,
  createArtist,
  deleteEmptyAlbums,
  deleteEmptyArtists,
  deleteOrphanedPlaylistTracks,
  deleteStaleTracks,
  getAlbumByNameAndArtistId,
  getArtworkPaths,
  getArtistByName,
  getPlaylistTrackPaths,
  getTrackFileInfo,
  markTrackSeen,
  remapPlaylistTrack,
  rollbackTransaction,
  upsertTrack
} from "@/database/sqlite";
import { artworkDir } from './paths';

// Stable namespaces so the same path/name always maps to the same id. This keeps
// playlists intact and stops artwork files from multiplying across rescans.
const TRACK_ID_NAMESPACE = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';
const ARTIST_ID_NAMESPACE = '6ba7b812-9dad-11d1-80b4-00c04fd430c8';
const ALBUM_ID_NAMESPACE = '6ba7b813-9dad-11d1-80b4-00c04fd430c8';

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'];

function trackIdForPath(filePath: string): string {
  return uuidv5(filePath, TRACK_ID_NAMESPACE);
}

function artistIdForName(name: string): string {
  return uuidv5(name, ARTIST_ID_NAMESPACE);
}

function albumIdForName(artistId: string, name: string): string {
  return uuidv5(`${artistId}\u0000${name}`, ALBUM_ID_NAMESPACE);
}

async function findFolderArtwork(directory: string): Promise<string | undefined> {
  let entries: string[];
  try {
    entries = await fs.readdir(directory);
  } catch {
    return undefined;
  }

  const images = entries.filter((name) =>
    IMAGE_EXTENSIONS.some((extension) => name.toLowerCase().endsWith(extension))
  );
  const find = (predicate: (name: string) => boolean) =>
    images.find((name) => predicate(name.toLowerCase()));

  const match =
    find((name) => name.startsWith('cover')) ??
    find((name) => name.startsWith('folder')) ??
    find((name) => name.startsWith('front')) ??
    find((name) => name.startsWith('album') && !name.includes('small')) ??
    find((name) => name.startsWith('albumart') && name.includes('large')) ??
    find((name) => name.startsWith('albumart')) ??
    find((name) => name.startsWith('album'));

  return match ? path.join(directory, match) : undefined;
}

interface ArtworkPaths {
  artworkPath: string;
  artworkThumbPath: string;
}

async function writeArtwork(source: Buffer, albumId: string): Promise<ArtworkPaths | undefined> {
  try {
    await fs.mkdir(artworkDir, { recursive: true });
    const artworkFile = path.join(artworkDir, `${albumId}.webp`);
    const artworkThumbFile = path.join(artworkDir, `${albumId}.thumb.webp`);

    await sharp(source)
      .rotate()
      .resize(640, 640, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(artworkFile);

    await sharp(source)
      .rotate()
      .resize(96, 96, { fit: 'cover' })
      .webp({ quality: 80 })
      .toFile(artworkThumbFile);

    return {
      artworkPath: `/api/artwork/${albumId}.webp`,
      artworkThumbPath: `/api/artwork/${albumId}.thumb.webp`,
    };
  } catch (error) {
    console.error(`Failed to save artwork for album ${albumId}:`, error);
    return undefined;
  }
}

async function extractArtwork(
  metadata: IAudioMetadata,
  albumId: string,
  trackFilePath: string
): Promise<ArtworkPaths | undefined> {
  // Prefer a cover image sitting next to the tracks.
  const folderArtwork = await findFolderArtwork(path.dirname(trackFilePath));
  if (folderArtwork) {
    try {
      return await writeArtwork(await fs.readFile(folderArtwork), albumId);
    } catch (error) {
      console.error(`Failed to read folder artwork ${folderArtwork}:`, error);
    }
  }

  // Otherwise fall back to the embedded picture, preferring the front cover.
  const pictures = metadata.common.picture ?? [];
  const picture = pictures.find((item) => item.type?.toLowerCase().includes('front')) ?? pictures[0];
  if (!picture) {
    return undefined;
  }

  return writeArtwork(Buffer.from(picture.data), albumId);
}

async function deleteOrphanedArtwork(): Promise<void> {
  try {
    const referenced = new Set((await getArtworkPaths()).map((artworkPath) => path.basename(artworkPath)));
    const files = await fs.readdir(artworkDir);
    await Promise.all(
      files
        .filter((name) => !referenced.has(name))
        .map((name) => fs.unlink(path.join(artworkDir, name)).catch(() => undefined))
    );
  } catch (error) {
    console.error('Failed to clean up orphaned artwork:', error);
  }
}

async function getOrCreateArtist(artistName: string): Promise<Artist> {
  const existing = await getArtistByName(artistName);
  if (existing) {
    return existing;
  }

  const artist: Artist = {
    id: artistIdForName(artistName),
    name: artistName,
    albumIds: [],
    trackIds: [],
  };
  await createArtist(artist);

  // Concurrent workers may insert the same artist first; re-read to get the canonical row.
  return (await getArtistByName(artistName)) ?? artist;
}

async function getOrCreateAlbum(
  metadata: IAudioMetadata,
  albumName: string,
  artist: Artist,
  trackFilePath: string
): Promise<Album> {
  const existing = await getAlbumByNameAndArtistId(albumName, artist.id);
  if (existing) {
    return existing;
  }

  const albumId = albumIdForName(artist.id, albumName);
  const artwork = await extractArtwork(metadata, albumId, trackFilePath);
  const album: Album = {
    id: albumId,
    name: albumName,
    artist: artist.name,
    artist_id: artist.id,
    year: metadata.common.year ?? null,
    trackIds: [],
    artworkPath: artwork?.artworkPath,
    artworkThumbPath: artwork?.artworkThumbPath,
  };
  await createAlbum(album);

  // Concurrent workers may insert the same album first; re-read to get the canonical row.
  return (await getAlbumByNameAndArtistId(albumName, artist.id)) ?? album;
}

let scanInProgress = false;

export function isScanInProgress(): boolean {
  return scanInProgress;
}

export async function scanMusicDirectorySql(
  directory: string,
  onProgress: (progress: { total: number, processed: number }) => void
) {
  if (scanInProgress) {
    throw new Error('A scan is already in progress');
  }
  scanInProgress = true;

  try {
    const rootStat = await fs.stat(directory);
    if (!rootStat.isDirectory()) {
      throw new Error(`Music directory is not a directory: ${directory}`);
    }

    const scanId = randomUUID();

    // Capture playlist membership before sweeping so legacy random track ids can
    // be remapped to the stable, path-based ids.
    const existingPlaylistTracks = await getPlaylistTrackPaths();

    const filesToProcess: string[] = [];
    let discoveryHadErrors = false;
    async function discoverFiles(dir: string) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            await discoverFiles(fullPath);
          } else if (entry.isFile() && /\.(mp3|flac|m4a|aac|ogg|oga|opus|wav|aiff|aif|wma)$/i.test(entry.name)) {
            filesToProcess.push(fullPath);
          }
        }
      } catch (discoverError) {
        discoveryHadErrors = true;
        console.error(`Could not read directory ${dir} for discovery:`, discoverError);
      }
    }

    await discoverFiles(directory);
    const totalFiles = filesToProcess.length;
    let processedFiles = 0;

    // Known files keyed by track id, so unchanged files can skip re-parsing.
    const existingFileInfo = new Map(
      (await getTrackFileInfo()).map((row) => [row.id, row])
    );

    async function processFile(fullPath: string) {
      const id = trackIdForPath(fullPath);
      try {
        let stat;
        try {
          stat = await fs.stat(fullPath);
        } catch (statError) {
          // File disappeared between discovery and processing; leave it unseen
          // so the sweep removes any stale row for it.
          console.warn(`Could not stat ${fullPath}, skipping:`, statError);
          return;
        }

        const fileMtime = Math.floor(stat.mtimeMs);
        const existing = existingFileInfo.get(id);
        if (existing && existing.fileSize === stat.size && existing.fileMtime === fileMtime) {
          await markTrackSeen(id, scanId);
          return;
        }

        try {
          const metadata = await parseFile(fullPath);
          const common = metadata.common;

          const artistName = common.artist ?? common.albumartist ?? 'Unknown Artist';
          const artist = await getOrCreateArtist(artistName);

          const albumName = common.album ?? 'Unknown Album';
          const album = await getOrCreateAlbum(metadata, albumName, artist, fullPath);

          await upsertTrack({
            id,
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
          }, scanId, stat.size, fileMtime);
        } catch (metaError) {
          console.warn(`Could not parse metadata for ${fullPath}: `, metaError);
          await upsertTrack({
            id,
            filePath: fullPath,
            title: path.parse(fullPath).name,
            artist: null,
            album: null,
            albumArtist: null,
            genre: null, year: null, duration: null, trackNumber: null, diskNumber: null
          }, scanId, stat.size, fileMtime);
        }
      } finally {
        processedFiles++;
        onProgress({ total: totalFiles, processed: processedFiles });
      }
    }

    const CONCURRENT_LIMIT = os.cpus().length + 1;
    const queue = [...filesToProcess];

    async function worker() {
      while (queue.length > 0) {
        const file = queue.shift();
        if (file) {
          await processFile(file);
        }
      }
    }

    // Wrap all DB writes for this scan in one transaction so we pay a single
    // commit instead of an fsync per row (and roll back cleanly on failure).
    await beginTransaction();
    try {
      const workers = Array.from({ length: CONCURRENT_LIMIT }, () => worker());
      await Promise.all(workers);

      for (const entry of existingPlaylistTracks) {
        await remapPlaylistTrack(entry.playlist_id, entry.track_id, trackIdForPath(entry.filePath));
      }

      // Sweep tracks that were not seen this scan, but only when discovery
      // completed cleanly so a transient read error can't erase the library.
      if (!discoveryHadErrors) {
        await deleteStaleTracks(scanId);
        await deleteEmptyAlbums();
        await deleteEmptyArtists();
      }

      // Remove playlist entries whose tracks no longer exist.
      await deleteOrphanedPlaylistTracks();
      await commitTransaction();
    } catch (transactionError) {
      await rollbackTransaction();
      throw transactionError;
    }

    // Remove artwork files no longer referenced by any album (after commit, since
    // this touches the filesystem rather than the database).
    await deleteOrphanedArtwork();
  } finally {
    scanInProgress = false;
  }
}

