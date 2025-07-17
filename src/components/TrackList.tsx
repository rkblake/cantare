'use client';
import React, { useState } from 'react';
import type { Track } from '@/types';
import { usePlayer } from '@/context/PlayerContext';
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
    <div className="space-y-2">
      {/* Header */}
      <div className="grid grid-cols-[auto,1fr,auto] gap-4 px-4 py-2 text-sm text-gray-400 font-medium border-b border-gray-700">
        <div className="w-8 text-right">#</div>
        <div>Title</div>
        <div>Duration</div>
      </div>

      {tracks.map((track, index) => (
        <div
          key={track.id}
          className="grid grid-cols-[auto,1fr,auto] items-center gap-4 p-2 hover:bg-gray-700/50 cursor-pointer rounded-md"
          onClick={() => playTrack(track)}
          onContextMenu={(e) => handleRightClick(e, track)}
        >
          <div className="w-8 text-right text-gray-400">{index + 1}</div>
          <div className="flex items-center space-x-4 truncate">
            {/* Optional: Add artwork here if available */}
            {/* <Image src={track.artworkPath || '/default.png'} width={40} height={40} className="rounded" /> */}
            <div className="truncate">
              <div className="font-semibold text-white truncate">{track.title ?? 'Unknown Title'}</div>
              <div className="text-sm text-gray-400 truncate">{track.artist ?? 'Unknown Artist'}</div>
            </div>
          </div>
          <div className="text-sm text-gray-400">{track.duration ? formatTime(track.duration) : '0:00'}</div>
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
            Add to Queue
          </button>
          <button
            onClick={() => handleAddToPlaylist(contextMenu.track, "")}
            className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600"
          >
            Add to Playlist
          </button>
        </ContextMenu>
      )}
    </div>
  )
}

export default TrackList;
