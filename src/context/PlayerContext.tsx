'use client';
import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import type { Track } from '@/types';

interface PlayerState {
  queue: Track[],
  currentTrackIndex: number | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
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
          queue: [...prevState.queue, trackOrIndex]
        }));
        requestAnimationFrame(() => {
          setPlayerState(prevState => ({ ...prevState, currentTrackIndex: indexToPlay }));
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
        audio.play().catch(e => console.error("Error playing audio: ", e));
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

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setPlayerState(prevState => ({ ...prevState, currentTime: audio.currentTime }));
    const handleLoadedMetadata = () => setPlayerState(prevState => ({ ...prevState, duration: audio.duration }));
    const handleEnded = () => playNext();
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
