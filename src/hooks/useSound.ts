import { useRef, useCallback, useEffect, useState } from 'react';

interface UseSoundOptions {
  volume?: number;
  debounceMs?: number;
  preload?: boolean;
}

interface SoundControls {
  play: () => Promise<void>;
  stop: () => void;
  setVolume: (volume: number) => void;
  isPlaying: boolean;
}

export const useSound = (
  src: string,
  options: UseSoundOptions = {}
): SoundControls => {
  const {
    volume = 0.7,
    debounceMs = 200,
    preload = true
  } = options;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastPlayedRef = useRef<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio(src);
    audio.volume = volume;
    if (preload) {
      audio.preload = 'auto';
    }

    // Event listeners
    const handlePlay = () => setIsPlaying(true);
    const handleEnded = () => setIsPlaying(false);
    const handlePause = () => setIsPlaying(false);
    const handleError = (e: Event) => {
      console.warn('Audio error for', src, ':', e);
      setIsPlaying(false);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    audioRef.current = audio;

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audioRef.current = null;
    };
  }, [src, volume, preload]);

  const play = useCallback(async (): Promise<void> => {
    const now = Date.now();
    const audio = audioRef.current;

    if (!audio) {
      console.warn('Audio element not initialized for', src);
      return Promise.resolve();
    }

    // Debounce rapid plays only if debounceMs > 0
    if (debounceMs > 0 && now - lastPlayedRef.current < debounceMs) {
      console.log('Audio play debounced for', src);
      return Promise.resolve();
    }

    lastPlayedRef.current = now;

    try {
      // Stop any current playback first to avoid interruption errors
      if (!audio.paused) {
        audio.pause();
      }
      
      // Reset audio to beginning
      audio.currentTime = 0;
      
      // Play the audio
      await audio.play();
      console.log('Audio played successfully:', src);
    } catch (error) {
      console.warn('Audio play failed for', src, ':', error);
      // Don't throw, just log the error
    }
  }, [debounceMs, src]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = Math.max(0, Math.min(1, newVolume));
    }
  }, []);

  return {
    play,
    stop,
    setVolume,
    isPlaying
  };
};

// Preload hook for multiple sounds
export const usePreloadSounds = (sounds: string[]) => {
  useEffect(() => {
    sounds.forEach(src => {
      const audio = new Audio(src);
      audio.preload = 'auto';
    });
  }, [sounds]);
};

// Sound context for global mute/volume control
export const useSoundSettings = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [globalVolume, setGlobalVolume] = useState(0.7);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  return {
    isMuted,
    globalVolume,
    setGlobalVolume,
    toggleMute,
    effectiveVolume: isMuted ? 0 : globalVolume
  };
}; 