import type { Track, Album, ArtistWithImage } from '@/types'; // Import your types
import TrackList from '@/components/TrackList'; // Component to display tracks
import AlbumCard from '@/components/AlbumCard'; // Component to display an album card
import ArtistCard from '@/components/ArtistCard'; // Component to display an artist card
import { Cog6ToothIcon } from '@heroicons/react/24/solid';
import Link from 'next/link'; // For linking to other pages
import { getAllArtistsWithImage, getAlbums, getTracks } from '@/database/sqlite';

// The library changes whenever a scan is run, so this page must not be prerendered.
export const dynamic = 'force-dynamic';

async function getHomepageData(): Promise<{ recentTracks: Track[], recentAlbums: Album[], featuredArtists: ArtistWithImage[] }> {
  try {
    const [tracks, albums, artists] = await Promise.all([
      getTracks(),
      getAlbums(),
      getAllArtistsWithImage(),
    ]);

    const recentTracks = tracks.slice(-10).reverse();
    const recentAlbums = albums.slice(-10).reverse();
    const featuredArtists = artists.slice(-10).reverse();

    return { recentTracks, recentAlbums, featuredArtists };
  } catch (error) {
    console.error("Error fetching homepage data:", error);
    return { recentTracks: [], recentAlbums: [], featuredArtists: [] }; // Return empty data on error
  }
}

export default async function HomePage() {
  // Fetch data server-side
  const { recentTracks, recentAlbums, featuredArtists } = await getHomepageData();

  return (
    <div className="space-y-12 p-4 sm:p-6 md:p-8">
      {/* Header */}
      <header className="flex justify-between items-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-white">
          Welcome Back
        </h1>
        <Link href="/settings" className="text-gray-400 hover:text-white">
          <Cog6ToothIcon className="h-8 w-8" />
        </Link>
      </header>

      {/* Section for Recent Albums */}
      {recentAlbums.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6 text-gray-200">Recent Albums</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {recentAlbums.map(album => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        </section>
      )}

      {/* Section for Recent Tracks */}
      {recentTracks.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6 text-gray-200">Recent Tracks</h2>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <TrackList tracks={recentTracks} />
          </div>
        </section>
      )}

      {/* Section for Featured Artists */}
      {featuredArtists.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6 text-gray-200">Featured Artists</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {featuredArtists.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} imageUrl={artist.imageUrl ?? undefined} />
            ))}
          </div>
        </section>
      )}

      {/* Message if no music found */}
      {recentTracks.length === 0 && recentAlbums.length === 0 && featuredArtists.length === 0 && (
        <div className="text-center text-gray-500 py-20">
          <h3 className="text-2xl font-semibold mb-4">Your Library is Empty</h3>
          <p className="mb-6 max-w-md mx-auto">
            It looks like no music has been scanned yet. Go to the settings page to add your music directory and start listening.
          </p>
          <Link href="/settings" className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-full hover:bg-blue-500 transition-colors duration-300">
            Go to Settings
          </Link>
        </div>
      )}
    </div>
  );
}
