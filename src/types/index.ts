export interface Track {
  id: string;
  filePath: string;
  title: string | null;
  artist: string | null;
  album: string | null;
  albumArtist: string | null;
  genre: string | null;
  year: number | null;
  duration: number | null;
  trackNumber: number | null;
   diskNumber: number | null;
 }
export interface Album {
  id: string;
  name: string | null;
  artist: string | null;
  year: number | null;
  artworkPath?: string;
  trackIds: string[];
}

export interface Artist {
  id: string;
  name: string | null;
  albumIds: string[];
  trackIds: string[];
}

export interface Playlist {
  id: string;
  name: string;
  createdAt: number;
  trackIds: string[];
}

export interface Settings {
  musicDirectory: string;
  databasePath: string;
}

export interface DatabaseSchema {
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
  settings: Settings;
}
