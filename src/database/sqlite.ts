import { open, type Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import type { Track, Album, Artist, ArtistWithImage, Playlist, Settings } from '@/types';
import { databasePath } from './paths';

let db: Database;

export async function openDb() {
  if (!db) {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
  }
  return db;
}

export async function createTables() {
  const db = await openDb();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS tracks (
      id TEXT PRIMARY KEY,
      filePath TEXT NOT NULL,
      title TEXT,
      artist_id TEXT,
      album_id TEXT,
      albumArtist TEXT,
      genre TEXT,
      year INTEGER,
      duration REAL,
      trackNumber INTEGER,
      diskNumber INTEGER,
      lastScanId TEXT,
      FOREIGN KEY (album_id) REFERENCES albums(id),
      FOREIGN KEY (artist_id) REFERENCES artists(id)
    );

    CREATE TABLE IF NOT EXISTS albums (
      id TEXT PRIMARY KEY,
      name TEXT,
      artist_id TEXT,
      year INTEGER,
      artworkPath TEXT,
      artworkThumbPath TEXT,
      FOREIGN KEY (artist_id) REFERENCES artists(id),
      UNIQUE(name, artist_id)
    );

    CREATE TABLE IF NOT EXISTS artists (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE
    );

    CREATE TABLE IF NOT EXISTS playlists (
      id TEXT PRIMARY KEY,
      name TEXT,
      createdAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS playlist_tracks (
      playlist_id TEXT,
      track_id TEXT,
      position INTEGER,
      PRIMARY KEY (playlist_id, track_id),
      FOREIGN KEY (playlist_id) REFERENCES playlists(id),
      FOREIGN KEY (track_id) REFERENCES tracks(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Migration for databases created before playlist ordering existed.
  const playlistTrackColumns = await db.all<{ name: string }[]>('PRAGMA table_info(playlist_tracks)');
  if (!playlistTrackColumns.some((column) => column.name === 'position')) {
    await db.exec('ALTER TABLE playlist_tracks ADD COLUMN position INTEGER');
  }
  await db.exec('UPDATE playlist_tracks SET position = rowid WHERE position IS NULL');

  const albumColumns = await db.all<{ name: string }[]>('PRAGMA table_info(albums)');
  if (!albumColumns.some((column) => column.name === 'artworkThumbPath')) {
    await db.exec('ALTER TABLE albums ADD COLUMN artworkThumbPath TEXT');
  }

  const trackColumns = await db.all<{ name: string }[]>('PRAGMA table_info(tracks)');
  if (!trackColumns.some((column) => column.name === 'lastScanId')) {
    await db.exec('ALTER TABLE tracks ADD COLUMN lastScanId TEXT');
  }

  await updateSettings({ databasePath })
}

export async function getTracks(): Promise<Track[]> {
  const db = await openDb();
  let tracks = await db.all<Track[]>(`
    SELECT
      t.*,
      CASE WHEN a.id IS NOT NULL THEN json_object('id', a.id, 'name', a.name, 'artworkPath', a.artworkPath, 'artworkThumbPath', a.artworkThumbPath) ELSE NULL END as album,
      CASE WHEN art.id IS NOT NULL THEN json_object('id', art.id, 'name', art.name) ELSE NULL END as artist
    FROM
      tracks AS t
    LEFT JOIN
      albums AS a ON t.album_id = a.id
    LEFT JOIN
      artists AS art ON t.artist_id = art.id
  `);

  tracks = tracks.map((track): Track => ({
    ...track,
    album: track.album ? JSON.parse(track.album as unknown as string) as Album : null,
    artist: track.artist ? JSON.parse(track.artist as unknown as string) as Artist : null,
  }));

  return tracks;
}

export async function getTrack(id: string): Promise<Track | undefined> {
  const db = await openDb();
  const track = await db.get<Track>(`
    SELECT
      t.*,
      CASE WHEN a.id IS NOT NULL THEN json_object('id', a.id, 'name', a.name, 'artworkPath', a.artworkPath, 'artworkThumbPath', a.artworkThumbPath) ELSE NULL END as album,
      CASE WHEN art.id IS NOT NULL THEN json_object('id', art.id, 'name', art.name) ELSE NULL END as artist
    FROM
      tracks AS t
    LEFT JOIN
      albums AS a ON t.album_id = a.id
    LEFT JOIN
      artists AS art ON t.artist_id = art.id
    WHERE
      t.id = ?
  `, id);

  if (track) {
    track.album = track.album ? JSON.parse(track.album as unknown as string) as Album : null;
    track.artist = track.artist ? JSON.parse(track.artist as unknown as string) as Artist : null;
  }

  return track;
}

export async function upsertTrack(track: Track, scanId: string) {
  const db = await openDb();
  return db.run(
    `INSERT OR REPLACE INTO tracks
      (id, filePath, title, artist_id, album_id, albumArtist, genre, year, duration, trackNumber, diskNumber, lastScanId)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      track.id,
      track.filePath,
      track.title,
      track.artist?.id ?? null,
      track.album?.id ?? null,
      track.albumArtist,
      track.genre,
      track.year,
      track.duration,
      track.trackNumber,
      track.diskNumber,
      scanId,
    ]
  );
}

export async function updateTrack(id: string, track: Partial<Track>) {
  const db = await openDb();
  const fields = Object.keys(track).map((key) => `${key} = ?`).join(', ');
  const values = Object.values(track);
  return db.run(`UPDATE tracks SET ${fields} WHERE id = ?`, [...values, id]);
}

export async function getAlbums(page = 1, limit = 20): Promise<Album[]> {
  const db = await openDb();
  const offset = (page - 1) * limit;
  return db.all<Album[]>(`
    SELECT
      album.id,
      album.name,
      art.name AS artist,
      album.artworkPath,
      album.artworkThumbPath
    FROM
      albums AS album
    JOIN
      artists AS art on album.artist_id = art.id
    ORDER BY album.name COLLATE NOCASE, album.id
    LIMIT ? OFFSET ?
  `, limit, offset);
}

export async function getAllAlbums(): Promise<Album[]> {
  const db = await openDb();
  return db.all<Album[]>(`
    SELECT
      album.id,
      album.name,
      art.name AS artist,
      album.artworkPath,
      album.artworkThumbPath
    FROM
      albums AS album
    JOIN
      artists AS art on album.artist_id = art.id
    ORDER BY album.name COLLATE NOCASE, album.id
  `);
}

export async function getAlbum(id: string): Promise<Album | undefined> {
  const db = await openDb();
  const album = await db.get<Album>(`
    SELECT
      alb.id,
      alb.name,
      art.name AS artist,
      alb.artist_id,
      alb.year,
      alb.artworkPath,
      alb.artworkThumbPath
    FROM
      albums AS alb
    JOIN
      artists AS art on alb.artist_id = art.id
    WHERE
      alb.id = ?
  `, id);
  if (!album) {
    return;
  }
  const tracks = await db.all<Track[]>(`SELECT id FROM tracks WHERE album_id = ?`, id);
  album.trackIds = tracks.map(t => t.id);
  return album;
}

export async function createAlbum(album: Album) {
  const db = await openDb();
  return db.run(
    'INSERT OR IGNORE INTO albums (id, name, artist_id, year, artworkPath, artworkThumbPath) VALUES (?, ?, ?, ?, ?, ?)',
    [album.id, album.name, album.artist_id, album.year, album.artworkPath, album.artworkThumbPath]
  );
}

export async function updateAlbum(id: string, album: Partial<Album>) {
  const db = await openDb();
  const fields = Object.keys(album).map((key) => `${key} = ?`).join(', ');
  const values = Object.values(album);
  return db.run(`UPDATE albums SET ${fields} WHERE id = ?`, [...values, id]);
}

const artistsWithImageSelect = `
  SELECT
    art.id,
    art.name,
    (
      SELECT alb.artworkPath
      FROM albums AS alb
      WHERE alb.artist_id = art.id AND alb.artworkPath IS NOT NULL
      ORDER BY COALESCE(alb.year, 0), alb.name COLLATE NOCASE
      LIMIT 1
    ) AS imageUrl
  FROM artists AS art
  ORDER BY art.name COLLATE NOCASE, art.id
`;

export async function getArtistsWithImage(page = 1, limit = 20): Promise<ArtistWithImage[]> {
  const db = await openDb();
  const offset = (page - 1) * limit;
  return db.all<ArtistWithImage[]>(`${artistsWithImageSelect} LIMIT ? OFFSET ?`, limit, offset);
}

export async function getAllArtistsWithImage(): Promise<ArtistWithImage[]> {
  const db = await openDb();
  return db.all<ArtistWithImage[]>(artistsWithImageSelect);
}

export async function getArtist(id: string): Promise<Artist | undefined> {
  const db = await openDb();
  return db.get<Artist>('SELECT * FROM artists WHERE id = ?', id);
}

export async function getArtistByName(name: string): Promise<Artist | undefined> {
  const db = await openDb();
  return db.get<Artist>('SELECT * FROM artists WHERE name = ?', name);
}

export async function getAlbumByNameAndArtistId(name: string, artistId: string): Promise<Album | undefined> {
  const db = await openDb();
  return db.get<Album>('SELECT * FROM albums WHERE name = ? AND artist_id = ?', name, artistId);
}

export async function createArtist(artist: Artist) {
  const db = await openDb();
  return db.run('INSERT OR IGNORE INTO artists (id, name) VALUES (?, ?)', [
    artist.id,
    artist.name,
  ]);
}

export async function deleteStaleTracks(scanId: string) {
  const db = await openDb();
  return db.run('DELETE FROM tracks WHERE lastScanId IS NOT ?', scanId);
}

export async function deleteEmptyAlbums() {
  const db = await openDb();
  return db.run(
    'DELETE FROM albums WHERE id NOT IN (SELECT DISTINCT album_id FROM tracks WHERE album_id IS NOT NULL)'
  );
}

export async function deleteEmptyArtists() {
  const db = await openDb();
  return db.run(
    'DELETE FROM artists WHERE id NOT IN (SELECT DISTINCT artist_id FROM tracks WHERE artist_id IS NOT NULL)'
  );
}

export async function deleteOrphanedPlaylistTracks() {
  const db = await openDb();
  await db.run('DELETE FROM playlist_tracks WHERE track_id NOT IN (SELECT id FROM tracks)');
}

export async function getArtworkPaths(): Promise<string[]> {
  const db = await openDb();
  const rows = await db.all<{ artworkPath: string | null; artworkThumbPath: string | null }[]>(
    'SELECT artworkPath, artworkThumbPath FROM albums'
  );
  const paths: string[] = [];
  for (const row of rows) {
    if (row.artworkPath) {
      paths.push(row.artworkPath);
    }
    if (row.artworkThumbPath) {
      paths.push(row.artworkThumbPath);
    }
  }
  return paths;
}

export async function getPlaylistTrackPaths(): Promise<{ playlist_id: string; track_id: string; filePath: string }[]> {
  const db = await openDb();
  return db.all<{ playlist_id: string; track_id: string; filePath: string }[]>(`
    SELECT pt.playlist_id, pt.track_id, t.filePath
    FROM playlist_tracks AS pt
    JOIN tracks AS t ON t.id = pt.track_id
  `);
}

export async function remapPlaylistTrack(playlistId: string, oldTrackId: string, newTrackId: string) {
  if (oldTrackId === newTrackId) {
    return;
  }
  const db = await openDb();
  const existing = await db.get<{ present: number }>(
    'SELECT 1 AS present FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?',
    playlistId,
    newTrackId
  );
  if (existing) {
    await db.run('DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?', playlistId, oldTrackId);
  } else {
    await db.run('UPDATE playlist_tracks SET track_id = ? WHERE playlist_id = ? AND track_id = ?', newTrackId, playlistId, oldTrackId);
  }
}

export async function updateArtist(id: string, artist: Partial<Artist>) {
  const db = await openDb();
  const fields = Object.keys(artist).map((key) => `${key} = ?`).join(', ');
  const values = Object.values(artist);
  return db.run(`UPDATE artists SET ${fields} WHERE id = ?`, [...values, id]);
}

export async function getPlaylists(): Promise<Playlist[]> {
  const db = await openDb();
  return db.all<Playlist[]>('SELECT * FROM playlists');
}

export async function getPlaylist(id: string): Promise<Playlist | undefined> {
  const db = await openDb();
  return db.get<Playlist>('SELECT * FROM playlists WHERE id = ?', id);
}

export async function createPlaylist(playlist: Playlist) {
  const db = await openDb();
  return db.run(
    'INSERT INTO playlists (id, name, createdAt) VALUES (?, ?, ?)',
    [playlist.id, playlist.name, playlist.createdAt]
  );
}

export async function updatePlaylist(id: string, playlist: Partial<Playlist>) {
  const db = await openDb();
  const fields = Object.keys(playlist).map((key) => `${key} = ?`).join(', ');
  const values = Object.values(playlist);
  return db.run(`UPDATE playlists SET ${fields} WHERE id = ?`, [...values, id]);
}

export async function addToPlaylist(playlist: Playlist, track: Track | string) {
  const db = await openDb();
  const trackId = typeof track === 'string' ? track : track.id;
  return db.run(
    `INSERT OR IGNORE INTO playlist_tracks (playlist_id, track_id, position)
     VALUES (?, ?, COALESCE((SELECT MAX(position) FROM playlist_tracks WHERE playlist_id = ?), 0) + 1)`,
    [playlist.id, trackId, playlist.id]
  );
}

export async function removeFromPlaylist(playlist: Playlist, track: Track | string) {
  const db = await openDb();
  return db.run(`DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?`, [playlist.id, typeof track === 'string' ? track : track.id]);
}

export async function deletePlaylist(id: string) {
  const db = await openDb();
  await db.run('DELETE FROM playlist_tracks WHERE playlist_id = ?', id);
  return db.run('DELETE FROM playlists WHERE id = ?', id);
}

export async function getSettings(): Promise<Settings> {
  const db = await openDb();
  const rows = await db.all<{ key: keyof Settings; value: string }[]>(
    'SELECT key, value FROM settings'
  );
  const settings: Settings = { musicDirectory: '', databasePath: '' };
  for (const row of rows) {
    if (row.key === 'musicDirectory' || row.key === 'databasePath') {
      settings[row.key] = row.value;
    }
  }
  return settings;
}

export async function updateSettings(settings: Partial<Settings>) {
  const db = await openDb();
  const promises = Object.entries(settings).map(([key, value]) => {
    return db.run(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      [key, value]
    );
  });
  return Promise.all(promises);
}

export async function getTrackCount(): Promise<number> {
  const db = await openDb();
  const row = await db.get<{ count: number }>('SELECT COUNT(*) AS count FROM tracks');
  return row?.count ?? 0;
}

export async function getAlbumCount(): Promise<number> {
  const db = await openDb();
  const row = await db.get<{ count: number }>('SELECT COUNT(*) AS count FROM albums');
  return row?.count ?? 0;
}

export async function getArtistCount(): Promise<number> {
  const db = await openDb();
  const row = await db.get<{ count: number }>('SELECT COUNT(*) AS count FROM artists');
  return row?.count ?? 0;
}

export async function getTracksFromAlbum(album: Album): Promise<Track[] | undefined> {
  const db = await openDb();
  const tracks = await db.all<Track[]>(`
    SELECT
      t.*,
      json_object('id', alb.id, 'name', alb.name, 'artworkPath', alb.artworkPath, 'artworkThumbPath', alb.artworkThumbPath) as album,
      json_object('id', art.id, 'name', art.name) as artist
    FROM
      tracks as t
    INNER JOIN
      artists AS art ON art.id = t.artist_id
    INNER JOIN
      albums AS alb ON alb.id = t.album_id
    WHERE
      t.album_id = ?
    ORDER BY
      COALESCE(t.diskNumber, 1),
      COALESCE(t.trackNumber, 0),
      t.title COLLATE NOCASE
  `, album.id);

  return tracks.map((track) => {
    return {
      ...track,
      album: JSON.parse(track.album as unknown as string) as Album,
      artist: JSON.parse(track.artist as unknown as string) as Artist
    }
  });
}

export async function getAlbumsFromArtist(artist: Artist): Promise<Album[] | undefined> {
  const db = await openDb();
  return db.all<Album[]>(`
    SELECT
      alb.id,
      alb.name,
      alb.artist_id,
      alb.year,
      alb.artworkPath,
      alb.artworkThumbPath,
      art.name AS artist
    FROM
      albums AS alb
    JOIN
      artists AS art ON art.id = alb.artist_id
    WHERE
      alb.artist_id = ?
    ORDER BY
      COALESCE(alb.year, 0),
      alb.name COLLATE NOCASE
  `, [artist.id]);
}

export async function getTracksFromPlaylist(playlist: Playlist): Promise<Track[] | undefined> {
  const db = await openDb();
  const tracks = await db.all<Track[]>(`
    SELECT
      t.*,
      json_object('id', alb.id, 'name', alb.name, 'artworkPath', alb.artworkPath, 'artworkThumbPath', alb.artworkThumbPath) as album,
      json_object('id', art.id, 'name', art.name) as artist
    FROM
      tracks as t
    INNER JOIN
      playlist_tracks AS pt ON pt.track_id = t.id
    INNER JOIN
      artists AS art ON art.id = t.artist_id
    INNER JOIN
      albums AS alb ON alb.id = t.album_id
    WHERE
      pt.playlist_id = ?
    ORDER BY
      COALESCE(pt.position, pt.rowid),
      pt.rowid
  `, [playlist.id]);

  return tracks.map((track): Track => ({
    ...track,
    album: track.album ? JSON.parse(track.album as unknown as string) as Album : null,
    artist: track.artist ? JSON.parse(track.artist as unknown as string) as Artist : null,
  }));
}

