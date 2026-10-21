/**
 * Devices Management Page for DualSync BT.
 * Provides detailed overview of Device 1 & Device 2 slots,
 * GATT connection management, battery telemetry, and OS multi-output guides.
 */

import React from 'react';
import { Bluetooth, Battery, ShieldAlert, Info, Power, PowerOff, RefreshCw, Trash2, Smartphone, Laptop, CheckCircle2 } from 'lucide-react';
import { BTDeviceInfo } from '../types/bluetooth';

interface DevicesProps {
  device1: BTDeviceInfo | null;
  device2: BTDeviceInfo | null;
  onOpenSelector: (slot: 'device1' | 'device2') => void;
  onConnectGATT: (slot: 'device1' | 'device2') => void;
  onDisconnectGATT: (slot: 'device1' | 'device2') => void;
  onRemoveDevice: (slot: 'device1' | 'device2') => void;
  isScanning: 'device1' | 'device2' | null;
}

export const Devices: React.FC<DevicesProps> = ({
  device1,
  device2,
  onOpenSelector,
  onConnectGATT,
  onDisconnectGATT,
  onRemoveDevice,
  isScanning,
}) => {
  const renderDeviceDetail = (
    slot: 'device1' | 'device2',
    title: string,
    device: BTDeviceInfo | null
  ) => {
    return (
      <div className="bg-[#141B2D] border border-slate-800 rounded-xl p-6 shadow-lg space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              device?.gattConnected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
              device ? 'bg-[#6C63FF]/15 text-[#6C63FF] border border-[#6C63FF]/30' :
              'bg-slate-800 text-slate-400'
            }`}>
              <Bluetooth className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">{title}</h3>
              <p className="text-xs text-slate-400">{device ? device.name : 'No device paired'}</p>
            </div>
          </div>

          <span className={`text-[11px] font-mono uppercase font-semibold tracking-wider ${
            device?.gattConnected ? 'text-emerald-400' :
            device ? 'text-slate-300' :
            'text-slate-500'
          }`}>
            {device?.gattConnected ? 'GATT Connected' : device ? 'Assigned' : 'Not Connected'}
          </span>
        </div>

        {!device ? (
          <div className="py-8 text-center space-y-3">
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              No device assigned to {title}. Launch the browser chooser to connect.
            </p>
            <button
              onClick={() => onOpenSelector(slot)}
              disabled={isScanning === slot}
              className="px-4 py-2 bg-[#6C63FF] hover:bg-[#5b52e0] text-white text-xs font-semibold rounded-lg shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              {isScanning === slot ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Opening Chooser...
                </>
              ) : (
                <>
                  <Bluetooth className="w-3.5 h-3.5" />
                  Select {title}
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Telemetry info */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#080D1B] rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Identifier</span>
                <span className="font-mono text-slate-200 truncate block text-[11px]">
                  {device.id}
                </span>
              </div>

              <div className="p-3 bg-[#080D1B] rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Battery Telemetry</span>
                <span className="font-mono text-slate-200 block text-xs">
                  {device.batteryLevel !== null ? `${device.batteryLevel}% (GATT 0x180F)` : 'Not Reported'}
                </span>
              </div>
            </div>

            {/* GATT Controls */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              {device.gattConnected ? (
                <button
                  onClick={() => onDisconnectGATT(slot)}
                  className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <PowerOff className="w-3.5 h-3.5 text-red-400" />
                  Disconnect GATT
                </button>
              ) : (
                <button
                  onClick={() => onConnectGATT(slot)}
                  className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Power className="w-3.5 h-3.5 text-emerald-400" />
                  Connect GATT
                </button>
              )}

              <button
                onClick={() => onOpenSelector(slot)}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Change Device
              </button>

              <button
                onClick={() => onRemoveDevice(slot)}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Remove Device"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-7 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-white">Device Management</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Independent configuration and status monitoring for both Bluetooth audio channels.
        </p>
      </div>

      {/* Device Slots */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderDeviceDetail('device1', 'Device 1', device1)}
        {renderDeviceDetail('device2', 'Device 2', device2)}
      </div>

      {/* Operating System Dual Bluetooth Audio Guides */}
      <div className="bg-[#141B2D] border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
        <div className="flex items-center gap-2 text-white font-semibold text-base">
          <Info className="w-5 h-5 text-[#00D4FF]" />
          <span>How to Enable Physical Dual Audio on Your OS</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Because browsers cannot directly route Bluetooth Classic A2DP audio streams independently, you should pair both Bluetooth devices in your operating system settings. Use the native features below for simultaneous playback:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-1">
          {/* Android */}
          <div className="p-4 bg-[#080D1B] rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-200">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Android (Samsung / One UI)</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px] leading-relaxed">
              <li>Swipe down Quick Settings panel.</li>
              <li>Tap <strong>Media output</strong>.</li>
              <li>Check both paired Bluetooth devices under Audio Output.</li>
              <li>Adjust relative volumes using Dual Audio controls.</li>
            </ol>
          </div>

          {/* macOS */}
          <div className="p-4 bg-[#080D1B] rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-200">
              <Laptop className="w-4 h-4 text-[#00D4FF]" />
              <span>macOS (Aggregate Device)</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px] leading-relaxed">
              <li>Open <strong>Audio MIDI Setup</strong> in Applications.</li>
              <li>Click the <strong>+</strong> button at the bottom left.</li>
              <li>Select <strong>Create Multi-Output Device</strong>.</li>
              <li>Check both Bluetooth devices in the device list.</li>
            </ol>
          </div>

          {/* Windows */}
          <div className="p-4 bg-[#080D1B] rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-200">
              <Laptop className="w-4 h-4 text-[#6C63FF]" />
              <span>Windows 11 / 10</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px] leading-relaxed">
              <li>Pair both Bluetooth headphones in Windows Settings.</li>
              <li>Open Sound Control Panel → Recording tab.</li>
              <li>Enable <strong>Stereo Mix</strong> → Listen to this device.</li>
              <li>Route second device as playback output.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
