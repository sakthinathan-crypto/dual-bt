/**
 * Custom hook for managing dual Bluetooth devices in DualSync BT.
 * Stores Device 1 and Device 2 references completely independently.
 * Selecting Device 2 does not overwrite or disconnect Device 1.
 */

import { useState, useCallback, useEffect } from 'react';
import { BTDeviceInfo } from '../types/bluetooth';
import { bluetoothService } from '../services/bluetoothService';
import { synchronizationService } from '../services/synchronizationService';
import { safeStorage } from '../utils/storage';

const STORAGE_KEY_BT_D1 = 'dualsync_device1_saved_v1';
const STORAGE_KEY_BT_D2 = 'dualsync_device2_saved_v1';

export function useBluetoothDevice() {
  const [device1, setDevice1] = useState<BTDeviceInfo | null>(null);
  const [device2, setDevice2] = useState<BTDeviceInfo | null>(null);
  const [isScanning, setIsScanning] = useState<'device1' | 'device2' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Restore saved device metadata on mount (without pretending active GATT persists across reloads)
  useEffect(() => {
    try {
      const d1Json = safeStorage.getItem(STORAGE_KEY_BT_D1);
      if (d1Json) {
        const d1 = JSON.parse(d1Json);
        setDevice1({ ...d1, gattConnected: false, status: 'disconnected', batteryLevel: null });
      }
      const d2Json = safeStorage.getItem(STORAGE_KEY_BT_D2);
      if (d2Json) {
        const d2 = JSON.parse(d2Json);
        setDevice2({ ...d2, gattConnected: false, status: 'disconnected', batteryLevel: null });
      }
    } catch {
      // ignore
    }
  }, []);

  // Listen for GATT disconnection events on specific device ID
  const handleDeviceDisconnected = useCallback((deviceId: string) => {
    setDevice1((prev) => (prev?.id === deviceId ? { ...prev, gattConnected: false, status: 'disconnected', batteryLevel: null } : prev));
    setDevice2((prev) => (prev?.id === deviceId ? { ...prev, gattConnected: false, status: 'disconnected', batteryLevel: null } : prev));
  }, []);

  /**
   * Request Bluetooth device for a slot ('device1' or 'device2').
   * Selecting Device 2 preserves Device 1 and its connection state.
   */
  const scanAndAssignDevice = useCallback(
    async (slot: 'device1' | 'device2'): Promise<{ success: boolean; message?: string }> => {
      setErrorMessage(null);
      setIsScanning(slot);

      try {
        const discovered = await bluetoothService.requestBluetoothDevice(handleDeviceDisconnected);

        // Check for duplicate device assignment by unique device ID
        const otherDevice = slot === 'device1' ? device2 : device1;
        if (otherDevice && otherDevice.id === discovered.id) {
          const duplicateMsg = slot === 'device2'
            ? 'This device is already assigned to Device 1.'
            : 'This device is already assigned to Device 2.';
          setErrorMessage(duplicateMsg);
          setIsScanning(null);
          return { success: false, message: duplicateMsg };
        }

        // Check if there is a saved profile for latency
        const savedProfile = synchronizationService.getDeviceProfile(discovered.id);
        if (savedProfile) {
          if (slot === 'device1') {
            synchronizationService.updateConfig({ device1LatencyMs: savedProfile.preferredLatencyMs });
          } else {
            synchronizationService.updateConfig({ device2LatencyMs: savedProfile.preferredLatencyMs });
          }
        }

        if (slot === 'device1') {
          setDevice1(discovered);
          safeStorage.setItem(STORAGE_KEY_BT_D1, JSON.stringify({ id: discovered.id, name: discovered.name, isAudioOutputSupported: false }));
        } else {
          setDevice2(discovered);
          safeStorage.setItem(STORAGE_KEY_BT_D2, JSON.stringify({ id: discovered.id, name: discovered.name, isAudioOutputSupported: false }));
        }

        setIsScanning(null);
        return { success: true };
      } catch (err: any) {
        setIsScanning(null);
        setErrorMessage(err.message || 'Scan error occurred.');
        return { success: false, message: err.message };
      }
    },
    [device1, device2, handleDeviceDisconnected]
  );

  const connectDeviceGATT = useCallback(async (slot: 'device1' | 'device2') => {
    const target = slot === 'device1' ? device1 : device2;
    if (!target) return;

    if (!target.rawDevice) {
      const err = 'Device reference expired after page reload. Please click "Change Device" to re-authorize the browser connection.';
      const updated = { ...target, status: 'error' as const, errorMessage: err };
      if (slot === 'device1') setDevice1(updated);
      else setDevice2(updated);
      return;
    }

    const updated = await bluetoothService.connectGATT(target);
    if (slot === 'device1') setDevice1(updated);
    else setDevice2(updated);
  }, [device1, device2]);

  const disconnectDeviceGATT = useCallback((slot: 'device1' | 'device2') => {
    const target = slot === 'device1' ? device1 : device2;
    if (!target) return;

    const updated = bluetoothService.disconnectGATT(target);
    if (slot === 'device1') setDevice1(updated);
    else setDevice2(updated);
  }, [device1, device2]);

  const removeDevice = useCallback((slot: 'device1' | 'device2') => {
    if (slot === 'device1') {
      if (device1) bluetoothService.disconnectGATT(device1);
      setDevice1(null);
      safeStorage.removeItem(STORAGE_KEY_BT_D1);
    } else {
      if (device2) bluetoothService.disconnectGATT(device2);
      setDevice2(null);
      safeStorage.removeItem(STORAGE_KEY_BT_D2);
    }
  }, [device1, device2]);

  return {
    device1,
    device2,
    isScanning,
    errorMessage,
    setErrorMessage,
    scanAndAssignDevice,
    connectDeviceGATT,
    disconnectDeviceGATT,
    removeDevice,
  };
}
