'use client';
import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import type { Track } from '@/types';

interface PlayerState {
  queue: Track[],
  currentTrackIndex: number | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  currentTrack: Track | null;
}

interface PlayerContextType extends PlayerState {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  playTrack: (trackOrIndex: Track | number) => void;
  togglePlayPause: () => void;
  seek: (time: number) => void;
  playNext: () => void;
  playPrev: () => void;
  addToQueue: (track: Track) => void;
  setVolume: (volume: number) => void;
  removeFromQueue: (trackId: string) => void;
  clearQueue: () => void;
  playPlaylist: (tracks: Track[], shuffle?: boolean) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playerState, setPlayerState] = useState<PlayerState>({
    queue: [],
    currentTrackIndex: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    currentTrack: null,
  });

  useEffect(() => {
    if (playerState.currentTrackIndex !== null && playerState.queue.length > playerState.currentTrackIndex) {
      // if (playerState.currentTrackIndex === null) return;
      setPlayerState(prevState => ({
        ...prevState,
        currentTrack: prevState.queue[prevState.currentTrackIndex!] ?? null
      }));
    } else {
      setPlayerState(prevState => ({
        ...prevState,
        currentTrack: null,
        isPlaying: false,
        currentTime: 0,
        duration: 0
      }));
    }
  }, [playerState.currentTrackIndex, playerState.queue]);

  const playTrack = React.useCallback((trackOrIndex: Track | number) => {
    let indexToPlay: number;
    if (typeof trackOrIndex === 'number') {
      indexToPlay = trackOrIndex;
    } else {
      const existingIndex = playerState.queue.findIndex(t => t.id === trackOrIndex.id);
      if (existingIndex !== -1) {
        indexToPlay = existingIndex;
      } else {
        indexToPlay = playerState.queue.length;
        setPlayerState(prevState => ({
          ...prevState,
          queue: [...prevState.queue, trackOrIndex],
        }));
        requestAnimationFrame(() => {
          setPlayerState(prevState => ({ ...prevState, currentTrackIndex: indexToPlay, isPlaying: true }));
        });
        return;
      }
    }

    if (indexToPlay >= 0 && indexToPlay < playerState.queue.length) {
      setPlayerState(prevState => ({
        ...prevState,
        currentTrackIndex: indexToPlay,
        isPlaying: true,
      }));
    } else {
      console.warn("Attempted to play invalid track index: ", indexToPlay);
      setPlayerState(prevState => ({
        ...prevState,
        currentTrackIndex: null,
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        currentTrack: null,
      }));
    }
  }, [playerState.queue]);

  useEffect(() => {
    const audio = audioRef.current;
    const track = playerState.currentTrack;
    if (audio && track) {
      const streamUrl = `/api/stream?q=${track.id}`;
      if (audio.src !== streamUrl) {
        audio.src = streamUrl;
        audio.load();
      }
      if (playerState.isPlaying) {
        audio.play().catch(e => {
          if (e instanceof Error && e.name === 'AbortError') {
            // This error is expected when the user changes songs, so we can ignore it.
            return;
          }
          console.error("Error playing audio: ", e)
        });
      } else {
        audio.pause();
      }
    } else if (audio && !track) {
      audio.src = '';
      audio.load();
      setPlayerState(prevState => ({ ...prevState, isPlaying: false, currentTime: 0, duration: 0 }));
    }
  }, [playerState.currentTrack, playerState.isPlaying]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (audio) {
      if (playerState.isPlaying) {
        audio.pause();
      } else {
        if (playerState.currentTrack) {
          audio.play().catch(e => console.error("Error playing audio: ", e));
        } else if (playerState.queue.length > 0) {
          playTrack(0);
        }
      }
    }
  };

  const seek = (time: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = time;
      setPlayerState(prevState => ({ ...prevState, currentTime: time }));
    }
  };

  const playNext = React.useCallback(() => {
    if (playerState.currentTrackIndex !== null && playerState.queue.length > 0) {
      const nextIndex = (playerState.currentTrackIndex + 1) % playerState.queue.length;
      playTrack(nextIndex);
    }
  }, [playerState.currentTrackIndex, playerState.queue.length, playTrack]);

  const playPrev = React.useCallback(() => {
    if (playerState.currentTrackIndex !== null && playerState.queue.length > 0) {
      const prevIndex = (playerState.currentTrackIndex - 1 + playerState.queue.length) % playerState.queue.length;
      playTrack(prevIndex);
    }
  }, [playerState.currentTrackIndex, playerState.queue.length, playTrack]);

  const addToQueue = (track: Track) => {
    if (!playerState.queue.some(t => t.id === track.id)) {
      setPlayerState(prevState => ({
        ...prevState,
        queue: [...prevState.queue, track]
      }));
    }
  }

  const removeFromQueue = (trackId: string) => {
    setPlayerState(prevState => {
      const newQueue = prevState.queue.filter(t => t.id !== trackId);
      let newTrackIndex = prevState.currentTrackIndex;

      if (prevState.currentTrack?.id === trackId) {
        // If the currently playing track is removed, play the next one
        if (newQueue.length === 0) {
          newTrackIndex = null;
        } else if (newTrackIndex !== null && newTrackIndex >= newQueue.length) {
          newTrackIndex = 0;
        }
      } else if (newTrackIndex !== null) {
        // Adjust index if a track before the current one is removed
        const removedTrackIndex = prevState.queue.findIndex(t => t.id === trackId);
        if (removedTrackIndex < newTrackIndex) {
          newTrackIndex--;
        }
      }

      return {
        ...prevState,
        queue: newQueue,
        currentTrackIndex: newTrackIndex,
      };
    });
  };

  const clearQueue = () => {
    setPlayerState(prevState => ({
      ...prevState,
      queue: prevState.currentTrack ? [prevState.currentTrack] : [],
      currentTrackIndex: prevState.currentTrack ? 0 : null,
    }));
  };

  const playPlaylist = (tracks: Track[], shuffle = false) => {
    if (tracks.length === 0) return;

    const playlistTracks = [...tracks];
    if (shuffle) {
      // Fisher-Yates shuffle algorithm
      for (let i = playlistTracks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = playlistTracks[i]!;
        playlistTracks[i] = playlistTracks[j]!;
        playlistTracks[j] = temp;
      }
    }

    setPlayerState(prevState => ({
      ...prevState,
      queue: playlistTracks,
      currentTrackIndex: 0,
      isPlaying: true,
    }));
  };

  const setVolume = (volume: number) => {
    const newVolume = Math.max(0, Math.min(1, volume));
    setPlayerState(prevState => ({ ...prevState, volume: newVolume }));
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = playerState.volume;
    }
  }, [audioRef, playerState.volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setPlayerState(prevState => ({ ...prevState, currentTime: audio.currentTime }));
    const handleLoadedMetadata = () => setPlayerState(prevState => ({ ...prevState, duration: audio.duration }));
    const handleTrackEnded = () => {
      if (playerState.currentTrack) {
        removeFromQueue(playerState.currentTrack.id);
      }
      playNext();
    }

    const handleEnded = () => handleTrackEnded();
    const handlePlay = () => setPlayerState(prevState => ({ ...prevState, isPlaying: true }));
    const handlePause = () => setPlayerState(prevState => ({ ...prevState, isPlaying: false }));
    const handleError = (e: Event) => { console.error("Audio error: ", e); };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
    }
  }, [playNext]);

  const contextValue: PlayerContextType = {
    ...playerState,
    audioRef,
    playTrack,
    togglePlayPause,
    seek,
    playNext,
    playPrev,
    addToQueue,
    setVolume,
    removeFromQueue,
    clearQueue,
    playPlaylist,
  };

  return (
    <PlayerContext.Provider value={contextValue}>
      {children}
      <audio ref={audioRef} className="hidden"></audio>
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be use within a PlayerProvider');
  }
  return context;
}
