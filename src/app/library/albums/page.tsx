'use client';

import { useState, useEffect, useRef } from 'react';
import type { Album } from '@/types';
import AlbumCard from '@/components/AlbumCard';

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const initialLoad = useRef(true);

  async function loadMoreAlbums() {
    if (!hasMore || loading) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/albums?page=${page}&limit=20`);
      const result = await response.json();
      const newAlbums = result.data;
      setAlbums((prevAlbums) => [...prevAlbums, ...newAlbums]);
      setHasMore(result.hasMore);
      setPage((prevPage) => prevPage + 1);
    } catch (error) {
      console.error('Failed to fetch albums:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialLoad.current) {
      loadMoreAlbums();
      initialLoad.current = false;
    }
  }, []);

  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tight text-white">Albums</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-4">
        {albums.map((album) => (
          <AlbumCard key={album.id} album={album} />
        ))}
      </div>
      {loading && <p className="text-white">Loading...</p>}
      {hasMore && !loading && (
        <button
          onClick={loadMoreAlbums}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Load More
        </button>
      )}
    </div>
  );
}
