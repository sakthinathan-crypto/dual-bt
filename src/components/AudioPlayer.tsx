/**
 * Central Audio Player Component for DualSync BT.
 * Features playback controls, waveform visualizer, seek scrubber, format details, and file adder.
 */

import React, { useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Music, Upload, Disc } from 'lucide-react';
import { AudioTrack, RepeatMode } from '../types/audio';
import { AudioVisualizer } from './AudioVisualizer';

interface AudioPlayerProps {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onSkipNext: () => void;
  onSkipPrevious: () => void;
  repeatMode: RepeatMode;
  onCycleRepeat: () => void;
  isShuffle: boolean;
  onToggleShuffle: () => void;
  onAddFiles: (files: FileList) => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onSeek,
  onSkipNext,
  onSkipPrevious,
  repeatMode,
  onCycleRepeat,
  isShuffle,
  onToggleShuffle,
  onAddFiles,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    const targetTime = (val / 100) * duration;
    onSeek(targetTime);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddFiles(e.target.files);
    }
  };

  return (
    <div className="bg-[#141B2D] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/*,.mp3,.wav,.flac,.m4a,.aac,.ogg"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Top Bar: Now Playing + Add Local Audio Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Disc className={`w-5 h-5 text-[#6C63FF] ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
          <span className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-300">
            Audio Player
          </span>
          {currentTrack?.format && (
            <span className="text-[10px] font-mono bg-slate-800 text-[#00D4FF] px-2 py-0.5 rounded border border-slate-700">
              {currentTrack.format}
            </span>
          )}
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
          title="Import local MP3, WAV, FLAC, M4A, OGG files"
        >
          <Upload className="w-3.5 h-3.5 text-[#00D4FF]" />
          <span>Add Songs</span>
        </button>
      </div>

      {/* Track Info & Visualizer Split */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Track Artwork & Details */}
        <div className="md:col-span-5 flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-slate-700/80 shadow-md shrink-0 flex items-center justify-center relative">
            {currentTrack?.artworkUrl ? (
              <img
                src={currentTrack.artworkUrl}
                alt={currentTrack.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <Music className="w-8 h-8 text-[#6C63FF]/70" />
            )}
            {currentTrack?.isDemo && (
              <span className="absolute bottom-1 right-1 text-[9px] font-mono bg-[#6C63FF] text-white px-1 rounded">
                DEMO
              </span>
            )}
          </div>

          <div className="min-w-0 space-y-1">
            <h4 className="font-bold text-white text-base md:text-lg truncate">
              {currentTrack?.title || 'No Audio Selected'}
            </h4>
            <p className="text-xs text-slate-400 truncate">
              {currentTrack?.artist || 'Select track from Library or Add Songs'}
            </p>
            {currentTrack?.album && (
              <p className="text-[11px] text-slate-500 truncate">
                {currentTrack.album}
              </p>
            )}
          </div>
        </div>

        {/* Real-time Web Audio Visualizer */}
        <div className="md:col-span-7">
          <AudioVisualizer isPlaying={isPlaying} variant="bars" />
        </div>
      </div>

      {/* Scrubber Progress Bar */}
      <div className="space-y-1.5">
        <div className="relative flex items-center">
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={progressPercent || 0}
            onChange={handleSeekChange}
            className="w-full cursor-pointer accent-[#00D4FF]"
            aria-label="Seek track position"
          />
        </div>

        <div className="flex items-center justify-between text-xs font-mono tabular-nums text-slate-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Transport Controls */}
      <div className="flex items-center justify-center gap-4 sm:gap-6 pt-2">
        {/* Shuffle */}
        <button
          onClick={onToggleShuffle}
          className={`p-2.5 rounded-full transition-colors cursor-pointer ${
            isShuffle ? 'text-[#00D4FF] bg-[#00D4FF]/10' : 'text-slate-400 hover:text-white'
          }`}
          title={isShuffle ? 'Shuffle Enabled' : 'Shuffle Disabled'}
          aria-label="Toggle shuffle"
        >
          <Shuffle className="w-4 h-4" />
        </button>

        {/* Previous */}
        <button
          onClick={onSkipPrevious}
          className="p-2.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          title="Previous Track"
          aria-label="Previous track"
        >
          <SkipBack className="w-5 h-5" />
        </button>

        {/* Play / Pause Primary Button */}
        <button
          onClick={onTogglePlay}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-[#6C63FF] to-[#00D4FF] hover:opacity-95 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-[#6C63FF]/30 transition-all cursor-pointer"
          title={isPlaying ? 'Pause' : 'Play'}
          aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 fill-white" />
          ) : (
            <Play className="w-6 h-6 fill-white ml-0.5" />
          )}
        </button>

        {/* Next */}
        <button
          onClick={onSkipNext}
          className="p-2.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          title="Next Track"
          aria-label="Next track"
        >
          <SkipForward className="w-5 h-5" />
        </button>

        {/* Repeat Mode */}
        <button
          onClick={onCycleRepeat}
          className={`p-2.5 rounded-full transition-colors cursor-pointer ${
            repeatMode !== 'off' ? 'text-[#6C63FF] bg-[#6C63FF]/10' : 'text-slate-400 hover:text-white'
          }`}
          title={`Repeat: ${repeatMode.toUpperCase()}`}
          aria-label={`Cycle repeat mode, currently ${repeatMode}`}
        >
          {repeatMode === 'one' ? (
            <Repeat1 className="w-4 h-4" />
          ) : (
            <Repeat className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
};
