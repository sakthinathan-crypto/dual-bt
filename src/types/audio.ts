/**
 * Audio Engine and Media Library Types for DualSync BT
 */

export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  format: string;
  fileName: string;
  fileSize: number;
  objectUrl: string;
  artworkUrl?: string;
  dateAdded: number;
  isDemo?: boolean;
  file?: File;
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface AudioPlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentTrackId: string | null;
  masterVolume: number; // 0.0 to 1.0
  device1Volume: number; // 0.0 to 1.0
  device2Volume: number; // 0.0 to 1.0
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  playbackRate: number;
}

export interface AudioOutputDevice {
  deviceId: string;
  label: string;
  groupId: string;
  kind: MediaDeviceKind;
}

export interface BrowserAudioCapabilities {
  hasWebBluetooth: boolean;
  isSecureContext: boolean;
  hasSetSinkId: boolean;
  hasEnumerateDevices: boolean;
  hasWebAudio: boolean;
  hasMediaSession: boolean;
  canRouteDualBluetoothAudio: boolean;
  bluetoothAudioRoutingStatus: 'Not Exposed by Browser' | 'OS Mediated' | 'Single Sink Only';
  dualOutputStatus: 'Unsupported in Web Platform' | 'OS Aggregation Required' | 'Single Output Only';
  perDeviceVolumeStatus: 'Software Emulation (Dual WebAudio Gain)' | 'Hardware Independent Sinks Unavailable';
  latencyCompensationStatus: 'Active Software Delay Nodes';
}
