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
    const hasWebBluetooth = isClient && 'bluetooth' in navigator && !!(navigator as any).bluetooth;
    const isSecureContext = isClient && window.isSecureContext === true;
    const hasSetSinkId = isClient && 'HTMLMediaElement' in window && 'setSinkId' in HTMLMediaElement.prototype;
    const hasEnumerateDevices = isClient && 'mediaDevices' in navigator && typeof navigator.mediaDevices.enumerateDevices === 'function';
    const hasWebAudio = isClient && (typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined');
    const hasMediaSession = isClient && 'mediaSession' in navigator;

    // Web platform currently does NOT provide independent A2DP Bluetooth audio streams from a single browser tab.
    // HTMLMediaElement.setSinkId() can direct a media element to a selected OS audio output device,
    // but cannot split one media stream into two distinct Bluetooth audio endpoints simultaneously.
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
