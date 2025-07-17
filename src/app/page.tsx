import type { Track, Album, Artist } from '@/types'; // Import your types
import TrackList from '@/components/TrackList'; // Component to display tracks
import AlbumCard from '@/components/AlbumCard'; // Component to display an album card
import ArtistCard from '@/components/ArtistCard'; // Component to display an artist card
import Link from 'next/link'; // For linking to other pages

type Response = {
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
}

// This is a Server Component by default.
// Data fetching happens on the server before rendering.
async function getHomepageData(): Promise<{ recentTracks: Track[], recentAlbums: Album[], featuredArtists: Artist[] }> {
  // This function would call your backend API to get data for the homepage.
  // Example: Fetch recent uploads, popular tracks, featured albums/artists.
  // For demonstration, let's just fetch some data from the search endpoint
  // or a hypothetical dedicated homepage API endpoint.
  // Replace with actual API calls relevant to your homepage design.
  try {
    // Example: Fetching data using the search API (assuming it returns some default results with empty query)
    // Or better, create a specific /api/homepage endpoint.
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/api/search?q=`); // Example: fetches some initial data
    if (!res.ok) {
      console.error("Failed to fetch homepage data:", res.status, await res.text());
      // Return empty data on failure
      return { recentTracks: [], recentAlbums: [], featuredArtists: [] };
    }
    const data = await res.json() as Response;
    // The search endpoint returns { tracks, albums, artists }. We can use these.
    // In a real app, /api/homepage would return specifically curated data.
    return { recentTracks: data.tracks, recentAlbums: data.albums, featuredArtists: data.artists };

  } catch (error) {
    console.error("Error fetching homepage data:", error);
    return { recentTracks: [], recentAlbums: [], featuredArtists: [] }; // Return empty data on error
  }
}

export default async function HomePage() {
  // Fetch data server-side
  const { recentTracks, recentAlbums, featuredArtists } = await getHomepageData();

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Welcome to Your Music Library</h1>

      {/* Section for Recent Albums */}
      {recentAlbums.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-4">Recent Albums</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {/* Map through recent albums and render AlbumCard */}
            {recentAlbums.map(album => (
              <AlbumCard key={album.id} album={album} /> // Make sure AlbumCard is implemented
            ))}
          </div>
        </section>
      )}

      {/* Section for Recent Tracks */}
      {recentTracks.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-4">Recent Tracks</h2>
          {/* Use the TrackList component */}
          <TrackList tracks={recentTracks} />
        </section>
      )}

      {/* Section for Featured Artists (Optional) */}
      {featuredArtists.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-4">Featured Artists</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {/* Map through artists */}
            {featuredArtists.map(artist => (
              <ArtistCard key={artist.id} artist={artist} /> // Make sure ArtistCard is implemented
            ))}
          </div>
        </section>
      )}

      {/* Message if no music found */}
      {recentTracks.length === 0 && recentAlbums.length === 0 && featuredArtists.length === 0 && (
        <div className="text-center text-gray-400 py-10">
          <p className="mb-4">{"It looks like your music library hasn't been scanned yet."}</p>
          <p>
            Go to the{' '}
            <Link href="/settings" className="text-blue-400 hover:underline">
              Settings page
            </Link>{' '}
            to configure your music directory and initiate a scan.
          </p>
        </div>
      )}
    </div>
  );
}
