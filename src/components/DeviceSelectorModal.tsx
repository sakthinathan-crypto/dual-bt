/**
 * Device Selector Modal for DualSync BT.
 * Triggers native browser chooser via user gesture, enforces duplicate device prevention,
 * and explains browser API vs OS Bluetooth routing.
 */

import React, { useState } from 'react';
import { X, Bluetooth, ShieldAlert, CheckCircle2, AlertCircle, Headphones, ArrowRight, HelpCircle, Smartphone, ChevronDown, ChevronUp } from 'lucide-react';
import { DeviceSlot } from '../types/bluetooth';
import { capabilityService } from '../services/capabilityService';

interface DeviceSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: DeviceSlot;
  onScan: (slot: DeviceSlot) => Promise<{ success: boolean; message?: string }>;
  isScanning: boolean;
  errorMessage: string | null;
}

export const DeviceSelectorModal: React.FC<DeviceSelectorModalProps> = ({
  isOpen,
  onClose,
  slot,
  onScan,
  isScanning,
  errorMessage,
}) => {
  const [scanResult, setScanResult] = useState<{ success: boolean; message?: string } | null>(null);
  const [showMobileTips, setShowMobileTips] = useState(false);

  if (!isOpen) return null;

  const slotTitle = slot === 'device1' ? 'Device 1' : 'Device 2';
  const otherSlotTitle = slot === 'device1' ? 'Device 2' : 'Device 1';
  const caps = capabilityService.detectCapabilities();

  const handleStartScan = async () => {
    setScanResult(null);
    const result = await onScan(slot);
    setScanResult(result);
    if (result.success) {
      setTimeout(() => {
        onClose();
      }, 900);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#141B2D] border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#6C63FF]">
            <Bluetooth className="w-5 h-5" />
            <span className="text-xs font-mono uppercase tracking-wider font-semibold">Web Bluetooth Chooser</span>
          </div>
          <h2 className="text-xl font-bold text-white">Select Bluetooth {slotTitle}</h2>
          <p className="text-sm text-slate-300">
            Search for nearby Bluetooth devices. Independent from {otherSlotTitle}.
          </p>
        </div>

        {/* Browser capability check banner */}
        {!caps.hasWebBluetooth && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-200 text-xs">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-300">Web Bluetooth Unavailable</p>
              <p className="text-slate-300 mt-0.5">
                Your current browser does not expose <code>navigator.bluetooth</code>. Please open this app in Google Chrome, Microsoft Edge, or Chrome for Android over HTTPS or localhost.
              </p>
            </div>
          </div>
        )}

        {/* Why only connected devices appear on mobile - Help banner */}
        <div className="p-3.5 bg-[#080D1B] border border-slate-800 rounded-xl space-y-2 text-xs">
          <button
            onClick={() => setShowMobileTips(!showMobileTips)}
            className="w-full flex items-center justify-between text-left text-slate-200 hover:text-white font-medium cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#00D4FF]" />
              <span>Only connected devices showing on your phone?</span>
            </div>
            {showMobileTips ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {showMobileTips && (
            <div className="space-y-2 pt-2 border-t border-slate-800 text-slate-300 text-[11px] leading-relaxed">
              <p>
                <strong>1. Turn ON Phone Location (GPS):</strong> On Android, Google Chrome requires Location Services to be enabled to discover unbonded nearby Bluetooth Low Energy devices. If Location is off, Android only lists devices already connected in phone settings.
              </p>
              <p>
                <strong>2. Put Device in Pairing Mode:</strong> Unpaired Bluetooth speakers only broadcast discovery signals when actively in pairing mode (LED blinking).
              </p>
              <p>
                <strong>3. Classic Audio (A2DP) vs BLE:</strong> Web Bluetooth only scans Bluetooth Low Energy (BLE) peripherals. Pure Bluetooth Classic speakers must be paired first in your phone&apos;s OS Bluetooth settings.
              </p>
              <p className="text-amber-300/90 font-medium">
                * Note on <code>getDevices()</code>: The browser API <code>getDevices()</code> only returns previously authorized devices and does not scan the radio. Clicking &quot;Scan for Devices&quot; invokes <code>requestDevice()</code> to start a fresh scan.
              </p>
            </div>
          )}
        </div>

        {/* Native Android App Recommendation */}
        <div className="p-3.5 bg-[#080D1B] border border-slate-800 rounded-xl space-y-1.5 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-slate-300 font-semibold">
            <Headphones className="w-4 h-4 text-[#6C63FF]" />
            <span>Browser Sandbox vs Native Android</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Browsers cannot enumerate arbitrary nearby Classic Bluetooth speakers without user approval due to sandbox security. If you need automatic scanning of all nearby Classic audio devices by name, a native Android application using <code>BluetoothAdapter.startDiscovery()</code> is required.
          </p>
        </div>

        {/* Scan Actions & Feedback */}
        <div className="space-y-3">
          <button
            onClick={handleStartScan}
            disabled={isScanning || !caps.hasWebBluetooth}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-[#6C63FF] to-[#00D4FF] hover:opacity-95 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none text-white font-semibold text-sm rounded-xl shadow-lg shadow-[#6C63FF]/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            {isScanning ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Opening Browser Device Chooser...</span>
              </>
            ) : (
              <>
                <Bluetooth className="w-4 h-4" />
                <span>Scan for Devices ({slotTitle})</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Feedback messages */}
          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2.5 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">{errorMessage}</p>
                {errorMessage.includes('cancelled') && (
                  <p className="text-[11px] text-slate-400">
                    If no devices appeared in the chooser, ensure the device is in pairing mode and Location Services (GPS) are turned ON on your phone.
                  </p>
                )}
              </div>
            </div>
          )}

          {scanResult?.success && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2.5 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Device assigned successfully to {slotTitle}!</span>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center pt-1 border-t border-slate-800">
          <p className="text-[11px] text-slate-500">
            Selecting a device for {slotTitle} will not disconnect or overwrite {otherSlotTitle}. Both device slots maintain independent connection states.
          </p>
        </div>
      </div>
    </div>
  );
};
