/**
 * Settings and Capability Diagnostics Page for DualSync BT.
 * Displays real browser capabilities, external audio compatibility, and persistent data reset.
 */

import React, { useState } from 'react';
import { Settings as SettingsIcon, Trash2, CheckCircle2, RotateCcw, ShieldCheck, Terminal, Cpu } from 'lucide-react';
import { CapabilityStatus } from '../components/CapabilityStatus';
import { ExternalAudioNotice } from '../components/ExternalAudioNotice';
import { capabilityService } from '../services/capabilityService';

interface SettingsProps {
  onResetAllSettings: () => void;
  onOpenDiagnostics: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onResetAllSettings, onOpenDiagnostics }) => {
  const [resetConfirmed, setResetConfirmed] = useState(false);

  const technical = capabilityService.getTechnicalDiagnostic();

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all saved volumes, latency profiles, and paired device references?')) {
      onResetAllSettings();
      setResetConfirmed(true);
      setTimeout(() => setResetConfirmed(false), 2500);
    }
  };

  return (
    <div className="space-y-7 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">System Settings & Capabilities</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Transparent reporting of browser sandbox limits, API support, and audio engine configuration.
          </p>
        </div>

        <button
          onClick={onOpenDiagnostics}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <Terminal className="w-4 h-4 text-[#00D4FF]" />
          <span>Run Diagnostic Suite</span>
        </button>
      </div>

      {/* Browser and Hardware Capability Matrix */}
      <CapabilityStatus />

      {/* Technical Diagnostics */}
      <div className="bg-[#141B2D] border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
        <div className="flex items-center gap-2.5">
          <Cpu className="w-5 h-5 text-[#6C63FF]" />
          <h3 className="font-semibold text-white text-base">API Diagnostic Breakdown</h3>
        </div>

        <div className="space-y-2 text-xs">
          {Object.entries(technical.apiSummary).map(([key, val]) => (
            <div
              key={key}
              className="flex items-center justify-between p-2.5 bg-[#080D1B] rounded-lg border border-slate-800"
            >
              <span className="text-slate-300 font-medium">{key}</span>
              <span className="font-mono text-slate-400 text-[11px]">{String(val)}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2 pt-2 text-xs text-slate-400 leading-relaxed">
          <p>
            <strong className="text-slate-300">Bluetooth Architecture: </strong>
            {technical.bluetoothExplanation}
          </p>
          <p>
            <strong className="text-slate-300">Operating System Audio Mixer: </strong>
            {technical.osAudioExplanation}
          </p>
        </div>
      </div>

      {/* External Audio Notice (Spotify & DRM) */}
      <ExternalAudioNotice />

      {/* Reset & Storage Management */}
      <div className="bg-[#141B2D] border border-red-500/20 rounded-xl p-6 shadow-lg space-y-3">
        <div className="flex items-center gap-2 text-white font-semibold text-base">
          <RotateCcw className="w-4 h-4 text-red-400" />
          <span>Reset Settings & Paired Devices</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Clears all stored localStorage keys (custom latency calibrations, device assignment profiles, volume preferences, and saved track metadata).
        </p>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold rounded-lg border border-red-500/30 transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset All Application Data</span>
          </button>

          {resetConfirmed && (
            <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Reset complete. Reloading defaults.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
