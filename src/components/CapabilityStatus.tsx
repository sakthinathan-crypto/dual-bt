/**
 * Browser and Audio Capability Matrix for DualSync BT.
 * Honestly evaluates and renders detected platform features without exaggeration.
 */

import React, { useEffect, useState } from 'react';
import { Check, X, Shield, Cpu, Volume2, Bluetooth, Layers, HelpCircle } from 'lucide-react';
import { capabilityService } from '../services/capabilityService';
import { AudioOutputDevice, BrowserAudioCapabilities } from '../types/audio';

export const CapabilityStatus: React.FC = () => {
  const [caps, setCaps] = useState<BrowserAudioCapabilities | null>(null);
  const [outputDevices, setOutputDevices] = useState<AudioOutputDevice[]>([]);

  useEffect(() => {
    const detected = capabilityService.detectCapabilities();
    setCaps(detected);

    capabilityService.enumerateAudioOutputs().then((devices) => {
      setOutputDevices(devices);
    });
  }, []);

  if (!caps) return null;

  const items = [
    {
      title: 'Browser Bluetooth API',
      status: caps.hasWebBluetooth ? 'Available' : 'Unavailable',
      isSupported: caps.hasWebBluetooth,
      note: caps.hasWebBluetooth ? 'navigator.bluetooth exposed' : 'Requires Chrome/Edge/Android over HTTPS',
      icon: Bluetooth,
    },
    {
      title: 'Bluetooth Audio Routing',
      status: 'Not Exposed',
      isSupported: false,
      note: 'Web Bluetooth is BLE GATT only; no A2DP Classic audio stream',
      icon: Volume2,
    },
    {
      title: 'Local Music Playback',
      status: 'Available',
      isSupported: true,
      note: 'Local file reading via URL.createObjectURL & Web Audio decoding',
      icon: Cpu,
    },
    {
      title: 'Dual Independent Output',
      status: 'Unsupported in Web Platform',
      isSupported: false,
      note: 'Requires OS-level audio aggregation (macOS Aggregate / Samsung Dual Audio)',
      icon: Layers,
    },
    {
      title: 'Per-Device Volume',
      status: 'Software Emulation',
      isSupported: true,
      note: 'Dual WebAudio GainNodes; physical volume controlled by OS',
      icon: Volume2,
    },
    {
      title: 'Latency Compensation',
      status: 'Software-Only',
      isSupported: true,
      note: 'Web Audio DelayNodes (-500ms to +500ms dynamic buffer alignment)',
      icon: Shield,
    },
    {
      title: 'Audio Sink Selection (setSinkId)',
      status: caps.hasSetSinkId ? 'Supported (Single Output)' : 'Unsupported',
      isSupported: caps.hasSetSinkId,
      note: caps.hasSetSinkId ? 'Allows routing media element to single OS audio sink' : 'Browser does not expose setSinkId API',
      icon: Volume2,
    },
    {
      title: 'Secure Context (HTTPS)',
      status: caps.isSecureContext ? 'Verified' : 'Insecure Context',
      isSupported: caps.isSecureContext,
      note: 'Required by modern browsers for Web Bluetooth & Media Devices',
      icon: Shield,
    },
  ];

  return (
    <div className="bg-[#141B2D] border border-slate-800 rounded-xl p-6 shadow-lg space-y-5">
      <div>
        <h3 className="font-semibold text-white text-base">Browser & Hardware Capability Matrix</h3>
        <p className="text-xs text-slate-400 mt-1">
          Real-time detection of web sandbox boundaries, Bluetooth protocols, and audio routing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="p-3.5 bg-[#080D1B] rounded-lg border border-slate-800/80 flex items-start gap-3"
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              item.isSupported ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
            }`}>
              <item.icon className="w-4 h-4" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">{item.title}</span>
                <span className={`text-[11px] font-mono font-medium ${
                  item.isSupported ? 'text-emerald-400' : 'text-slate-400'
                }`}>
                  {item.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                {item.note}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Discovered OS Audio Outputs if any */}
      {outputDevices.length > 0 && (
        <div className="pt-3 border-t border-slate-800 space-y-2">
          <span className="text-xs font-semibold text-slate-300 block">
            Detected Operating System Audio Outputs ({outputDevices.length}):
          </span>
          <div className="space-y-1.5">
            {outputDevices.map((dev) => (
              <div
                key={dev.deviceId}
                className="text-[11px] text-slate-400 font-mono bg-[#080D1B]/60 p-2 rounded border border-slate-800/60 flex items-center justify-between"
              >
                <span className="truncate max-w-xs">{dev.label}</span>
                <span className="text-slate-500 text-[10px]">{dev.deviceId === 'default' ? 'Default Sink' : 'Aux Sink'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
