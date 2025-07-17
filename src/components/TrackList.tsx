'use client';
import React, { useState } from 'react';
import type { Track } from '../types';
import { usePlayer } from '../context/PlayerContext';
import { formatTime } from '@/utils/formatTime';
import ContextMenu from './ContextMenu';

interface TrackListProps {
  tracks: Track[];
}

const TrackList: React.FC<TrackListProps> = ({ tracks }) => {
  const { playTrack, addToQueue } = usePlayer();
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number; track: Track } | null>(null);

  const handleRightClick = (event: React.MouseEvent, track: Track) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, track });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleAddToQueue = (track: Track) => {
    addToQueue(track);
    handleCloseContextMenu();
  };

  const handleAddToPlaylist = (track: Track, playlistId: string) => {
    // TODO: call API to add track to playlist
    console.log(`Add track ${track.title} to playlist ${playlistId}`);
    handleCloseContextMenu();
  };

  return (
    <div>
      {tracks.map(track => (
        <div
          key={track.id}
          className="flex items-center p-2 hover:bg-gray-700 cursor-pointer rounded"
          onClick={() => playTrack(track)}
          onContextMenu={(e) => handleRightClick(e, track)}
        >
          {/* TODO: add artwork thumbnail */}
          {/* <img src={track.artworkPath || '/images/default-artwork-small.png'} alt="Artwork" className="w-8 h-8 rounded mr-3" /> */}
          <div className="flex-grow truncate">
            <div className="font-medium text-sm truncate">{track.title ?? 'Unkwown Title'}</div>
            <div className="text-xs text-gray-400 truncate">{track.artist ?? 'Unknown Artist'}</div>
          </div>
          {track.duration && <div className="text-xs text-gray-500 ml-2">{formatTime(track.duration)}</div>}
        </div>
      ))}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={handleCloseContextMenu}
        >
          <button
            onClick={() => handleAddToQueue(contextMenu.track)}
            className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600"
          >
            Add To Queue
          </button>
          <button
            onClick={() => handleAddToPlaylist(contextMenu.track, "")}
            className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600"
          >
            Add To Playlist
          </button>
        </ContextMenu>
      )}
    </div>
  )
}

export default TrackList;
