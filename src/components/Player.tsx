import Image from 'next/image';
import React from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { formatTime } from '@/utils/formatTime';

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
    // audioRef,
  } = usePlayer();

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
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.933 12.813c-.593.063-.593.953 0 1.016l3.75.44c.817.096 1.46-.593 1.46-1.4V7.717c0-.807-.643-1.496-1.46-1.593l-3.75.44c-.593.063-.593.953 0 1.016l2.25.264V12.5l-2.25.263zM6.163 13.79l3.75.44c.817.096 1.46-.593 1.46-1.4V7.717c0-.807-.643-1.496-1.46-1.593l-3.75.44c-.593.063-.593.953 0 1.016l2.25.264V12.5l-2.25.263z" /></svg>
          </button>
          <button onClick={togglePlayPause} className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50" disabled={!currentTrack && queue.length === 0}>
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197 2.132A1 1 0 0110 13.803V6.197a1 1 0 011.555-.832l3.197 2.132c1.104.736 1.104 2.333 0 3.069z" /></svg>
            )}
          </button>
          <button onClick={playNext} className="p-2 rounded-full hover:bg-gray-700 disabled:opacity-50" disabled={!currentTrack}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.06 7.063a1 1 0 010 1.874l-3.197 2.132A1 1 0 009 12.803V15.7c0 .817.643 1.496 1.46 1.593l3.75.44a1 1 0 001.163-1.016l-.44-3.75a1 1 0 00-.953-1.016l-.264-.04V8.879l.264-.04a1 1 0 00.953-1.016l.44-3.75a1 1 0 00-1.163-1.016l-3.75.44a1 1 0 00-1.46 1.593V11.2" /></svg>
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
      <div className="w-1/4 flex justify-end">
        {/* Volume control, Queue button */}
      </div>
    </div>
  )
};

export default Player;
