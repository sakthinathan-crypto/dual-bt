/**
 * Synchronization hook for DualSync BT
 */

import { useState, useCallback, useMemo } from 'react';
import { SyncConfig, SyncStatus } from '../types/synchronization';
import { BTDeviceInfo } from '../types/bluetooth';
import { synchronizationService } from '../services/synchronizationService';
import { audioEngine } from '../services/audioEngine';
import { calculateSoftwareDelays, clampLatency } from '../utils/latency';

export function useSynchronization(device1: BTDeviceInfo | null, device2: BTDeviceInfo | null) {
  const [config, setConfig] = useState<SyncConfig>(() => synchronizationService.getConfig());
  const [lastSyncTriggered, setLastSyncTriggered] = useState<number>(0);

  const syncStatus = useMemo(() => {
    return synchronizationService.evaluateSyncStatus(device1, device2);
  }, [device1, device2, config.isSyncEnabled, lastSyncTriggered]);

  const softwareDelays = useMemo(() => {
    return calculateSoftwareDelays(config.device1LatencyMs, config.device2LatencyMs);
  }, [config.device1LatencyMs, config.device2LatencyMs]);

  const setDevice1Latency = useCallback((latencyMs: number) => {
    const clamped = clampLatency(latencyMs);
    const updated = synchronizationService.updateConfig({ device1LatencyMs: clamped });
    setConfig(updated);
  }, []);

  const setDevice2Latency = useCallback((latencyMs: number) => {
    const clamped = clampLatency(latencyMs);
    const updated = synchronizationService.updateConfig({ device2LatencyMs: clamped });
    setConfig(updated);
  }, []);

  const resetLatencies = useCallback(() => {
    const updated = synchronizationService.updateConfig({ device1LatencyMs: 0, device2LatencyMs: 0 });
    setConfig(updated);
  }, []);

  const toggleSync = useCallback(() => {
    const updated = synchronizationService.updateConfig({ isSyncEnabled: !config.isSyncEnabled });
    setConfig(updated);
  }, [config.isSyncEnabled]);

  const syncNow = useCallback(() => {
    synchronizationService.syncNow();
    setLastSyncTriggered(Date.now());
  }, []);

  const playCalibrationSound = useCallback(() => {
    audioEngine.playCalibrationPulse(config.device1LatencyMs, config.device2LatencyMs);
  }, [config.device1LatencyMs, config.device2LatencyMs]);

  const saveConfiguration = useCallback(() => {
    if (device1) {
      synchronizationService.saveDeviceProfile(device1, config.device1LatencyMs);
    }
    if (device2) {
      synchronizationService.saveDeviceProfile(device2, config.device2LatencyMs);
    }
    synchronizationService.updateConfig({ lastCalibratedAt: Date.now() });
  }, [device1, device2, config.device1LatencyMs, config.device2LatencyMs]);

  return {
    config,
    syncStatus,
    softwareDelays,
    setDevice1Latency,
    setDevice2Latency,
    resetLatencies,
    toggleSync,
    syncNow,
    playCalibrationSound,
    saveConfiguration,
  };
}
