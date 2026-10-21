/**
 * Persistent Mini Player Bar for DualSync BT.
 * Provides accessible audio control at the bottom of the viewport.
 */

import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Disc } from 'lucide-react';
import { AudioTrack } from '../types/audio';
import { formatVolumePercent } from '../utils/volume';

interface BottomPlayerBarProps {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSkipNext: () => void;
  onSkipPrevious: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  masterVolume: number;
  onMasterVolumeChange: (vol: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const BottomPlayerBar: React.FC<BottomPlayerBarProps> = ({
  currentTrack,
  isPlaying,
  onTogglePlay,
  onSkipNext,
  onSkipPrevious,
  currentTime,
  duration,
  onSeek,
  masterVolume,
  onMasterVolumeChange,
  isMuted,
  onToggleMute,
}) => {
  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#080D1B]/95 backdrop-blur-md border-t border-slate-800 px-4 py-2.5 shadow-2xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Track snippet */}
        <div className="flex items-center gap-3 min-w-0 w-44 sm:w-64">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-800 shrink-0 flex items-center justify-center">
            {currentTrack.artworkUrl ? (
              <img src={currentTrack.artworkUrl} alt={currentTrack.title} className="w-full h-full object-cover" />
            ) : (
              <Disc className={`w-5 h-5 text-[#6C63FF] ${isPlaying ? 'animate-spin' : ''}`} />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{currentTrack.title}</p>
            <p className="text-[11px] text-slate-400 truncate">{currentTrack.artist}</p>
          </div>
        </div>

        {/* Center Transport & Progress */}
        <div className="flex-1 max-w-lg hidden sm:flex flex-col items-center gap-1">
          <div className="flex items-center gap-3">
            <button
              onClick={onSkipPrevious}
              className="text-slate-400 hover:text-white p-1"
              aria-label="Previous track"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={onTogglePlay}
              className="w-8 h-8 rounded-full bg-[#6C63FF] hover:bg-[#5b52e0] text-white flex items-center justify-center shadow"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
            </button>
            <button
              onClick={onSkipNext}
              className="text-slate-400 hover:text-white p-1"
              aria-label="Next track"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <div className="w-full flex items-center gap-2 text-[10px] font-mono text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={progressPercent}
              onChange={(e) => onSeek((Number(e.target.value) / 100) * duration)}
              className="w-full accent-[#00D4FF] h-1"
              aria-label="Scrub bottom player"
            />
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Mobile quick play */}
        <div className="sm:hidden flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            className="w-9 h-9 rounded-full bg-[#6C63FF] text-white flex items-center justify-center shadow"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
          </button>
        </div>

        {/* Right Volume */}
        <div className="hidden md:flex items-center gap-2 w-44 justify-end">
          <button onClick={onToggleMute} className="text-slate-400 hover:text-white p-1">
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(masterVolume * 100)}
            onChange={(e) => onMasterVolumeChange(Number(e.target.value) / 100)}
            className="w-20 accent-[#6C63FF] h-1"
            aria-label="Master volume"
          />
          <span className="font-mono tabular-nums text-[10px] text-slate-400 w-7 text-right">
            {formatVolumePercent(masterVolume)}
          </span>
        </div>
      </div>
    </div>
  );
};
