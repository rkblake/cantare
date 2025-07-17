'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { Track, Album, Artist } from '@/types';
import TrackList from '@/components/TrackList';
import AlbumCard from '@/components/AlbumCard';
import ArtistCard from '@/components/ArtistCard';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';

// Debounce hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ tracks: Track[], albums: Album[], artists: { artist: Artist, imageUrl: string }[] }>({ tracks: [], albums: [], artists: [] });
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  const fetchResults = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim() === '') {
      setResults({ tracks: [], albums: [], artists: [] });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        const artistsWithImages = await Promise.all(data.artists.map(async (artist: Artist) => {
          const imageUrlRes = await fetch(`/api/artist/image/${artist.id}`);
          const { imageUrl } = await imageUrlRes.json();
          return { artist, imageUrl };
        }));
        setResults({ ...data, artists: artistsWithImages });
      } else {
        console.error("Failed to fetch search results");
        setResults({ tracks: [], albums: [], artists: [] });
      }
    } catch (error) {
      console.error("Error fetching search results:", error);
      setResults({ tracks: [], albums: [], artists: [] });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults(debouncedQuery);
  }, [debouncedQuery, fetchResults]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const noResults = !isLoading && debouncedQuery && results.tracks.length === 0 && results.albums.length === 0 && results.artists.length === 0;

  return (
    <div className="space-y-8 p-4 sm:p-6 md:p-8">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search for tracks, albums, or artists..."
          className="w-full bg-gray-700 text-white rounded-full py-3 pl-12 pr-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
      </div>

      {isLoading && <div className="text-center text-gray-400">Loading...</div>}

      {noResults && (
        <div className="text-center text-gray-500 py-16">
          <h3 className="text-xl font-semibold">No results found for &quot;{debouncedQuery}&quot;</h3>
          <p>Please try a different search term.</p>
        </div>
      )}

      {!isLoading && !debouncedQuery && (
        <div className="text-center text-gray-500 py-16">
          <h3 className="text-xl font-semibold">Search Your Library</h3>
          <p>Find your favorite tracks, albums, and artists.</p>
        </div>
      )}

      <div className="space-y-12">
        {results.tracks.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-200">Tracks</h2>
            <div className="bg-gray-800/50 rounded-lg">
              <TrackList tracks={results.tracks} />
            </div>
          </section>
        )}

        {results.albums.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-200">Albums</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {results.albums.map(album => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>
          </section>
        )}

        {results.artists.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-200">Artists</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {results.artists.map(({ artist, imageUrl }) => (
                <ArtistCard key={artist.id} artist={artist} imageUrl={imageUrl} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

