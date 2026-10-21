/**
 * Web Bluetooth Management Service for DualSync BT.
 * Interacts with real browser Web Bluetooth API (BLE GATT).
 * Accurately reports GATT connectivity and battery level where supported,
 * while honestly informing users that BLE GATT cannot stream A2DP audio.
 */

import { BTDeviceInfo, BluetoothDevice } from '../types/bluetooth';

// Standard Bluetooth GATT Service UUIDs
const BATTERY_SERVICE_UUID = 0x180f;
const BATTERY_LEVEL_CHAR_UUID = 0x2a19;
const DEVICE_INFO_SERVICE_UUID = 0x180a;

class BluetoothService {
  /**
   * Checks whether the current browser supports Web Bluetooth
   */
  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator && !!(navigator as any).bluetooth;
  }

  /**
   * Launches the browser's native Bluetooth Device Chooser.
   * MUST be called in response to a direct user action (click/touch).
   */
  public async requestBluetoothDevice(
    onDisconnected?: (deviceId: string) => void
  ): Promise<BTDeviceInfo> {
    if (!this.isSupported()) {
      throw new Error(
        'Web Bluetooth API is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Chrome for Android over HTTPS/localhost.'
      );
    }

    try {
      const bluetooth = (navigator as any).bluetooth;

      // Web Bluetooth requires acceptAllDevices: true when not filtering by specific service
      const rawDevice: BluetoothDevice = await bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          BATTERY_SERVICE_UUID,
          DEVICE_INFO_SERVICE_UUID,
          'generic_access',
        ],
      });

      if (!rawDevice) {
        throw new Error('No device was selected from the chooser.');
      }

      // Attach disconnection listener
      if (onDisconnected) {
        const disconnectHandler = () => {
          onDisconnected(rawDevice.id);
        };
        rawDevice.addEventListener('gattserverdisconnected', disconnectHandler);
      }

      const deviceInfo: BTDeviceInfo = {
        id: rawDevice.id,
        name: rawDevice.name || 'Unnamed Bluetooth Device',
        status: 'disconnected',
        gattConnected: false,
        batteryLevel: null,
        discoveredServices: [],
        rawDevice,
        isAudioOutputSupported: false,
        audioRoutingNote:
          'Device discovered via Web Bluetooth (BLE GATT). Direct audio output is not supported through this browser API. To route music, pair this speaker/headphone in your OS Bluetooth settings.',
      };

      return deviceInfo;
    } catch (err: any) {
      if (err.name === 'NotFoundError' || err.message?.includes('User cancelled')) {
        throw new Error('Bluetooth scan was cancelled by the user.');
      } else if (err.name === 'SecurityError') {
        throw new Error('Security Error: Web Bluetooth requires a secure context (HTTPS) and an active user gesture.');
      } else if (err.name === 'NotSupportedError') {
        throw new Error('Web Bluetooth is not supported on this platform or adapter.');
      }
      throw new Error(err.message || 'Failed to scan for Bluetooth devices.');
    }
  }

  /**
   * Attempts GATT connection to the discovered BLE device to read telemetry (e.g. Battery).
   */
  public async connectGATT(device: BTDeviceInfo): Promise<BTDeviceInfo> {
    if (!device.rawDevice || !device.rawDevice.gatt) {
      return {
        ...device,
        status: 'error',
        errorMessage: 'GATT server unavailable on this device.',
      };
    }

    try {
      device.status = 'connecting';
      const server = await device.rawDevice.gatt.connect();
      const gattConnected = server.connected;

      let batteryLevel: number | null = null;
      const discoveredServices: string[] = [];

      // Attempt to query Battery Service if supported by peripheral
      try {
        const batteryService = await server.getPrimaryService(BATTERY_SERVICE_UUID);
        if (batteryService) {
          discoveredServices.push('Battery Service (0x180F)');
          const batteryChar = await batteryService.getCharacteristic(BATTERY_LEVEL_CHAR_UUID);
          const value = await batteryChar.readValue();
          batteryLevel = value.getUint8(0);
        }
      } catch {
        // Many BLE devices or classic speakers don't expose BLE battery service
      }

      try {
        const infoService = await server.getPrimaryService(DEVICE_INFO_SERVICE_UUID);
        if (infoService) {
          discoveredServices.push('Device Information (0x180A)');
        }
      } catch {
        // Service not available
      }

      return {
        ...device,
        status: 'connected',
        gattConnected,
        batteryLevel,
        discoveredServices,
        lastConnectedAt: Date.now(),
        errorMessage: undefined,
      };
    } catch (err: any) {
      return {
        ...device,
        status: 'error',
        gattConnected: false,
        errorMessage: err.message || 'GATT connection failed. Device may be in sleep mode or out of range.',
      };
    }
  }

  /**
   * Disconnects active GATT session
   */
  public disconnectGATT(device: BTDeviceInfo): BTDeviceInfo {
    if (device.rawDevice?.gatt?.connected) {
      try {
        device.rawDevice.gatt.disconnect();
      } catch (err) {
        console.warn('Error during GATT disconnect:', err);
      }
    }
    return {
      ...device,
      status: 'disconnected',
      gattConnected: false,
      batteryLevel: null,
    };
  }
}

export const bluetoothService = new BluetoothService();
