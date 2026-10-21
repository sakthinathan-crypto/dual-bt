/**
 * Master Synchronization Controls Dashboard Widget for DualSync BT.
 * Provides Sync ON/OFF toggle, Sync Now, Status Badges, and calibration launcher.
 */

import React from 'react';
import { Sliders, RefreshCw, Volume2, Wand2, ShieldAlert, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { SyncStatus } from '../types/synchronization';
import { VolumeSlider } from './VolumeSlider';
import { formatLatency } from '../utils/latency';

interface SyncControlsProps {
  masterVolume: number;
  onMasterVolumeChange: (vol: number) => void;
  isSyncEnabled: boolean;
  onToggleSync: () => void;
  syncStatus: { status: SyncStatus; reason: string };
  onSyncNow: () => void;
  onOpenCalibration: () => void;
  device1LatencyMs: number;
  device2LatencyMs: number;
  onTestAudioPulse: () => void;
}

export const SyncControls: React.FC<SyncControlsProps> = ({
  masterVolume,
  onMasterVolumeChange,
  isSyncEnabled,
  onToggleSync,
  syncStatus,
  onSyncNow,
  onOpenCalibration,
  device1LatencyMs,
  device2LatencyMs,
  onTestAudioPulse,
}) => {
  const getStatusBadge = (status: SyncStatus) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/25">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Active
          </span>
        );
      case 'Ready':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00D4FF] bg-[#00D4FF]/10 px-2.5 py-1 rounded-md border border-[#00D4FF]/25">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Ready
          </span>
        );
      case 'Limited by Browser':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/25">
            <AlertTriangle className="w-3.5 h-3.5" />
            Limited by Browser
          </span>
        );
      case 'Unsupported Audio Routing':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-300 bg-red-500/10 px-2.5 py-1 rounded-md border border-red-500/25">
            <ShieldAlert className="w-3.5 h-3.5" />
            Unsupported Routing
          </span>
        );
      case 'Not Configured':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
            Not Configured
          </span>
        );
    }
  };

  return (
    <div className="bg-[#141B2D] border border-slate-800 rounded-xl p-5 shadow-lg space-y-5">
      {/* Header & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#6C63FF]" />
            <h3 className="font-semibold text-white text-base">Synchronization Engine</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Web Audio delay buffer coordination between Device 1 & Device 2.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sync Switch */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 font-medium">Sync:</span>
            <button
              onClick={onToggleSync}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                isSyncEnabled ? 'bg-[#6C63FF]' : 'bg-slate-700'
              }`}
              role="switch"
              aria-checked={isSyncEnabled}
              aria-label="Toggle synchronization"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isSyncEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {getStatusBadge(syncStatus.status)}
        </div>
      </div>

      {/* Sync Status Context */}
      <p className="text-xs text-slate-400 leading-relaxed bg-[#080D1B] p-3 rounded-lg border border-slate-800/80">
        <strong className="text-slate-300">Sync Status: </strong>
        {syncStatus.reason}
      </p>

      {/* Master Volume & Offset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Master Volume */}
        <div className="md:col-span-6 bg-[#080D1B]/50 p-3.5 rounded-lg border border-slate-800">
          <VolumeSlider
            label="Master Volume"
            volume={masterVolume}
            onChange={onMasterVolumeChange}
            subtitle="Overall digital gain applied across all audio outputs."
          />
        </div>

        {/* Current Active Offsets */}
        <div className="md:col-span-6 grid grid-cols-2 gap-3">
          <div className="p-3 bg-[#080D1B]/50 rounded-lg border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block">Device 1 Offset</span>
            <span className="text-base font-mono tabular-nums font-bold text-[#00D4FF]">
              {formatLatency(device1LatencyMs)}
            </span>
          </div>
          <div className="p-3 bg-[#080D1B]/50 rounded-lg border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block">Device 2 Offset</span>
            <span className="text-base font-mono tabular-nums font-bold text-[#6C63FF]">
              {formatLatency(device2LatencyMs)}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons: Sync Now, Calibrate Sync, Test Audio Tone */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          onClick={onSyncNow}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#00D4FF]" />
          <span>Sync Now</span>
        </button>

        <button
          onClick={onOpenCalibration}
          className="px-4 py-2 bg-gradient-to-r from-[#6C63FF] to-[#5b52e0] hover:opacity-95 active:scale-95 text-white text-xs font-semibold rounded-lg shadow-md shadow-[#6C63FF]/20 transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>Calibrate Latency</span>
        </button>

        <button
          onClick={onTestAudioPulse}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-all cursor-pointer inline-flex items-center gap-2"
          title="Play dual harmonic test pulse to hear offset"
        >
          <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Test Audio Pulse</span>
        </button>
      </div>
    </div>
  );
};
