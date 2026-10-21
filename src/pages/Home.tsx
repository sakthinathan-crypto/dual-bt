/**
 * Home Dashboard for DualSync BT.
 * Layout:
 * Header: DualSync BT "Two Devices. One Audio Experience."
 * Bluetooth status indicator & audio playback indicator
 * Two large Device Cards (Device 1 & Device 2)
 * Central Audio Player
 * Synchronization controls
 */

import React from 'react';
import { Bluetooth, Activity, Disc, Sparkles } from 'lucide-react';
import { DeviceCard } from '../components/DeviceCard';
import { AudioPlayer } from '../components/AudioPlayer';
import { SyncControls } from '../components/SyncControls';
import { BTDeviceInfo } from '../types/bluetooth';
import { AudioTrack, RepeatMode } from '../types/audio';
import { SyncStatus } from '../types/synchronization';

interface HomeProps {
  device1: BTDeviceInfo | null;
  device2: BTDeviceInfo | null;
  onOpenSelector: (slot: 'device1' | 'device2') => void;
  onConnectGATT: (slot: 'device1' | 'device2') => void;
  onDisconnectGATT: (slot: 'device1' | 'device2') => void;
  onRemoveDevice: (slot: 'device1' | 'device2') => void;
  isScanning: 'device1' | 'device2' | null;
  // Volume states
  masterVolume: number;
  device1Volume: number;
  device2Volume: number;
  onMasterVolumeChange: (vol: number) => void;
  onDevice1VolumeChange: (vol: number) => void;
  onDevice2VolumeChange: (vol: number) => void;
  // Latency states
  device1LatencyMs: number;
  device2LatencyMs: number;
  onDevice1LatencyChange: (ms: number) => void;
  onDevice2LatencyChange: (ms: number) => void;
  onResetDevice1Latency: () => void;
  onResetDevice2Latency: () => void;
  d1DelaySec: number;
  d2DelaySec: number;
  // Sync
  isSyncEnabled: boolean;
  onToggleSync: () => void;
  syncStatus: { status: SyncStatus; reason: string };
  onSyncNow: () => void;
  onOpenCalibration: () => void;
  onTestAudioPulse: () => void;
  // Audio Player
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

export const Home: React.FC<HomeProps> = ({
  device1,
  device2,
  onOpenSelector,
  onConnectGATT,
  onDisconnectGATT,
  onRemoveDevice,
  isScanning,
  masterVolume,
  device1Volume,
  device2Volume,
  onMasterVolumeChange,
  onDevice1VolumeChange,
  onDevice2VolumeChange,
  device1LatencyMs,
  device2LatencyMs,
  onDevice1LatencyChange,
  onDevice2LatencyChange,
  onResetDevice1Latency,
  onResetDevice2Latency,
  d1DelaySec,
  d2DelaySec,
  isSyncEnabled,
  onToggleSync,
  syncStatus,
  onSyncNow,
  onOpenCalibration,
  onTestAudioPulse,
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
  const btStatusText = (device1?.gattConnected || device2?.gattConnected)
    ? 'Bluetooth GATT Active'
    : (device1 || device2)
    ? 'Devices Selected'
    : 'No Bluetooth Active';

  return (
    <div className="space-y-8 pb-20">
      {/* Brand Hero & Live Indicators */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            DualSync BT
          </h1>
          <p className="text-sm text-slate-300 mt-1 font-medium">
            &quot;Two Devices. One Audio Experience.&quot;
          </p>
        </div>

        {/* Real-time Status Indicators */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#141B2D] border border-slate-800 rounded-lg">
            <Bluetooth className={`w-3.5 h-3.5 ${device1?.gattConnected || device2?.gattConnected ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span className="text-slate-300 font-medium">{btStatusText}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#141B2D] border border-slate-800 rounded-lg">
            <Activity className={`w-3.5 h-3.5 ${isPlaying ? 'text-[#00D4FF] animate-pulse' : 'text-slate-400'}`} />
            <span className="text-slate-300 font-medium">
              {isPlaying ? 'Audio Output Active' : 'Audio Idle'}
            </span>
          </div>
        </div>
      </div>

      {/* Two Large Device Cards Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DeviceCard
          slot="device1"
          slotTitle="Device 1"
          device={device1}
          onOpenSelector={() => onOpenSelector('device1')}
          onConnectGATT={() => onConnectGATT('device1')}
          onDisconnectGATT={() => onDisconnectGATT('device1')}
          onRemoveDevice={() => onRemoveDevice('device1')}
          volume={device1Volume}
          onVolumeChange={onDevice1VolumeChange}
          latencyMs={device1LatencyMs}
          onLatencyChange={onDevice1LatencyChange}
          onResetLatency={onResetDevice1Latency}
          estimatedSoftwareDelaySec={d1DelaySec}
          isScanning={isScanning === 'device1'}
        />

        <DeviceCard
          slot="device2"
          slotTitle="Device 2"
          device={device2}
          onOpenSelector={() => onOpenSelector('device2')}
          onConnectGATT={() => onConnectGATT('device2')}
          onDisconnectGATT={() => onDisconnectGATT('device2')}
          onRemoveDevice={() => onRemoveDevice('device2')}
          volume={device2Volume}
          onVolumeChange={onDevice2VolumeChange}
          latencyMs={device2LatencyMs}
          onLatencyChange={onDevice2LatencyChange}
          onResetLatency={onResetDevice2Latency}
          estimatedSoftwareDelaySec={d2DelaySec}
          isScanning={isScanning === 'device2'}
        />
      </div>

      {/* Central Audio Player */}
      <AudioPlayer
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        onTogglePlay={onTogglePlay}
        onSeek={onSeek}
        onSkipNext={onSkipNext}
        onSkipPrevious={onSkipPrevious}
        repeatMode={repeatMode}
        onCycleRepeat={onCycleRepeat}
        isShuffle={isShuffle}
        onToggleShuffle={onToggleShuffle}
        onAddFiles={onAddFiles}
      />

      {/* Synchronization Engine Controls */}
      <SyncControls
        masterVolume={masterVolume}
        onMasterVolumeChange={onMasterVolumeChange}
        isSyncEnabled={isSyncEnabled}
        onToggleSync={onToggleSync}
        syncStatus={syncStatus}
        onSyncNow={onSyncNow}
        onOpenCalibration={onOpenCalibration}
        device1LatencyMs={device1LatencyMs}
        device2LatencyMs={device2LatencyMs}
        onTestAudioPulse={onTestAudioPulse}
      />
    </div>
  );
};
