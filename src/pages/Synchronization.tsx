/**
 * Audio Synchronization Page for DualSync BT.
 * Latency control from -500ms to +500ms, software delay scheduling,
 * manual calibration workflow, and audio test pulses.
 */

import React, { useState } from 'react';
import { Layers, Wand2, Volume2, RotateCcw, Save, ShieldAlert, CheckCircle2, Clock, Info } from 'lucide-react';
import { LatencySlider } from '../components/LatencySlider';
import { formatLatency, calculateSoftwareDelays } from '../utils/latency';
import { BTDeviceInfo } from '../types/bluetooth';
import { SyncStatus } from '../types/synchronization';

interface SynchronizationProps {
  device1: BTDeviceInfo | null;
  device2: BTDeviceInfo | null;
  device1LatencyMs: number;
  device2LatencyMs: number;
  onDevice1LatencyChange: (ms: number) => void;
  onDevice2LatencyChange: (ms: number) => void;
  onResetDevice1Latency: () => void;
  onResetDevice2Latency: () => void;
  onResetAllLatencies: () => void;
  onOpenCalibration: () => void;
  onTestAudioPulse: () => void;
  onSaveConfiguration: () => void;
  syncStatus: { status: SyncStatus; reason: string };
  isSyncEnabled: boolean;
  onToggleSync: () => void;
}

export const Synchronization: React.FC<SynchronizationProps> = ({
  device1,
  device2,
  device1LatencyMs,
  device2LatencyMs,
  onDevice1LatencyChange,
  onDevice2LatencyChange,
  onResetDevice1Latency,
  onResetDevice2Latency,
  onResetAllLatencies,
  onOpenCalibration,
  onTestAudioPulse,
  onSaveConfiguration,
  syncStatus,
  isSyncEnabled,
  onToggleSync,
}) => {
  const [saveSuccess, setSaveSuccess] = useState(false);

  const softwareDelays = calculateSoftwareDelays(device1LatencyMs, device2LatencyMs);

  const handleSave = () => {
    onSaveConfiguration();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="space-y-7 pb-20">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Audio Synchronization</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure sub-millisecond software delay compensation between output channels.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenCalibration}
            className="px-4 py-2.5 bg-gradient-to-r from-[#6C63FF] to-[#00D4FF] hover:opacity-95 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-md shadow-[#6C63FF]/20 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <Wand2 className="w-4 h-4" />
            <span>Calibrate Sync</span>
          </button>
        </div>
      </div>

      {/* Latency Explanation Card */}
      <div className="p-4 bg-[#141B2D] border border-slate-800 rounded-xl space-y-2 text-xs text-slate-300">
        <div className="flex items-center gap-2 font-semibold text-slate-200">
          <Info className="w-4 h-4 text-[#00D4FF]" />
          <span>Understanding Latency Compensation</span>
        </div>
        <p className="text-slate-400 leading-relaxed">
          &quot;Positive latency adds delay to the selected output. Negative latency is a target for reducing effective delay where the playback architecture permits it.&quot;
        </p>
        <p className="text-slate-400 leading-relaxed">
          Because audio cannot travel backwards in physical time, negative latency on one channel is achieved by adding the equivalent positive delay to the opposing channel in Web Audio memory.
        </p>
      </div>

      {/* Dual Latency Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#141B2D] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="font-semibold text-white text-sm">Device 1 Output</h3>
              <p className="text-[11px] text-slate-400">{device1 ? device1.name : 'Unassigned (Software Channel 1)'}</p>
            </div>
            <span className="font-mono tabular-nums text-xs font-bold text-[#00D4FF]">
              {formatLatency(device1LatencyMs)}
            </span>
          </div>

          <LatencySlider
            label="Device 1"
            latencyMs={device1LatencyMs}
            onChange={onDevice1LatencyChange}
            onReset={onResetDevice1Latency}
            estimatedSoftwareDelaySec={softwareDelays.d1DelaySeconds}
          />
        </div>

        <div className="bg-[#141B2D] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="font-semibold text-white text-sm">Device 2 Output</h3>
              <p className="text-[11px] text-slate-400">{device2 ? device2.name : 'Unassigned (Software Channel 2)'}</p>
            </div>
            <span className="font-mono tabular-nums text-xs font-bold text-[#6C63FF]">
              {formatLatency(device2LatencyMs)}
            </span>
          </div>

          <LatencySlider
            label="Device 2"
            latencyMs={device2LatencyMs}
            onChange={onDevice2LatencyChange}
            onReset={onResetDevice2Latency}
            estimatedSoftwareDelaySec={softwareDelays.d2DelaySeconds}
          />
        </div>
      </div>

      {/* Software Delay Scheduling Diagnostics */}
      <div className="bg-[#141B2D] border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
        <div className="flex items-center gap-2 text-white font-semibold text-sm">
          <Clock className="w-4 h-4 text-emerald-400" />
          <span>Active Web Audio DelayNode Scheduling</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-[#080D1B] rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[11px] block">D1 Delay Buffer</span>
            <span className="font-mono text-white text-sm font-bold">
              {Math.round(softwareDelays.d1DelaySeconds * 1000)} ms
            </span>
            <span className="text-[10px] text-slate-500 font-mono block">
              ({softwareDelays.d1DelaySeconds}s)
            </span>
          </div>

          <div className="p-3 bg-[#080D1B] rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[11px] block">D2 Delay Buffer</span>
            <span className="font-mono text-white text-sm font-bold">
              {Math.round(softwareDelays.d2DelaySeconds * 1000)} ms
            </span>
            <span className="text-[10px] text-slate-500 font-mono block">
              ({softwareDelays.d2DelaySeconds}s)
            </span>
          </div>

          <div className="p-3 bg-[#080D1B] rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[11px] block">Relative Phase Offset</span>
            <span className="font-mono text-[#00D4FF] text-sm font-bold">
              {formatLatency(softwareDelays.relativeOffsetMs)}
            </span>
            <span className="text-[10px] text-slate-500 font-mono block">
              {softwareDelays.explanation}
            </span>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed">
          * Note: Values represent estimated software delay in Web Audio memory. Operating-system audio drivers, Bluetooth AVDTP/A2DP compression buffers, and hardware digital signal processors (DSP) introduce hardware latency outside the browser sandbox.
        </p>
      </div>

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#141B2D] border border-slate-800 rounded-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onTestAudioPulse}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Test Audio Pulse</span>
          </button>

          <button
            onClick={onResetAllLatencies}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Latencies</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Configuration Saved!
            </span>
          )}

          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-gradient-to-r from-[#6C63FF] to-[#00D4FF] hover:opacity-95 active:scale-95 text-white text-xs font-semibold rounded-lg shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>
    </div>
  );
};
