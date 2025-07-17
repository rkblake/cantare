import type { Album, Artist } from '@/types';
import AlbumCard from '@/components/AlbumCard';
import Image from 'next/image';

type ArtistData = {
  artist: Artist;
  albums: Album[];
}

async function getArtistData(id: string): Promise<ArtistData> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/api/artist/${id}`);
    if (!res.ok) {
      console.error("Failed to fetch artist data:", res.status);
      return { artist: {} as Artist, albums: [] };
    }
    return await res.json() as ArtistData;
  } catch (error) {
    console.error("Error fetching artist data:", error);
    return { artist: {} as Artist, albums: [] };
  }
}

export default async function ArtistPage({ params }: { params: { id: string } }) {
  const { artist, albums } = await getArtistData(params.id);

  return (
    <div className="space-y-12 p-4 sm:p-6 md:p-8">
      <header className="flex items-center space-x-6">
        <Image
          src={'/images/default-artist.svg'}
          alt={artist.name ?? 'Artist Artwork'}
          width={128}
          height={128}
          className="w-32 h-32 rounded-full shadow-lg"
        />
        <div>
          <h1 className="text-5xl font-extrabold tracking-tight text-white">
            {artist.name}
          </h1>
          {/* Optional: Add genre or other info here */}
        </div>
      </header>

      {albums.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6 text-gray-200">Albums</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {albums.map(album => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        </section>
      )}

      {albums.length === 0 && (
        <div className="text-center text-gray-500 py-20">
          <h3 className="text-2xl font-semibold mb-4">No Albums Found</h3>
          <p>This artist does not have any albums in your library.</p>
        </div>
      )}
    </div>
  );
}
