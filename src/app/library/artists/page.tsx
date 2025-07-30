'use client';

import { useState, useEffect, useRef } from 'react';
import type { Artist } from '@/types';
import ArtistCard from '@/components/ArtistCard';

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const initialLoad = useRef(true);

  async function loadMoreArtists() {
    if (!hasMore || loading) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/artists?page=${page}&limit=20`);
      const result = await response.json() as { data: Artist[], hasMore: boolean };
      setArtists((prevArtists) => [...prevArtists, ...result.data]);
      setHasMore(result.hasMore);
      setPage((prevPage) => prevPage + 1);
    } catch (error) {
      console.error('Failed to fetch artists:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialLoad.current) {
      loadMoreArtists().catch(console.log);
      initialLoad.current = false;
    }
  });

  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tight text-white">Artists</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-4">
        {artists.map((artist) => (
          <ArtistCard key={artist.id} artist={artist} />
        ))}
      </div>
      {loading && <p className="text-white">Loading...</p>}
      {hasMore && !loading && (
        <button
          onClick={loadMoreArtists}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Load More
        </button>
      )}
    </div>
  );
}
