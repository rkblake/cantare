'use client';
import React, { useState, useEffect } from 'react';
import type { Track, Playlist } from '@/types';
import { usePlayer } from '@/context/PlayerContext';
import { formatTime } from '@/utils/formatTime';
import ContextMenu from './ContextMenu';

interface TrackListProps {
  tracks: Track[];
  playlistId?: string;
}

const TrackList: React.FC<TrackListProps> = ({ tracks, playlistId }) => {
  const { playTrack, addToQueue } = usePlayer();
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number; track: Track } | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    fetch('/api/playlists')
      .then(res => res.json())
      .then(setPlaylists)
      .catch(console.error);
  }, []);

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

  const handleRemoveFromPlaylist = async (track: Track) => {
    if (!playlistId) return;

    try {
      const playlist = playlists.find(p => p.id === playlistId);
      if (!playlist) return;

      const updatedTrackIds = playlist.trackIds.filter(id => id !== track.id);

      await fetch(`/api/playlists/${playlistId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackIds: updatedTrackIds }),
      });

      // Optimistically update the UI or refetch data
      console.log(`Removed "${track.title}" from "${playlist.name}"`);
    } catch (error) {
      console.error('Failed to remove track from playlist:', error);
    }
    handleCloseContextMenu();
  };

  const handleAddToPlaylist = async (track: Track, playlistId: string) => {
    try {
      const playlist = playlists.find(p => p.id === playlistId);
      if (!playlist) return;

      const updatedTrackIds = [...playlist.trackIds, track.id];

      await fetch(`/api/playlists/${playlistId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackIds: updatedTrackIds }),
      });

      console.log(`Added "${track.title}" to "${playlist.name}"`);
    } catch (error) {
      console.error('Failed to add track to playlist:', error);
    }
    handleCloseContextMenu();
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-2 text-sm text-gray-400 font-medium border-b border-gray-700">
        <div className="w-8 text-right">#</div>
        <div>Title</div>
        <div className="flex-1 text-right">Duration</div>
      </div>

      {tracks.map((track, index) => (
        <div
          key={track.id}
          className="items-center gap-4 p-2 hover:bg-gray-700/50 cursor-pointer rounded-md"
          onClick={() => playTrack(track)}
          onContextMenu={(e) => handleRightClick(e, track)}
        >
          <div className="flex items-center space-x-4 truncate">
            {/* Optional: Add artwork here if available */}
            <div className="w-8 text-right text-gray-400">{index + 1}</div>
            {/* <Image src={track.artworkPath || '/default.png'} width={40} height={40} className="rounded" /> */}
            <div className="truncate">
              <span className="font-semibold text-white">{track.title ?? 'Unknown Title'}</span>
              <span className="text-sm text-gray-400"> - {track.artist ?? 'Unknown Artist'}</span>
            </div>
            <div className="flex-1 text-right text-sm text-gray-400">{track.duration ? formatTime(track.duration) : '0:00'}</div>
          </div>
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
          {playlistId && (
            <button
              onClick={() => handleRemoveFromPlaylist(contextMenu.track)}
              className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-600"
            >
              Remove from Playlist
            </button>
          )}

          <div className="border-t border-gray-600 my-1" />

          <div className="px-4 py-2 text-xs text-gray-400 uppercase tracking-wide">
            Add to Playlist
          </div>

          {playlists.length > 0 ? (
            playlists.map(playlist => (
              <button
                key={playlist.id}
                onClick={() => handleAddToPlaylist(contextMenu.track, playlist.id)}
                className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600"
              >
                {playlist.name}
              </button>
            ))
          ) : (
            <div className="px-4 py-2 text-sm text-gray-400">
              No playlists available
            </div>
          )}
        </ContextMenu>
      )}
    </div>
  )
}

export default TrackList;
