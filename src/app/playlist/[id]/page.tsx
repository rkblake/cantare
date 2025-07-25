'use client';

import type { Playlist, Track } from '@/types';
import TrackList from '@/components/TrackList';
import PlaylistControls from '@/components/PlaylistControls';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState, use } from 'react';

type PlaylistData = {
  playlist: Playlist;
  tracks: Track[];
};

async function getPlaylistData(id: string): Promise<{ playlist: Playlist, tracks: Track[] }> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/api/playlists/${id}`, {
      cache: 'no-store'
    });
    if (!res.ok) {
      console.error("Failed to fetch playlist data:", res.status);
      return { playlist: {} as Playlist, tracks: [] };
    }
    const data = await res.json() as PlaylistData;
    return {
      playlist: data.playlist,
      tracks: data.tracks,
    }
  } catch (error) {
    console.error("Error fetching playlist data:", error);
    return { playlist: {} as Playlist, tracks: [] };
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PlaylistPage({ params }: PageProps) {
  const { id } = use(params);
  const [playlist, setPlaylist] = useState<Playlist>({} as Playlist);
  const [tracks, setTracks] = useState<Track[]>([]);
  const router = useRouter();

  useEffect(() => {
    getPlaylistData(id).then(({ playlist, tracks }) => {
      setPlaylist(playlist);
      setTracks(tracks);
    }).catch(e => console.error(e));
  }, [id]);

  const handleDeletePlaylist = async () => {
    if (window.confirm(`Are you sure you want to delete the playlist "${playlist.name}"?`)) {
      try {
        await fetch(`/api/playlists/${id}`, {
          method: 'DELETE',
        });
        router.push('/');
      } catch (error) {
        console.error('Failed to delete playlist:', error);
      }
    }
  };

  if (!playlist.id) {
    return (
      <div className="text-center text-gray-500 py-20">
        <h3 className="text-2xl font-semibold mb-4">Playlist Not Found</h3>
        <p>{`The playlist you're looking for doesn't exist.`}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 sm:p-6 md:p-8">
      <header className="flex items-center space-x-6">
        <Image
          src="/images/default-album.svg"
          alt="Playlist artwork"
          width={200}
          height={200}
          className="w-48 h-48 rounded-lg shadow-lg"
        />
        <div className="flex-1">
          <p className="text-sm text-gray-400 uppercase tracking-wide">Playlist</p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            {playlist.name}
          </h1>
          <p className="text-gray-400">
            {tracks.length} {tracks.length === 1 ? 'song' : 'songs'}
          </p>
          <button
            onClick={handleDeletePlaylist}
            className="mt-4 px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition-colors"
          >
            Delete Playlist
          </button>
        </div>
      </header>

      {tracks.length > 0 && (
        <div className="flex items-center space-x-4">
          <PlaylistControls tracks={tracks} />
        </div>
      )}

      <section>
        {tracks.length > 0 ? (
          <div className="bg-gray-800/30 rounded-lg">
            <TrackList tracks={tracks} playlistId={id} />
          </div>
        ) : (
          <div className="text-center text-gray-500 py-20">
            <h3 className="text-2xl font-semibold mb-4">No Tracks</h3>
            <p>This playlist is empty. Add some songs to get started!</p>
          </div>
        )}
      </section>
    </div>
  );
}

