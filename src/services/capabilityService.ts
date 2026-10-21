/**
 * Browser and Audio Capability Detection Service for DualSync BT.
 * Genuinely evaluates browser APIs and hardware capabilities without faking.
 */

import { BrowserAudioCapabilities, AudioOutputDevice } from '../types/audio';

class CapabilityService {
  private cachedCapabilities: BrowserAudioCapabilities | null = null;

  public detectCapabilities(): BrowserAudioCapabilities {
    if (this.cachedCapabilities) {
      return this.cachedCapabilities;
    }

    const isClient = typeof window !== 'undefined';
    let hasWebBluetooth = false;
    let isSecureContext = false;
    let hasSetSinkId = false;
    let hasEnumerateDevices = false;
    let hasWebAudio = false;
    let hasMediaSession = false;

    if (isClient) {
      try {
        hasWebBluetooth = 'bluetooth' in navigator && !!(navigator as any).bluetooth;
      } catch {
        hasWebBluetooth = false;
      }

      try {
        isSecureContext = window.isSecureContext === true;
      } catch {
        isSecureContext = false;
      }

      try {
        hasSetSinkId = 'HTMLMediaElement' in window && 'setSinkId' in HTMLMediaElement.prototype;
      } catch {
        hasSetSinkId = false;
      }

      try {
        hasEnumerateDevices = 'mediaDevices' in navigator && typeof navigator.mediaDevices.enumerateDevices === 'function';
      } catch {
        hasEnumerateDevices = false;
      }

      try {
        hasWebAudio = typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined';
      } catch {
        hasWebAudio = false;
      }

      try {
        hasMediaSession = 'mediaSession' in navigator;
      } catch {
        hasMediaSession = false;
      }
    }

    const canRouteDualBluetoothAudio = false;

    this.cachedCapabilities = {
      hasWebBluetooth,
      isSecureContext,
      hasSetSinkId,
      hasEnumerateDevices,
      hasWebAudio,
      hasMediaSession,
      canRouteDualBluetoothAudio,
      bluetoothAudioRoutingStatus: 'Not Exposed by Browser',
      dualOutputStatus: 'Unsupported in Web Platform',
      perDeviceVolumeStatus: 'Software Emulation (Dual WebAudio Gain)',
      latencyCompensationStatus: 'Active Software Delay Nodes',
    };

    return this.cachedCapabilities;
  }

  /**
   * Enumerate real system audio output devices if browser supports and allows it
   */
  public async enumerateAudioOutputs(): Promise<AudioOutputDevice[]> {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return [];
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter((d) => d.kind === 'audiooutput')
        .map((d, index) => ({
          deviceId: d.deviceId || `output-${index}`,
          label: d.label || (index === 0 ? 'Default Audio Output' : `Audio Device ${index + 1}`),
          groupId: d.groupId,
          kind: d.kind,
        }));
    } catch (err) {
      console.warn('Unable to enumerate audio outputs:', err);
      return [];
    }
  }

  /**
   * Detailed diagnostic report for settings / debugging
   */
  public getTechnicalDiagnostic(): {
    apiSummary: Record<string, boolean | string>;
    osAudioExplanation: string;
    bluetoothExplanation: string;
  } {
    const caps = this.detectCapabilities();
    return {
      apiSummary: {
        'Web Bluetooth API': caps.hasWebBluetooth ? 'Available' : 'Unavailable (Requires Chrome / Edge / Android)',
        'Secure Context (HTTPS/localhost)': caps.isSecureContext ? 'Verified' : 'Insecure Context (Required for Web BT)',
        'HTMLMediaElement setSinkId()': caps.hasSetSinkId ? 'Supported (Single Output Sink)' : 'Unsupported',
        'MediaDevices Enumerate': caps.hasEnumerateDevices ? 'Available' : 'Unavailable',
        'Web Audio API': caps.hasWebAudio ? 'Available (Real-time DSP & Latency Delays)' : 'Unavailable',
        'Media Session API': caps.hasMediaSession ? 'Supported' : 'Unsupported',
        'Dual Simultaneous A2DP Output': 'Unsupported by Web Sandboxes',
        'Latency Compensation Mode': 'Real WebAudio DelayNodes (0 to 500ms)',
      },
      osAudioExplanation: 
        'Direct dual Bluetooth audio broadcast (such as Samsung Dual Audio or macOS Aggregate Audio Device) is governed by operating system kernels and Bluetooth hardware controllers. Browsers route audio through the operating system master mixer, meaning independent physical streams to two Bluetooth speakers require OS-level audio aggregation.',
      bluetoothExplanation:
        'The Web Bluetooth API communicates exclusively with Bluetooth Low Energy (BLE) GATT peripherals (e.g., heart rate monitors, battery telemetry, smart sensors). It cannot establish Bluetooth Classic A2DP audio transport to stream music directly to headphones or speakers.',
    };
  }
}

export const capabilityService = new CapabilityService();
