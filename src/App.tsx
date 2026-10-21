/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { Header, NavTab } from './components/Header';
import { BottomPlayerBar } from './components/BottomPlayerBar';
import { DeviceSelectorModal } from './components/DeviceSelectorModal';
import { ManualCalibrationModal } from './components/ManualCalibrationModal';
import { DiagnosticTestModal } from './components/DiagnosticTestModal';

// Pages
import { Home } from './pages/Home';
import { MusicLibrary } from './pages/MusicLibrary';
import { Devices } from './pages/Devices';
import { Synchronization } from './pages/Synchronization';
import { Settings } from './pages/Settings';

// Custom Hooks
import { useBluetoothDevice } from './hooks/useBluetoothDevice';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useSynchronization } from './hooks/useSynchronization';
import { mediaLibraryService } from './services/mediaLibraryService';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modals
  const [selectorModalSlot, setSelectorModalSlot] = useState<'device1' | 'device2' | null>(null);
  const [isCalibrationOpen, setIsCalibrationOpen] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);

  // Bluetooth Hook
  const {
    device1,
    device2,
    isScanning,
    errorMessage: btErrorMessage,
    scanAndAssignDevice,
    connectDeviceGATT,
    disconnectDeviceGATT,
    removeDevice,
  } = useBluetoothDevice();

  // Audio Player Hook
  const {
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
  } = useAudioPlayer();

  // Synchronization Hook
  const {
    config: syncConfig,
    syncStatus,
    softwareDelays,
    setDevice1Latency,
    setDevice2Latency,
    resetLatencies,
    toggleSync,
    syncNow,
    playCalibrationSound,
    saveConfiguration,
  } = useSynchronization(device1, device2);

  // Handle local file uploads
  const handleAddFiles = useCallback(async (files: FileList) => {
    await mediaLibraryService.addLocalFiles(files);
    refreshTracks();
  }, [refreshTracks]);

  // Handle full data reset
  const handleResetAllSettings = useCallback(() => {
    localStorage.clear();
    removeDevice('device1');
    removeDevice('device2');
    resetLatencies();
    setMasterVolume(0.8);
    setDevice1Volume(0.8);
    setDevice2Volume(0.8);
    window.location.reload();
  }, [removeDevice, resetLatencies, setMasterVolume, setDevice1Volume, setDevice2Volume]);

  return (
    <div className="min-h-screen bg-[#0B1020] text-slate-100 flex flex-col font-sans selection:bg-[#6C63FF]/30 selection:text-white">
      {/* Top Navigation Bar */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isPlaying={isPlaying}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24">
        {activeTab === 'home' && (
          <Home
            device1={device1}
            device2={device2}
            onOpenSelector={(slot) => setSelectorModalSlot(slot)}
            onConnectGATT={connectDeviceGATT}
            onDisconnectGATT={disconnectDeviceGATT}
            onRemoveDevice={removeDevice}
            isScanning={isScanning}
            masterVolume={masterVolume}
            device1Volume={device1Volume}
            device2Volume={device2Volume}
            onMasterVolumeChange={setMasterVolume}
            onDevice1VolumeChange={setDevice1Volume}
            onDevice2VolumeChange={setDevice2Volume}
            device1LatencyMs={syncConfig.device1LatencyMs}
            device2LatencyMs={syncConfig.device2LatencyMs}
            onDevice1LatencyChange={setDevice1Latency}
            onDevice2LatencyChange={setDevice2Latency}
            onResetDevice1Latency={() => setDevice1Latency(0)}
            onResetDevice2Latency={() => setDevice2Latency(0)}
            d1DelaySec={softwareDelays.d1DelaySeconds}
            d2DelaySec={softwareDelays.d2DelaySeconds}
            isSyncEnabled={syncConfig.isSyncEnabled}
            onToggleSync={toggleSync}
            syncStatus={syncStatus}
            onSyncNow={syncNow}
            onOpenCalibration={() => setIsCalibrationOpen(true)}
            onTestAudioPulse={playCalibrationSound}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            onTogglePlay={togglePlay}
            onSeek={seek}
            onSkipNext={skipNext}
            onSkipPrevious={skipPrevious}
            repeatMode={repeatMode}
            onCycleRepeat={cycleRepeatMode}
            isShuffle={isShuffle}
            onToggleShuffle={toggleShuffle}
            onAddFiles={handleAddFiles}
          />
        )}

        {activeTab === 'library' && (
          <MusicLibrary
            tracks={tracks}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onPlayTrack={playTrack}
            onTogglePlay={togglePlay}
            onAddFiles={handleAddFiles}
            onRefreshTracks={refreshTracks}
          />
        )}

        {activeTab === 'devices' && (
          <Devices
            device1={device1}
            device2={device2}
            onOpenSelector={(slot) => setSelectorModalSlot(slot)}
            onConnectGATT={connectDeviceGATT}
            onDisconnectGATT={disconnectDeviceGATT}
            onRemoveDevice={removeDevice}
            isScanning={isScanning}
          />
        )}

        {activeTab === 'sync' && (
          <Synchronization
            device1={device1}
            device2={device2}
            device1LatencyMs={syncConfig.device1LatencyMs}
            device2LatencyMs={syncConfig.device2LatencyMs}
            onDevice1LatencyChange={setDevice1Latency}
            onDevice2LatencyChange={setDevice2Latency}
            onResetDevice1Latency={() => setDevice1Latency(0)}
            onResetDevice2Latency={() => setDevice2Latency(0)}
            onResetAllLatencies={resetLatencies}
            onOpenCalibration={() => setIsCalibrationOpen(true)}
            onTestAudioPulse={playCalibrationSound}
            onSaveConfiguration={saveConfiguration}
            syncStatus={syncStatus}
            isSyncEnabled={syncConfig.isSyncEnabled}
            onToggleSync={toggleSync}
          />
        )}

        {activeTab === 'settings' && (
          <Settings
            onResetAllSettings={handleResetAllSettings}
            onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
          />
        )}
      </main>

      {/* Persistent Sticky Bottom Player */}
      <BottomPlayerBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        onSkipNext={skipNext}
        onSkipPrevious={skipPrevious}
        currentTime={currentTime}
        duration={duration}
        onSeek={seek}
        masterVolume={masterVolume}
        onMasterVolumeChange={setMasterVolume}
        isMuted={isMuted}
        onToggleMute={toggleMute}
      />

      {/* Device Selection Modal */}
      <DeviceSelectorModal
        isOpen={selectorModalSlot !== null}
        onClose={() => setSelectorModalSlot(null)}
        slot={selectorModalSlot || 'device1'}
        onScan={scanAndAssignDevice}
        isScanning={isScanning !== null}
        errorMessage={btErrorMessage}
      />

      {/* Manual Calibration Modal */}
      <ManualCalibrationModal
        isOpen={isCalibrationOpen}
        onClose={() => setIsCalibrationOpen(false)}
        device1={device1}
        device2={device2}
        d1LatencyMs={syncConfig.device1LatencyMs}
        d2LatencyMs={syncConfig.device2LatencyMs}
        onUpdateD1Latency={setDevice1Latency}
        onUpdateD2Latency={setDevice2Latency}
        onSaveProfile={saveConfiguration}
      />

      {/* Diagnostic & Verification Test Modal */}
      <DiagnosticTestModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
      />
    </div>
  );
}
