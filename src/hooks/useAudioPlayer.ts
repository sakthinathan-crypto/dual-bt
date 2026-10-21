/**
 * Audio Player Hook for DualSync BT.
 * Integrates AudioEngine, MediaLibrary, and MediaSession API.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { AudioTrack, RepeatMode } from '../types/audio';
import { audioEngine } from '../services/audioEngine';
import { mediaLibraryService } from '../services/mediaLibraryService';

const STORAGE_KEY_VOLUMES = 'dualsync_volumes_v1';

export function useAudioPlayer() {
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Volumes
  const [masterVolume, setMasterVolumeState] = useState(0.85);
  const [device1Volume, setDevice1VolumeState] = useState(0.8);
  const [device2Volume, setDevice2VolumeState] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  // Modes
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('all');
  const [isShuffle, setIsShuffle] = useState(false);

  const prevVolumeRef = useRef(0.85);
  const tracksRef = useRef<AudioTrack[]>([]);
  tracksRef.current = tracks;
  const currentTrackRef = useRef<AudioTrack | null>(null);
  currentTrackRef.current = currentTrack;
  const repeatModeRef = useRef<RepeatMode>(repeatMode);
  repeatModeRef.current = repeatMode;
  const isShuffleRef = useRef<boolean>(isShuffle);
  isShuffleRef.current = isShuffle;

  // Restore saved volume levels
  useEffect(() => {
    try {
      const savedVol = localStorage.getItem(STORAGE_KEY_VOLUMES);
      if (savedVol) {
        const parsed = JSON.parse(savedVol);
        if (typeof parsed.master === 'number') {
          setMasterVolumeState(parsed.master);
          audioEngine.setMasterVolume(parsed.master);
        }
        if (typeof parsed.d1 === 'number') {
          setDevice1VolumeState(parsed.d1);
          audioEngine.setDevice1Volume(parsed.d1);
        }
        if (typeof parsed.d2 === 'number') {
          setDevice2VolumeState(parsed.d2);
          audioEngine.setDevice2Volume(parsed.d2);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Save volume levels
  const persistVolumes = useCallback((m: number, d1: number, d2: number) => {
    try {
      localStorage.setItem(STORAGE_KEY_VOLUMES, JSON.stringify({ master: m, d1, d2 }));
    } catch {
      // ignore
    }
  }, []);

  // Initialize library tracks
  useEffect(() => {
    const initialTracks = mediaLibraryService.getTracks();
    setTracks(initialTracks);
    if (initialTracks.length > 0 && !currentTrack) {
      setCurrentTrack(initialTracks[0]);
      setDuration(initialTracks[0].duration);
    }
  }, []);

  // Set up AudioElement event listeners
  useEffect(() => {
    const audio = audioEngine.getAudioElement();
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    const onEnded = () => {
      const mode = repeatModeRef.current;
      const list = tracksRef.current;
      const cur = currentTrackRef.current;

      if (mode === 'one') {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return;
      }

      if (list.length === 0) return;

      if (isShuffleRef.current) {
        const randomIndex = Math.floor(Math.random() * list.length);
        playTrack(list[randomIndex]);
        return;
      }

      const currentIndex = list.findIndex(t => t.id === cur?.id);
      if (currentIndex < list.length - 1) {
        playTrack(list[currentIndex + 1]);
      } else if (mode === 'all') {
        playTrack(list[0]);
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const playTrack = useCallback((track: AudioTrack) => {
    audioEngine.ensureAudioContext();
    const audio = audioEngine.getAudioElement();
    if (!audio) return;

    if (track.objectUrl) {
      audio.src = track.objectUrl;
      audio.load();
      audio.play().catch(err => {
        console.warn('Playback initiation error:', err);
      });
      setCurrentTrack(track);
      setDuration(track.duration);
      mediaLibraryService.markRecentlyPlayed(track.id);

      // Media Session API
      if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
        try {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: track.title,
            artist: track.artist,
            album: track.album,
            artwork: track.artworkUrl ? [{ src: track.artworkUrl, sizes: '512x512', type: 'image/jpeg' }] : [],
          });
        } catch {
          // ignore
        }
      }
    }
  }, []);

  const togglePlay = useCallback(() => {
    audioEngine.ensureAudioContext();
    const audio = audioEngine.getAudioElement();
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      if (!currentTrack && tracks.length > 0) {
        playTrack(tracks[0]);
      } else if (audio.src) {
        audio.play().catch(err => console.warn('Play failed:', err));
      } else if (currentTrack) {
        playTrack(currentTrack);
      }
    }
  }, [isPlaying, currentTrack, tracks, playTrack]);

  const seek = useCallback((timeSeconds: number) => {
    const audio = audioEngine.getAudioElement();
    if (audio) {
      audio.currentTime = timeSeconds;
      setCurrentTime(timeSeconds);
    }
  }, []);

  const skipNext = useCallback(() => {
    if (tracks.length === 0) return;
    if (isShuffle) {
      const idx = Math.floor(Math.random() * tracks.length);
      playTrack(tracks[idx]);
      return;
    }
    const idx = tracks.findIndex(t => t.id === currentTrack?.id);
    const nextIdx = (idx + 1) % tracks.length;
    playTrack(tracks[nextIdx]);
  }, [tracks, currentTrack, isShuffle, playTrack]);

  const skipPrevious = useCallback(() => {
    const audio = audioEngine.getAudioElement();
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    if (tracks.length === 0) return;
    const idx = tracks.findIndex(t => t.id === currentTrack?.id);
    const prevIdx = (idx - 1 + tracks.length) % tracks.length;
    playTrack(tracks[prevIdx]);
  }, [tracks, currentTrack, playTrack]);

  const setMasterVolume = useCallback((vol: number) => {
    setMasterVolumeState(vol);
    audioEngine.setMasterVolume(vol);
    persistVolumes(vol, device1Volume, device2Volume);
    if (vol > 0 && isMuted) setIsMuted(false);
  }, [device1Volume, device2Volume, isMuted, persistVolumes]);

  const setDevice1Volume = useCallback((vol: number) => {
    setDevice1VolumeState(vol);
    audioEngine.setDevice1Volume(vol);
    persistVolumes(masterVolume, vol, device2Volume);
  }, [masterVolume, device2Volume, persistVolumes]);

  const setDevice2Volume = useCallback((vol: number) => {
    setDevice2VolumeState(vol);
    audioEngine.setDevice2Volume(vol);
    persistVolumes(masterVolume, device1Volume, vol);
  }, [masterVolume, device1Volume, persistVolumes]);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      const restore = prevVolumeRef.current || 0.8;
      setMasterVolumeState(restore);
      audioEngine.setMasterVolume(restore);
      setIsMuted(false);
    } else {
      prevVolumeRef.current = masterVolume;
      setMasterVolumeState(0);
      audioEngine.setMasterVolume(0);
      setIsMuted(true);
    }
  }, [isMuted, masterVolume]);

  const cycleRepeatMode = useCallback(() => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffle(prev => !prev);
  }, []);

  const refreshTracks = useCallback(() => {
    setTracks([...mediaLibraryService.getTracks()]);
  }, []);

  return {
    tracks,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    masterVolume,
    device1Volume,
    device2Volume,
    isMuted,
    repeatMode,
    isShuffle,
    playTrack,
    togglePlay,
    seek,
    skipNext,
    skipPrevious,
    setMasterVolume,
    setDevice1Volume,
    setDevice2Volume,
    toggleMute,
    cycleRepeatMode,
    toggleShuffle,
    refreshTracks,
  };
}
