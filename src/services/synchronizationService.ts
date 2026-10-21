/**
 * Synchronization and Calibration Management Service for DualSync BT.
 * Handles delay alignment, sync status transitions, and device profile persistence.
 */

import { SyncConfig, SyncStatus, DeviceSyncProfile } from '../types/synchronization';
import { BTDeviceInfo } from '../types/bluetooth';
import { audioEngine } from './audioEngine';
import { capabilityService } from './capabilityService';

const STORAGE_KEY_SYNC_CONFIG = 'dualsync_sync_config_v1';
const STORAGE_KEY_DEVICE_PROFILES = 'dualsync_device_profiles_v1';

class SynchronizationService {
  private config: SyncConfig = {
    isSyncEnabled: true,
    device1LatencyMs: 0,
    device2LatencyMs: 0,
    autoSync: true,
  };

  private deviceProfiles: Record<string, DeviceSyncProfile> = {};

  constructor() {
    this.loadFromStorage();
  }

  public getConfig(): SyncConfig {
    return { ...this.config };
  }

  public updateConfig(partial: Partial<SyncConfig>): SyncConfig {
    this.config = { ...this.config, ...partial };
    
    // Apply new delays to Web Audio DSP engine
    audioEngine.setLatencies(this.config.device1LatencyMs, this.config.device2LatencyMs);

    this.saveToStorage();
    return this.getConfig();
  }

  /**
   * Evaluates honest synchronization status based on active devices and browser capabilities
   */
  public evaluateSyncStatus(device1: BTDeviceInfo | null, device2: BTDeviceInfo | null): {
    status: SyncStatus;
    reason: string;
  } {
    const caps = capabilityService.detectCapabilities();

    if (!device1 && !device2) {
      return {
        status: 'Not Configured',
        reason: 'No devices selected. Select Device 1 and Device 2 to begin synchronization.',
      };
    }

    if (!this.config.isSyncEnabled) {
      return {
        status: 'Not Configured',
        reason: 'Synchronization is currently toggled OFF.',
      };
    }

    // In a pure web sandbox without OS dual audio aggregation, two physical A2DP streams cannot be created.
    if (!caps.canRouteDualBluetoothAudio) {
      if (device1 && device2) {
        return {
          status: 'Limited by Browser',
          reason: 'Both devices assigned in software. WebAudio delay compensation is active, but physical dual Bluetooth audio routing requires OS-level audio aggregation (e.g., Samsung Dual Audio or macOS Aggregate Device).',
        };
      }
      return {
        status: 'Ready',
        reason: 'Software audio pipeline ready with delay compensation.',
      };
    }

    return {
      status: 'Active',
      reason: 'Dual independent audio stream synchronization active.',
    };
  }

  /**
   * Sync Now command: realigns audio elements and reschedules Web Audio nodes
   */
  public syncNow(): void {
    audioEngine.setLatencies(this.config.device1LatencyMs, this.config.device2LatencyMs);
  }

  /**
   * Saves a device profile with calibrated latency
   */
  public saveDeviceProfile(device: BTDeviceInfo, latencyMs: number): void {
    if (!device || !device.id) return;
    this.deviceProfiles[device.id] = {
      deviceId: device.id,
      deviceName: device.name,
      preferredLatencyMs: latencyMs,
      savedAt: Date.now(),
    };
    try {
      localStorage.setItem(STORAGE_KEY_DEVICE_PROFILES, JSON.stringify(this.deviceProfiles));
    } catch {
      // ignore
    }
  }

  public getDeviceProfile(deviceId: string): DeviceSyncProfile | undefined {
    return this.deviceProfiles[deviceId];
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY_SYNC_CONFIG, JSON.stringify(this.config));
    } catch {
      // ignore
    }
  }

  private loadFromStorage(): void {
    try {
      const savedConfig = localStorage.getItem(STORAGE_KEY_SYNC_CONFIG);
      if (savedConfig) {
        this.config = { ...this.config, ...JSON.parse(savedConfig) };
      }
      const savedProfiles = localStorage.getItem(STORAGE_KEY_DEVICE_PROFILES);
      if (savedProfiles) {
        this.deviceProfiles = JSON.parse(savedProfiles);
      }
    } catch {
      // ignore
    }
  }
}

export const synchronizationService = new SynchronizationService();
