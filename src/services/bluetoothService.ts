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
   * Retrieves previously permitted devices using navigator.bluetooth.getDevices().
   * NOTE: getDevices() ONLY returns devices that the user has ALREADY authorized in previous
   * browser sessions. It DOES NOT perform a fresh radio scan of nearby devices.
   */
  public async getPermittedDevices(): Promise<BluetoothDevice[]> {
    if (!this.isSupported()) return [];
    try {
      const bluetooth = (navigator as any).bluetooth;
      if (typeof bluetooth.getDevices === 'function') {
        return await bluetooth.getDevices();
      }
    } catch (err) {
      console.warn('navigator.bluetooth.getDevices() error:', err);
    }
    return [];
  }

  /**
   * Launches the browser's native Bluetooth Device Chooser.
   * MUST be called in direct response to a user click/touch event.
   * Uses navigator.bluetooth.requestDevice() with acceptAllDevices: true.
   */
  public async requestBluetoothDevice(
    onDisconnected?: (deviceId: string) => void
  ): Promise<BTDeviceInfo> {
    if (!this.isSupported()) {
      throw new Error(
        'Web Bluetooth API is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Chrome for Android over HTTPS or localhost.'
      );
    }

    try {
      const bluetooth = (navigator as any).bluetooth;

      // Web Bluetooth requires acceptAllDevices: true when not filtering by specific service
      // We include optional services to read battery and device metadata where peripheral allows
      const rawDevice: BluetoothDevice = await bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          'battery_service',
          'device_information',
          'generic_access',
          BATTERY_SERVICE_UUID,
          DEVICE_INFO_SERVICE_UUID,
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
        throw new Error('Bluetooth scan was cancelled or closed without selecting a device.');
      } else if (err.name === 'SecurityError') {
        throw new Error('Security Error: Web Bluetooth requires a secure context (HTTPS) and an active user gesture.');
      } else if (err.name === 'NotSupportedError') {
        throw new Error('Web Bluetooth is not supported on this platform, or the Bluetooth radio is disabled.');
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
        errorMessage: 'Device reference is no longer active in memory. Click "Change Device" to re-authorize.',
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
        // Peripheral does not expose BLE battery service
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
        errorMessage: err.message || 'GATT connection failed. Device may be in sleep mode, disconnected, or out of range.',
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

  /**
   * Technical explanation of why only connected devices appear on mobile phones,
   * and why a web application cannot enumerate all nearby Bluetooth audio devices.
   */
  public getScannerLimitationsExplanation(): {
    whyOnlyConnectedAppear: string[];
    nativeAppRecommendation: string;
  } {
    return {
      whyOnlyConnectedAppear: [
        'Android Location Permission / GPS: Android OS requires Location Services (GPS) to be turned ON to scan for unbonded nearby Bluetooth Low Energy devices. Without Location enabled, Android will ONLY show devices that are already paired/connected in phone settings.',
        'Pairing Mode Requirement: Unpaired Bluetooth speakers and earbuds only advertise discovery packets while actively in "Pairing Mode" (blinking pairing indicator). Once paired or idle, they do not broadcast discovery packets.',
        'Bluetooth Classic (A2DP) vs Bluetooth Low Energy (BLE): Standard Bluetooth headphones and speakers broadcast audio via Classic Bluetooth A2DP. The Web Bluetooth API only listens to Bluetooth Low Energy (BLE) advertisements. Pure Classic Bluetooth audio devices will never appear in a web browser chooser until they are paired at the Android OS level.',
        'navigator.bluetooth.getDevices() vs requestDevice(): getDevices() does NOT perform a radio scan; it only lists previously permitted devices. requestDevice() launches the native chooser to discover broadcasting BLE peripherals.',
      ],
      nativeAppRecommendation:
        'If full discovery of every nearby Bluetooth Classic speaker, headphone, and earbud by name is required, a standard web browser cannot provide this due to browser sandbox security. A native Android application (using Android SDK BluetoothAdapter.startDiscovery() and BluetoothA2dp APIs with BLUETOOTH_SCAN and BLUETOOTH_CONNECT runtime permissions) must be used instead.',
    };
  }
}

export const bluetoothService = new BluetoothService();
