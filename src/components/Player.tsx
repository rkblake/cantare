'use client';
import Image from 'next/image';
import React from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { formatTime } from '@/utils/formatTime';

import { ForwardIcon, BackwardIcon, PlayIcon, PauseIcon, SpeakerWaveIcon } from '@heroicons/react/24/solid';

const Player: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlayPause,
    seek,
    playNext,
    playPrev,
    queue,
    volume,
    setVolume,
    // audioRef,
  } = usePlayer();

  const [isVolumeSliderOpen, setVolumeSliderOpen] = React.useState(false);

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
  };

  const title = currentTrack?.title ?? 'Unknown Title';
  const artist = currentTrack?.artist ?? 'Unknown Artist';
  const album = currentTrack?.album ?? 'Unknown Album';
  const artworkUrl = currentTrack?.artworkPath ? `/api/artwork/${currentTrack.id}` : '/images/default-artwork.svg'; // TODO: artwork api route

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(event.target.value);
    seek(time);
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-4 flex items-center justify-between shadow-lg z-50">
      {/* Track Info & Artwork */}
      <div className="flex items-center w-1/4">
        <Image
          src={artworkUrl}
          alt="Album Artwork"
          className="w-12 h-12 rounded mr-4"
          width={48}
          height={48}
        />
        <div>
          <div className="font-bold text-sm truncate">{title}</div>
          <div className="text-xs text-gray-400 truncate">{artist} - {album}</div>
        </div>
      </div>

      {/* Controls and Slider */}
      <div className="flex flex-col items-center w-1/2">
        {/* Buttons */}
        <div className="flex items-center space-x-4 mb-1">
          <button onClick={playPrev} className="p-2 rounded-full hover:bg-gray-700 disabled:opacity-50" disabled={!currentTrack}>
            <BackwardIcon className="h-6 w-6" />
          </button>
          <button onClick={togglePlayPause} className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50" disabled={!currentTrack && queue.length === 0}>
            {isPlaying ? (
              <PauseIcon className="h-6 w-6" />
            ) : (
              <PlayIcon className="h-6 w-6" />
            )}
          </button>
          <button onClick={playNext} className="p-2 rounded-full hover:bg-gray-700 disabled:opacity-50" disabled={!currentTrack}>
            <ForwardIcon className="h-6 w-6" />
          </button>
        </div>
        {/* Slider */}
        <div className="flex items-center w-full space-x-2">
          <div className="text-xs text-gray-400">{formatTime(currentTime)}</div>
          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={currentTime}
            onChange={handleSliderChange}
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb" // Custom slider thumb styling needed in globals.css
            disabled={!currentTrack || duration === 0}
          />
          <div className="text-xs text-gray-400">{formatTime(duration)}</div>
        </div>
      </div>

      {/* Volume, Queue etc. (Optional for basic player) */}
      <div className="w-1/4 flex justify-end items-center">
        <div className="relative">
          <button onClick={() => setVolumeSliderOpen(!isVolumeSliderOpen)} className="p-2 rounded-full hover:bg-gray-700">
            <SpeakerWaveIcon className="h-6 w-6" />
          </button>
          {isVolumeSliderOpen && (
            <div className="absolute bottom-full mb-2 right-0 bg-gray-700 rounded-lg shadow-lg flex items-center justify-center h-32 w-12">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-24 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider-thumb"
                style={{ transform: 'rotate(-90deg)' }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
};

export default Player;
