'use client';
import React from 'react';
import type { Track } from '@/types';
import { usePlayer } from '@/context/PlayerContext';
import { useClickOutside } from '@/hooks/useClickOutside';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface QueueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QueueModal: React.FC<QueueModalProps> = ({ isOpen, onClose }) => {
  const { queue, currentTrack, removeFromQueue, clearQueue, playTrack } = usePlayer();
  const queueRef = useClickOutside<HTMLDivElement>(onClose);

  if (!isOpen) return null;

  const handleTrackClick = (track: Track) => {
    playTrack(track);
  };

  return (
    <div className="fixed bottom-24 right-4 mb-2 z-50">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md" ref={queueRef}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Up Next</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {queue.map((track: Track) => (
            <div
              key={track.id}
              className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${currentTrack?.id === track.id ? 'bg-blue-600/30' : 'hover:bg-gray-700/50'}`}
              onClick={() => handleTrackClick(track)}
            >
              <div className="truncate">
                <span className={`font-semibold ${currentTrack?.id === track.id ? 'text-blue-400' : 'text-white'}`}>{track.title}</span>
                <span className="text-sm text-gray-400"> - {track.artist}</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); removeFromQueue(track.id); }} className="p-1 rounded-full hover:bg-gray-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
        {queue.length > 1 && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={clearQueue}
              className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition-colors"
            >
              Clear Queue
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueueModal;
