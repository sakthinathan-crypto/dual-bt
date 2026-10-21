/**
 * Synchronization and Calibration Types for DualSync BT
 */

export type SyncStatus = 
  | 'Not Configured'
  | 'Ready'
  | 'Active'
  | 'Limited by Browser'
  | 'Unsupported Audio Routing';

export interface SyncConfig {
  isSyncEnabled: boolean;
  device1LatencyMs: number; // -500 to +500
  device2LatencyMs: number; // -500 to +500
  lastCalibratedAt?: number;
  autoSync: boolean;
}

export interface CalibrationAnswer {
  step: number;
  selectedOption: 'device1' | 'device2' | 'synchronized' | 'cannot_hear';
  appliedOffsetMs: number;
}

export interface DeviceSyncProfile {
  deviceId: string;
  deviceName: string;
  preferredLatencyMs: number;
  savedAt: number;
}
