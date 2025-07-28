import { open, type Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import type { Track, Album, Artist, Playlist, Settings } from '@/types';
import path from 'path';

let db: Database;

const dataDir = process.env.NODE_ENV === 'development'
  ? path.join(process.cwd(), '.data')
  : path.join(process.cwd(), 'data')

const dbDir = path.join(dataDir, 'cantare.db');

export async function openDb() {
  if (!db) {
    db = await open({
      filename: dbDir,
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
      FOREIGN KEY (album_id) REFERENCES albums(id),
      FOREIGN KEY (artist_id) REFERENCES artists(id)
    );

    CREATE TABLE IF NOT EXISTS albums (
      id TEXT PRIMARY KEY,
      name TEXT,
      artist_id TEXT,
      year INTEGER,
      artworkPath TEXT,
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
      PRIMARY KEY (playlist_id, track_id),
      FOREIGN KEY (playlist_id) REFERENCES playlists(id),
      FOREIGN KEY (track_id) REFERENCES tracks(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  await updateSettings({ databasePath: dbDir })
}

export async function getTracks(): Promise<Track[]> {
  const db = await openDb();
  return db.all<Track[]>(`
    SELECT
      t.id,
      t.title,
      art.name AS artist,
      t.duration
    FROM
      tracks AS t
    INNER JOIN
      artists AS art on art.id = t.artist_id
  `);
}

export async function getTrack(id: string): Promise<Track | undefined> {
  const db = await openDb();
  return db.get<Track>('SELECT * FROM tracks WHERE id = ?', id);
}

export async function createTrack(track: Track) {
  const db = await openDb();
  return db.run(
    'INSERT INTO tracks (id, filePath, title, artist_id, album_id, albumArtist, genre, year, duration, trackNumber, diskNumber) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      track.id,
      track.filePath,
      track.title,
      track.artist,
      track.album,
      track.albumArtist,
      track.genre,
      track.year,
      track.duration,
      track.trackNumber,
      track.diskNumber,
    ]
  );
}

export async function updateTrack(id: string, track: Partial<Track>) {
  const db = await openDb();
  const fields = Object.keys(track).map((key) => `${key} = ?`).join(', ');
  const values = Object.values(track);
  return db.run(`UPDATE tracks SET ${fields} WHERE id = ?`, [...values, id]);
}

export async function deleteTrack(id: string) {
  const db = await openDb();
  return db.run('DELETE FROM tracks WHERE id = ?', id);
}

export async function getAlbums(): Promise<Album[]> {
  const db = await openDb();
  return db.all<Album[]>(`
    SELECT
      album.id,
      album.name,
      art.name AS artist,
      album.artworkPath
    FROM
      albums AS album
    JOIN
      artists AS art on album.artist_id = art.id
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
      alb.artworkPath
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
    'INSERT OR IGNORE INTO albums (id, name, artist_id, year, artworkPath) VALUES (?, ?, ?, ?, ?)',
    [album.id, album.name, album.artist_id, album.year, album.artworkPath]
  );
}

export async function updateAlbum(id: string, album: Partial<Album>) {
  const db = await openDb();
  const fields = Object.keys(album).map((key) => `${key} = ?`).join(', ');
  const values = Object.values(album);
  return db.run(`UPDATE albums SET ${fields} WHERE id = ?`, [...values, id]);
}

export async function deleteAlbum(id: string) {
  const db = await openDb();
  return db.run('DELETE FROM albums WHERE id = ?', id);
}

export async function getArtists(): Promise<Artist[]> {
  const db = await openDb();
  return db.all<Artist[]>('SELECT * FROM artists');
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

export async function clearMusicData() {
  const db = await openDb();
  await db.exec('DELETE FROM tracks');
  await db.exec('DELETE FROM albums');
  await db.exec('DELETE FROM artists');
  await db.exec('DELETE FROM playlist_tracks');
}

export async function updateArtist(id: string, artist: Partial<Artist>) {
  const db = await openDb();
  const fields = Object.keys(artist).map((key) => `${key} = ?`).join(', ');
  const values = Object.values(artist);
  return db.run(`UPDATE artists SET ${fields} WHERE id = ?`, [...values, id]);
}

export async function deleteArtist(id: string) {
  const db = await openDb();
  return db.run('DELETE FROM artists WHERE id = ?', id);
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
  return db.run(`INSERT INTO playlist_tracks (playlist_id, track_id) VALUES (?, ?)`, [playlist.id, typeof track === 'string' ? track : track.id]);
}

export async function removeFromPlaylist(playlist: Playlist, track: Track | string) {
  const db = await openDb();
  return db.run(`DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?`, [playlist.id, typeof track === 'string' ? track : track.id]);
}

export async function deletePlaylist(id: string) {
  const db = await openDb();
  return db.run('DELETE FROM playlists WHERE id = ?', id);
}

export async function getSettings(): Promise<Settings> {
  const db = await openDb();
  const rows = await db.all<{ key: keyof Settings; value: string }[]>(
    'SELECT key, value FROM settings'
  );
  const settings: Settings = { musicDirectory: '', databasePath: '' };
  for (const row of rows) {
    settings[row.key] = row.value;
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

export async function getTrackCount(): Promise<number | undefined> {
  const db = await openDb();
  return db.get<number>('SELECT COUNT(*) FROM tracks');
}

export async function getAlbumCount(): Promise<number | undefined> {
  const db = await openDb();
  return db.get<number>('SELECT COUNT(*) FROM albums');
}

export async function getArtistCount(): Promise<number | undefined> {
  const db = await openDb();
  return db.get<number>('SELECT COUNT(*) FROM artists');
}

export async function getTracksFromAlbum(album: Album): Promise<Track[] | undefined> {
  const db = await openDb();
  const tracks = db.all<Track[]>(`
    SELECT
      t.id,
      t.title,
      art.name AS artist,
      alb.name AS album,
      t.year,
      t.duration,
      t.trackNumber,
      t.diskNumber
    FROM
      tracks as t
    INNER JOIN
      artists AS art ON art.id = t.artist_id
    INNER JOIN
      albums AS alb ON alb.id = t.album_id
    WHERE
      t.album_id = ?
  `, [album.id]);
  return tracks;
}

export async function getAlbumsFromArtist(artist: Artist): Promise<Album[] | undefined> {
  const db = await openDb();
  const albums = db.all<Album[]>(`
    SELECT
      id,
      name,
      year,
      artworkPath
    FROM
      albums
    WHERE
      artist_id = ?
  `, [artist.id]);
  return albums;
}

export async function getTracksFromPlaylist(playlist: Playlist): Promise<Track[] | undefined> {
  const db = await openDb();
  const tracks = db.all<Track[]>(`
    SELECT
      t.id,
      t.filePath,
      t.title,
      art.name AS artist,
      alb.name AS album,
      t.year,
      t.duration,
      t.trackNumber,
      t.diskNumber
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
  `, [playlist.id]);
  return tracks;
}
