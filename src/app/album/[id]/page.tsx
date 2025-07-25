import Link from 'next/link';
import type { Album, Track } from '@/types';
import TrackList from '@/components/TrackList';
import Image from 'next/image';

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

export default async function AlbumPage({ params }: PageProps) {
  const { id } = await params;
  const { album, tracks } = await getAlbumData(id);

  return (
    <div className="space-y-12 p-4 sm:p-6 md:p-8">
      <header className="flex items-center space-x-6">
        <Image
          src={album.artworkPath ? `/api/artwork/${album.id}` : '/images/default-album.svg'}
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
