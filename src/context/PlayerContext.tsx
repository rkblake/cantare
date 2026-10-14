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
}

interface PlayerContextType extends PlayerState {
  currentTrack: Track | null;
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
  });

  // Derive the current track synchronously so the audio effect never sees a
  // stale `currentTrack` alongside a freshly-updated `isPlaying` flag.
  const currentTrack = playerState.currentTrackIndex !== null
    ? playerState.queue[playerState.currentTrackIndex] ?? null
    : null;

  const playTrack = React.useCallback((trackOrIndex: Track | number) => {
    setPlayerState(prevState => {
      let indexToPlay: number;

      if (typeof trackOrIndex === 'number') {
        indexToPlay = trackOrIndex;
      } else {
        const existingIndex = prevState.queue.findIndex(t => t.id === trackOrIndex.id);
        if (existingIndex !== -1) {
          return {
            ...prevState,
            currentTrackIndex: existingIndex,
            isPlaying: true,
          };
        }

        // Append the new track and start it in the same update so the audio
        // effect sees the track and the play flag together.
        return {
          ...prevState,
          queue: [...prevState.queue, trackOrIndex],
          currentTrackIndex: prevState.queue.length,
          isPlaying: true,
        };
      }

      if (indexToPlay >= 0 && indexToPlay < prevState.queue.length) {
        return {
          ...prevState,
          currentTrackIndex: indexToPlay,
          isPlaying: true,
        };
      }

      console.warn("Attempted to play invalid track index: ", indexToPlay);
      return {
        ...prevState,
        currentTrackIndex: null,
        isPlaying: false,
        currentTime: 0,
        duration: 0,
      };
    });
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    const track = currentTrack;
    if (audio && track) {
      const streamUrl = `/api/stream?q=${track.id}`;
      const fullStreamUrl = `${window.location.origin}${streamUrl}`;
      if (audio.src !== fullStreamUrl) {
        audio.src = fullStreamUrl;
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
      // Don't set empty src, just pause and reset state
      audio.pause();
      setPlayerState(prevState => ({ ...prevState, isPlaying: false, currentTime: 0, duration: 0 }));
    }
  }, [currentTrack, playerState.isPlaying]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (audio) {
      if (playerState.isPlaying) {
        audio.pause();
      } else {
        if (currentTrack) {
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
      setPlayerState(prevState => {
        const wasQueueEmpty = prevState.queue.length === 0;
        if (wasQueueEmpty) {
          return {
            ...prevState,
            queue: [track],
            currentTrackIndex: 0,
            isPlaying: true,
          };
        }
        return {
          ...prevState,
          queue: [...prevState.queue, track],
        };
      });
    }
  };

  const removeFromQueue = (trackId: string) => {
    setPlayerState(prevState => {
      const newQueue = prevState.queue.filter(t => t.id !== trackId);
      const prevTrack = prevState.currentTrackIndex !== null
        ? prevState.queue[prevState.currentTrackIndex] ?? null
        : null;
      let newTrackIndex = prevState.currentTrackIndex;

      if (prevTrack?.id === trackId) {
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
    setPlayerState(prevState => {
      const prevTrack = prevState.currentTrackIndex !== null
        ? prevState.queue[prevState.currentTrackIndex] ?? null
        : null;
      return {
        ...prevState,
        queue: prevTrack ? [prevTrack] : [],
        currentTrackIndex: prevTrack ? 0 : null,
      };
    });
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
      setPlayerState(prevState => {
        if (prevState.currentTrackIndex === null) {
          return prevState;
        }

        // Remove the finished track and keep the same index so the next track
        // plays (wrapping to the start after the last track). Setting isPlaying
        // here re-asserts playback after the browser's accompanying `pause` event.
        const newQueue = prevState.queue.filter((_, index) => index !== prevState.currentTrackIndex);
        if (newQueue.length === 0) {
          return {
            ...prevState,
            queue: newQueue,
            currentTrackIndex: null,
            isPlaying: false,
            currentTime: 0,
            duration: 0,
          };
        }

        const nextIndex = prevState.currentTrackIndex >= newQueue.length
          ? 0
          : prevState.currentTrackIndex;

        return {
          ...prevState,
          queue: newQueue,
          currentTrackIndex: nextIndex,
          isPlaying: true,
          currentTime: 0,
          duration: 0,
        };
      });
    }

    const handleEnded = () => handleTrackEnded();
    const handlePlay = () => setPlayerState(prevState => ({ ...prevState, isPlaying: true }));
    const handlePause = () => {
      // Reaching the end of a track also fires `pause`; don't treat that as a
      // user pause, the `ended` handler advances and keeps playing.
      if (!audio.ended) {
        setPlayerState(prevState => ({ ...prevState, isPlaying: false }));
      }
    };
    const handleError = (e: Event) => {
      const audioElement = e.target as HTMLAudioElement;
      if (audioElement?.src !== window.location.href) {
        console.error("Audio error: ", e, "Source:", audioElement.src);
      }
    };

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
  }, []);

  const contextValue: PlayerContextType = {
    ...playerState,
    currentTrack,
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
