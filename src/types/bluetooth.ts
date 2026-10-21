/**
 * Web Bluetooth and Device Types for DualSync BT
 */

// Web Bluetooth API TypeScript definitions
export interface BluetoothServiceUUID {
  uuid: string;
}

export interface BluetoothDeviceEventMap {
  gattserverdisconnected: Event;
}

export interface BluetoothRemoteGATTCharacteristic {
  uuid: string;
  value?: DataView;
  readValue(): Promise<DataView>;
  writeValue(value: BufferSource): Promise<void>;
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

export interface BluetoothRemoteGATTService {
  uuid: string;
  isPrimary: boolean;
  getCharacteristic(characteristic: string | number): Promise<BluetoothRemoteGATTCharacteristic>;
  getCharacteristics(characteristic?: string | number): Promise<BluetoothRemoteGATTCharacteristic[]>;
}

export interface BluetoothRemoteGATTServer {
  device: BluetoothDevice;
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: string | number): Promise<BluetoothRemoteGATTService>;
  getPrimaryServices(service?: string | number): Promise<BluetoothRemoteGATTService[]>;
}

export interface BluetoothDevice extends EventTarget {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
  addEventListener(type: 'gattserverdisconnected', listener: (event: Event) => void): void;
  removeEventListener(type: 'gattserverdisconnected', listener: (event: Event) => void): void;
}

export interface RequestDeviceOptions {
  filters?: Array<{
    name?: string;
    namePrefix?: string;
    services?: Array<string | number>;
  }>;
  optionalServices?: Array<string | number>;
  acceptAllDevices?: boolean;
}

export interface NavigatorBluetooth {
  bluetooth?: {
    getAvailability?: () => Promise<boolean>;
    requestDevice: (options: RequestDeviceOptions) => Promise<BluetoothDevice>;
  };
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'disconnecting' | 'error';

export interface BTDeviceInfo {
  id: string;
  name: string;
  status: ConnectionStatus;
  gattConnected: boolean;
  batteryLevel: number | null; // null if not readable or unsupported
  discoveredServices: string[];
  deviceType?: string;
  rawDevice?: BluetoothDevice;
  isAudioOutputSupported: boolean; // Always false for pure Web Bluetooth BLE GATT
  audioRoutingNote: string;
  errorMessage?: string;
  lastConnectedAt?: number;
}

export type DeviceSlot = 'device1' | 'device2';
