/**
 * External Audio Compatibility Notice for DualSync BT.
 * Explains browser sandbox restrictions regarding Spotify, YouTube, and OS audio capture.
 */

import React from 'react';
import { ShieldCheck, Music2, AlertCircle, Info } from 'lucide-react';

export const ExternalAudioNotice: React.FC = () => {
  return (
    <div className="bg-[#141B2D] border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-[#00D4FF]/10 text-[#00D4FF] flex items-center justify-center">
          <Info className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-semibold text-white text-base">External Audio Compatibility</h3>
          <p className="text-xs text-slate-400">
            Why web applications cannot arbitrarily capture Spotify or other system audio.
          </p>
        </div>
      </div>

      <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
        <div className="p-3.5 bg-[#080D1B] rounded-lg border border-slate-800 space-y-1">
          <div className="flex items-center gap-2 font-medium text-slate-200">
            <Music2 className="w-3.5 h-3.5 text-[#6C63FF]" />
            <span>Local Music Files (MP3, WAV, FLAC, M4A, OGG)</span>
          </div>
          <p className="text-slate-400">
            <strong>Supported:</strong> Fully decoded and scheduled via the browser's Web Audio API in-memory. Zero server uploads; private and instant with software delay buffers.
          </p>
        </div>

        <div className="p-3.5 bg-[#080D1B] rounded-lg border border-slate-800 space-y-1">
          <div className="flex items-center gap-2 font-medium text-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Spotify, Apple Music & DRM Streams</span>
          </div>
          <p className="text-slate-400">
            <strong>Restricted:</strong> Commercial streaming platforms protect audio streams via Widevine/PlayReady DRM and operating system sandboxes. A standard website cannot tap, duplicate, or capture audio playing in Spotify or third-party desktop apps.
          </p>
        </div>

        <div className="p-3.5 bg-[#080D1B] rounded-lg border border-slate-800 space-y-1">
          <div className="flex items-center gap-2 font-medium text-slate-200">
            <AlertCircle className="w-3.5 h-3.5 text-[#00D4FF]" />
            <span>Dual Bluetooth Audio Physical Broadcast</span>
          </div>
          <p className="text-slate-400">
            <strong>OS-Dependent:</strong> Physical simultaneous streaming to two Bluetooth A2DP devices requires operating-system level Bluetooth controllers (e.g., Samsung Dual Audio on One UI, macOS Multi-Output Aggregate Device in Audio MIDI Setup, or Windows stereo-mix mixers).
          </p>
        </div>
      </div>
    </div>
  );
};
