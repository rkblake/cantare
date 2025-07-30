'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import type { Album, Track } from '@/types';
import TrackList from '@/components/TrackList';
import Image from 'next/image';
import { usePlayer } from '@/context/PlayerContext';
import { PlayIcon, PlusIcon } from '@heroicons/react/24/solid';

type AlbumData = {
  album: Album;
  tracks: Track[];
};

async function getAlbumData(id: string): Promise<{ album: Album, tracks: Track[] }> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/api/album/${id}`);
    if (!res.ok) {
      console.error("Failed to fetch album data:", res.status);
      return { album: {} as Album, tracks: [] };
    }
    const data = await res.json() as AlbumData;
    return {
      album: data.album,
      tracks: data.tracks,
    }
  } catch (error) {
    console.error("Error fetching album data:", error);
    return { album: {} as Album, tracks: [] };
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AlbumPage({ params }: PageProps) {
  const { id } = use(params);
  const [album, setAlbum] = useState<Album | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const { playPlaylist, addToQueue } = usePlayer();

  useEffect(() => {
    getAlbumData(id).then(({ album, tracks }) => {
      setAlbum(album);
      setTracks(tracks);
    }).catch(console.log);
  }, [id]);

  if (!album) {
    return <div>Loading...</div>;
  }

  const handlePlayAlbum = () => {
    playPlaylist(tracks);
  };

  const handleQueueAlbum = () => {
    tracks.forEach(track => addToQueue(track));
  };

  return (
    <div className="space-y-12 p-4 sm:p-6 md:p-8">
      <header className="flex items-center space-x-6">
        <Image
          src={album.artworkPath?.replace(".jpeg", "").replace(".jpg", "") ?? '/images/default-album.svg'}
          alt={album.name ?? 'Album Artwork'}
          width={128}
          height={128}
          className="w-32 h-32 rounded-lg shadow-lg"
        />
        <div>
          <h1 className="text-5xl font-extrabold tracking-tight text-white">
            {album.name}
          </h1>
          <Link href={`/artist/${album.artist_id}`}>
            <h2 className="text-2xl font-bold text-gray-400 hover:underline">{album.artist}</h2>
          </Link>
          <div className="flex space-x-4 mt-4">
            <button
              onClick={handlePlayAlbum}
              className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-full hover:bg-blue-500 transition-colors duration-300 flex items-center"
            >
              <PlayIcon className="h-5 w-5 mr-2" />
              Play
            </button>
            <button
              onClick={handleQueueAlbum}
              className="bg-gray-700 text-white font-semibold py-2 px-6 rounded-full hover:bg-gray-600 transition-colors duration-300 flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add to Queue
            </button>
          </div>
        </div>
      </header>

      <section>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <TrackList tracks={tracks} />
        </div>
      </section>

      {tracks.length === 0 && (
        <div className="text-center text-gray-500 py-20">
          <h3 className="text-2xl font-semibold mb-4">No Tracks Found</h3>
          <p>This album does not have any tracks in your library.</p>
        </div>
      )}
    </div>
  );
}
