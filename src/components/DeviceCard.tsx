/**
 * Device Card Component for DualSync BT.
 * Renders individual device slot state (Device 1 or Device 2),
 * GATT controls, battery readout, volume, latency, and honest audio routing disclosure.
 */

import React, { useState } from 'react';
import { Bluetooth, Battery, Info, RefreshCw, Power, PowerOff, Trash2, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { BTDeviceInfo, DeviceSlot } from '../types/bluetooth';
import { VolumeSlider } from './VolumeSlider';
import { LatencySlider } from './LatencySlider';

interface DeviceCardProps {
  slot: DeviceSlot;
  slotTitle: string; // "Device 1" or "Device 2"
  device: BTDeviceInfo | null;
  onOpenSelector: () => void;
  onConnectGATT: () => void;
  onDisconnectGATT: () => void;
  onRemoveDevice: () => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  latencyMs: number;
  onLatencyChange: (ms: number) => void;
  onResetLatency: () => void;
  estimatedSoftwareDelaySec: number;
  isScanning?: boolean;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({
  slotTitle,
  device,
  onOpenSelector,
  onConnectGATT,
  onDisconnectGATT,
  onRemoveDevice,
  volume,
  onVolumeChange,
  latencyMs,
  onLatencyChange,
  onResetLatency,
  estimatedSoftwareDelaySec,
  isScanning = false,
}) => {
  const [showOsGuide, setShowOsGuide] = useState(false);

  // Status badge styling
  const isConnected = device && device.gattConnected;
  const isDiscovered = !!device;

  return (
    <div className="bg-[#141B2D] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between transition-all duration-200 hover:border-slate-700/80">
      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800/80 mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isConnected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
              isDiscovered ? 'bg-[#6C63FF]/15 text-[#6C63FF] border border-[#6C63FF]/30' :
              'bg-slate-800 text-slate-400'
            }`}>
              <Bluetooth className={`w-5 h-5 ${isScanning ? 'animate-pulse text-[#00D4FF]' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-100 text-base">{slotTitle}</h3>
                {device?.batteryLevel !== null && device?.batteryLevel !== undefined && (
                  <span className="flex items-center gap-1 text-[11px] font-mono tabular-nums text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    <Battery className="w-3 h-3" />
                    {device.batteryLevel}%
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-[260px]">
                {device ? device.name : 'Not Connected'}
              </p>
            </div>
          </div>

          {/* Connection status tag */}
          <div className="text-right">
            <span className={`text-[11px] font-mono uppercase tracking-wider font-semibold ${
              isConnected ? 'text-emerald-400' :
              isDiscovered ? 'text-slate-300' :
              'text-slate-500'
            }`}>
              {isConnected ? 'GATT Connected' : isDiscovered ? 'Selected' : 'Not Connected'}
            </span>
          </div>
        </div>

        {/* Unconnected Empty State */}
        {!device ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-slate-800/60 flex items-center justify-center text-slate-400 border border-slate-700/50">
              <Bluetooth className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-200">No Bluetooth device selected</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Scan for nearby Bluetooth audio devices using the browser's native chooser.
              </p>
            </div>
            <button
              onClick={onOpenSelector}
              disabled={isScanning}
              className="px-4 py-2.5 bg-[#6C63FF] hover:bg-[#5b52e0] active:scale-[0.98] text-white text-xs font-semibold rounded-lg shadow-md shadow-[#6C63FF]/20 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Opening Chooser...
                </>
              ) : (
                <>
                  <Bluetooth className="w-3.5 h-3.5" />
                  Select {slotTitle}
                </>
              )}
            </button>
          </div>
        ) : (
          /* Discovered / Connected Device State */
          <div className="space-y-4">
            {/* Device Info & GATT Actions */}
            <div className="p-3 bg-[#080D1B]/60 rounded-lg border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Device ID:</span>
                <span className="font-mono text-slate-300 text-[11px] truncate max-w-[170px]">
                  {device.id}
                </span>
              </div>

              {device.discoveredServices.length > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Discovered Services:</span>
                  <span className="text-slate-300 text-[11px] truncate max-w-[170px]">
                    {device.discoveredServices.join(', ')}
                  </span>
                </div>
              )}

              {/* GATT Connect / Disconnect / Change Buttons */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                {device.gattConnected ? (
                  <button
                    onClick={onDisconnectGATT}
                    className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded transition-colors inline-flex items-center justify-center gap-1.5"
                  >
                    <PowerOff className="w-3 h-3 text-red-400" />
                    Disconnect GATT
                  </button>
                ) : (
                  <button
                    onClick={onConnectGATT}
                    className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded transition-colors inline-flex items-center justify-center gap-1.5"
                  >
                    <Power className="w-3 h-3 text-emerald-400" />
                    Connect GATT
                  </button>
                )}

                <button
                  onClick={onOpenSelector}
                  className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded transition-colors"
                >
                  Change Device
                </button>

                <button
                  onClick={onRemoveDevice}
                  title="Remove Device"
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {device.errorMessage && (
                <p className="text-[11px] text-red-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  {device.errorMessage}
                </p>
              )}
            </div>

            {/* Honest Audio Routing Disclosure Banner */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-lg space-y-1.5">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-amber-200/90 leading-relaxed">
                  <p className="font-semibold text-amber-300 mb-0.5">
                    Audio Output Notice:
                  </p>
                  <p>
                    Device discovered, but direct audio output is not supported through this browser API. Web Bluetooth provides BLE GATT data only, not Bluetooth Classic A2DP audio streaming.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowOsGuide(!showOsGuide)}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-medium inline-flex items-center gap-1 mt-1 underline underline-offset-2"
              >
                <span>{showOsGuide ? 'Hide OS setup guide' : 'How to connect audio via OS settings'}</span>
                {showOsGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {showOsGuide && (
                <div className="mt-2 pt-2 border-t border-amber-500/20 text-[11px] text-slate-300 space-y-1.5">
                  <p><strong>1. Android:</strong> Open Settings → Bluetooth → Pair device. To play on two devices simultaneously, enable Samsung Dual Audio or Media Output.</p>
                  <p><strong>2. macOS:</strong> Open Audio MIDI Setup → Click '+' → Create Multi-Output Device → Select both Bluetooth devices.</p>
                  <p><strong>3. Windows:</strong> Pair both in Bluetooth Settings. Enable Stereo Mix or use software like VoiceMeeter for dual routing.</p>
                </div>
              )}
            </div>

            {/* Individual Volume Slider */}
            <div className="pt-2">
              <VolumeSlider
                label={`${slotTitle} Volume`}
                volume={volume}
                onChange={onVolumeChange}
                subtitle="Controls software gain for this output channel."
              />
            </div>

            {/* Individual Latency Slider */}
            <div className="pt-1">
              <LatencySlider
                label={slotTitle}
                latencyMs={latencyMs}
                onChange={onLatencyChange}
                onReset={onResetLatency}
                estimatedSoftwareDelaySec={estimatedSoftwareDelaySec}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
