"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import type { Playlist } from "@/types";
import { PlusCircleIcon } from "@heroicons/react/24/outline";

export default function PlaylistSidebar() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPlaylists = () => {
    fetch("/api/playlists")
      .then((res) => res.json())
      .then(setPlaylists)
      .catch(console.error);
  };

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const handleCreatePlaylist = async (name: string) => {
    try {
      await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      fetchPlaylists();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to create playlist:", error);
    }
  };

  return (
    <>
      <div className="space-y-4 flex-grow flex flex-col bg-gray-800 rounded-md p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Playlists</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="p-1 rounded-md hover:bg-gray-700"
          >
            <PlusCircleIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="flex-grow overflow-y-auto">
          {playlists.map((playlist) => (
            <Link
              key={playlist.id}
              href={`/playlist/${playlist.id}`}
              className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              {playlist.name}
            </Link>
          ))}
          {playlists.length === 0 && (
            <p className="text-gray-400 text-sm">No playlists yet</p>
          )}
        </div>
      </div>
      
      {isModalOpen && (
        <CreatePlaylistModal
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreatePlaylist}
        />
      )}
    </>
  );
}

function CreatePlaylistModal({ 
  onClose, 
  onSubmit 
}: { 
  onClose: () => void; 
  onSubmit: (name: string) => void; 
}) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
      setName("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Create New Playlist</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Playlist name"
            className="w-full p-3 rounded bg-gray-700 text-white mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 rounded bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}