/**
 * Music Library Page for DualSync BT.
 * Supports adding local MP3/WAV/FLAC/M4A/OGG files, search filter,
 * recently played tracking, and track deletion.
 */

import React, { useState, useRef } from 'react';
import { Music, Upload, Search, Play, Pause, Trash2, Clock, Disc, Sparkles } from 'lucide-react';
import { AudioTrack } from '../types/audio';
import { mediaLibraryService } from '../services/mediaLibraryService';

interface MusicLibraryProps {
  tracks: AudioTrack[];
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  onPlayTrack: (track: AudioTrack) => void;
  onTogglePlay: () => void;
  onAddFiles: (files: FileList) => void;
  onRefreshTracks: () => void;
}

export const MusicLibrary: React.FC<MusicLibraryProps> = ({
  tracks,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onTogglePlay,
  onAddFiles,
  onRefreshTracks,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const recentlyPlayed = mediaLibraryService.getRecentlyPlayedTracks();

  const filteredTracks = tracks.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.album.toLowerCase().includes(q) ||
      t.format.toLowerCase().includes(q)
    );
  });

  const formatDuration = (seconds: number) => {
    if (isNaN(seconds) || seconds <= 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddFiles(e.target.files);
    }
  };

  const handleRemove = (trackId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    mediaLibraryService.removeTrack(trackId);
    onRefreshTracks();
  };

  return (
    <div className="space-y-7 pb-20">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/*,.mp3,.wav,.flac,.m4a,.aac,.ogg"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Music Library</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Local browser playback with zero server uploads. Supports MP3, WAV, FLAC, M4A, and OGG.
          </p>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2.5 bg-gradient-to-r from-[#6C63FF] to-[#00D4FF] hover:opacity-95 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-md shadow-[#6C63FF]/20 transition-all cursor-pointer inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <Upload className="w-4 h-4" />
          <span>Add Songs</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by title, artist, album, or format..."
          className="w-full bg-[#141B2D] border border-slate-800 focus:border-[#6C63FF] focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 transition-colors"
        />
      </div>

      {/* Recently Played Strip if available */}
      {recentlyPlayed.length > 0 && !searchQuery && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Clock className="w-3.5 h-3.5 text-[#00D4FF]" />
            <span>Recently Played</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {recentlyPlayed.slice(0, 4).map((t) => {
              const isCurrent = currentTrack?.id === t.id;
              return (
                <div
                  key={`recent-${t.id}`}
                  onClick={() => onPlayTrack(t)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer group flex items-center gap-3 ${
                    isCurrent
                      ? 'bg-[#6C63FF]/15 border-[#6C63FF]/50 text-white'
                      : 'bg-[#141B2D] border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-800 shrink-0 flex items-center justify-center relative">
                    {t.artworkUrl ? (
                      <img src={t.artworkUrl} alt={t.title} className="w-full h-full object-cover" />
                    ) : (
                      <Disc className="w-5 h-5 text-slate-400 group-hover:text-[#6C63FF]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate">{t.title}</p>
                    <p className="text-[11px] text-slate-400 truncate">{t.artist}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Track Table */}
      <div className="bg-[#141B2D] border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>All Tracks ({filteredTracks.length})</span>
          <span className="hidden sm:inline">Format / Duration</span>
        </div>

        {filteredTracks.length === 0 ? (
          <div className="py-14 text-center space-y-3">
            <Music className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-sm text-slate-300 font-medium">No tracks found</p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Add audio files from your device or try a different search filter.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredTracks.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <div
                  key={track.id}
                  onClick={() => {
                    if (isCurrent) onTogglePlay();
                    else onPlayTrack(track);
                  }}
                  className={`px-5 py-3.5 flex items-center justify-between gap-4 transition-colors cursor-pointer group ${
                    isCurrent
                      ? 'bg-[#6C63FF]/10 text-white'
                      : 'hover:bg-slate-800/50 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Index or Play indicator */}
                    <div className="w-6 text-center text-xs text-slate-400 group-hover:hidden font-mono tabular-nums">
                      {idx + 1}
                    </div>
                    <div className="w-6 text-center hidden group-hover:block">
                      {isCurrent && isPlaying ? (
                        <Pause className="w-4 h-4 text-[#00D4FF] inline" />
                      ) : (
                        <Play className="w-4 h-4 text-[#6C63FF] inline" />
                      )}
                    </div>

                    {/* Artwork / Icon */}
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-800 shrink-0 flex items-center justify-center">
                      {track.artworkUrl ? (
                        <img src={track.artworkUrl} alt={track.title} className="w-full h-full object-cover" />
                      ) : (
                        <Music className="w-5 h-5 text-slate-400" />
                      )}
                    </div>

                    {/* Title & Metadata */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold truncate ${isCurrent ? 'text-[#00D4FF]' : 'text-white'}`}>
                          {track.title}
                        </span>
                        {track.isDemo && (
                          <span className="text-[9px] font-mono bg-[#6C63FF]/30 text-[#00D4FF] px-1.5 py-0.2 rounded border border-[#6C63FF]/40">
                            DEMO
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        {track.artist} {track.album ? `· ${track.album}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Format, Duration & Actions */}
                  <div className="flex items-center gap-4 text-xs shrink-0">
                    <span className="text-[11px] font-mono text-slate-400 bg-[#080D1B] px-2 py-0.5 rounded border border-slate-800">
                      {track.format}
                    </span>
                    <span className="font-mono tabular-nums text-slate-400 w-12 text-right">
                      {formatDuration(track.duration)}
                    </span>
                    {!track.isDemo && (
                      <button
                        onClick={(e) => handleRemove(track.id, e)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                        title="Remove track"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
