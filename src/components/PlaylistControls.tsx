'use client';

import React from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { PlayIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import type { Track } from '@/types';

interface PlaylistControlsProps {
  tracks: Track[];
}

export default function PlaylistControls({ tracks }: PlaylistControlsProps) {
  const { playPlaylist } = usePlayer();

  const handlePlay = () => {
    playPlaylist(tracks, false);
  };

  const handleShuffle = () => {
    playPlaylist(tracks, true);
  };

  return (
    <>
      <button 
        onClick={handlePlay}
        className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-full font-semibold flex items-center space-x-2 transition-colors"
      >
        <PlayIcon className="h-5 w-5" />
        <span>Play</span>
      </button>
      <button 
        onClick={handleShuffle}
        className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-full font-semibold flex items-center space-x-2 transition-colors"
      >
        <ArrowPathIcon className="h-5 w-5" />
        <span>Shuffle</span>
      </button>
    </>
  );
}