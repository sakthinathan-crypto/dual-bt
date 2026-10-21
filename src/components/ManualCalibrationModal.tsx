/**
 * Manual Synchronization Calibration Modal for DualSync BT.
 * Implements a rigorous 6-step guided calibration flow with test tone pings and honest alignment.
 */

import React, { useState } from 'react';
import { X, Wand2, Volume2, ArrowRight, ArrowLeft, Check, RotateCcw, Headphones, Save } from 'lucide-react';
import { BTDeviceInfo } from '../types/bluetooth';
import { audioEngine } from '../services/audioEngine';
import { formatLatency, clampLatency } from '../utils/latency';

interface ManualCalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  device1: BTDeviceInfo | null;
  device2: BTDeviceInfo | null;
  d1LatencyMs: number;
  d2LatencyMs: number;
  onUpdateD1Latency: (ms: number) => void;
  onUpdateD2Latency: (ms: number) => void;
  onSaveProfile: () => void;
}

export const ManualCalibrationModal: React.FC<ManualCalibrationModalProps> = ({
  isOpen,
  onClose,
  device1,
  device2,
  d1LatencyMs,
  d2LatencyMs,
  onUpdateD1Latency,
  onUpdateD2Latency,
  onSaveProfile,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedEarlyDevice, setSelectedEarlyDevice] = useState<'device1' | 'device2' | 'synchronized' | 'cannot_hear' | null>(null);
  const [tempD1Latency, setTempD1Latency] = useState(d1LatencyMs);
  const [tempD2Latency, setTempD2Latency] = useState(d2LatencyMs);
  const [isPlayingTestTone, setIsPlayingTestTone] = useState(false);

  if (!isOpen) return null;

  const playTone = () => {
    setIsPlayingTestTone(true);
    audioEngine.playCalibrationPulse(tempD1Latency, tempD2Latency);
    setTimeout(() => setIsPlayingTestTone(false), 400);
  };

  const handleApplyNudge = (slot: 'device1' | 'device2', deltaMs: number) => {
    if (slot === 'device1') {
      const next = clampLatency(tempD1Latency + deltaMs);
      setTempD1Latency(next);
      onUpdateD1Latency(next);
    } else {
      const next = clampLatency(tempD2Latency + deltaMs);
      setTempD2Latency(next);
      onUpdateD2Latency(next);
    }
  };

  const handleNext = () => {
    if (currentStep === 3) {
      if (selectedEarlyDevice === 'device1') {
        // Device 1 is earlier -> add delay to Device 1 to bring it back
        handleApplyNudge('device1', 30);
      } else if (selectedEarlyDevice === 'device2') {
        // Device 2 is earlier -> add delay to Device 2
        handleApplyNudge('device2', 30);
      }
    }
    setCurrentStep((prev) => Math.min(6, prev + 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleFinishSave = () => {
    onUpdateD1Latency(tempD1Latency);
    onUpdateD2Latency(tempD2Latency);
    onSaveProfile();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#141B2D] border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Close calibration"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#6C63FF]/20 text-[#6C63FF] flex items-center justify-center">
            <Wand2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block">
              Step {currentStep} of 6
            </span>
            <h2 className="text-lg font-bold text-white">Manual Latency Calibration</h2>
          </div>
        </div>

        {/* Step Progress Line */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#6C63FF] to-[#00D4FF] h-full transition-all duration-300"
            style={{ width: `${(currentStep / 6) * 100}%` }}
          />
        </div>

        {/* Step 1: Preparation */}
        {currentStep === 1 && (
          <div className="space-y-4 py-2">
            <div className="p-4 bg-[#080D1B] rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
                <Headphones className="w-4 h-4 text-[#00D4FF]" />
                <span>Prepare to Listen to Both Outputs</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Position yourself equidistant between both Bluetooth audio speakers or put in both earbuds.
                Because browsers cannot automatically probe physical acoustic output without unrestricted microphone access, this honest listening test lets your ears achieve microsecond-precise alignment.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Device 1 Slot:</span>
                <span className="font-semibold text-slate-200 truncate block">
                  {device1?.name || 'Device 1 (Software Channel)'}
                </span>
              </div>
              <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Device 2 Slot:</span>
                <span className="font-semibold text-slate-200 truncate block">
                  {device2?.name || 'Device 2 (Software Channel)'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Test Tone */}
        {currentStep === 2 && (
          <div className="space-y-4 py-2">
            <p className="text-xs text-slate-300 leading-relaxed">
              Click <strong>Play Calibration Tone</strong> to hear a synthesized harmonic pulse (880 Hz / 440 Hz) sent through the software delay pipelines.
            </p>

            <div className="py-6 flex flex-col items-center justify-center space-y-3 bg-[#080D1B] rounded-xl border border-slate-800">
              <button
                onClick={playTone}
                disabled={isPlayingTestTone}
                className="w-16 h-16 rounded-full bg-gradient-to-r from-[#6C63FF] to-[#00D4FF] hover:scale-105 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-[#6C63FF]/30 transition-all cursor-pointer"
                title="Play test tone"
              >
                <Volume2 className={`w-7 h-7 ${isPlayingTestTone ? 'animate-bounce' : ''}`} />
              </button>
              <span className="text-xs font-mono text-slate-400">
                {isPlayingTestTone ? 'Playing Pulse...' : 'Click to Play Tone'}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 text-center">
              Listen carefully: Do you hear an echo or flanging effect, or does one speaker chime first?
            </p>
          </div>
        )}

        {/* Step 3: Question */}
        {currentStep === 3 && (
          <div className="space-y-4 py-2">
            <div className="text-sm font-semibold text-white">
              Which device sounds earlier?
            </div>
            <p className="text-xs text-slate-400">
              Select the device that produces the initial click or leading edge:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'device1', label: `Device 1 (${device1?.name || 'Left / Primary'})` },
                { id: 'device2', label: `Device 2 (${device2?.name || 'Right / Secondary'})` },
                { id: 'synchronized', label: 'They sound synchronized' },
                { id: 'cannot_hear', label: 'Cannot hear both outputs' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedEarlyDevice(opt.id as any)}
                  className={`p-3 text-left rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                    selectedEarlyDevice === opt.id
                      ? 'border-[#00D4FF] bg-[#00D4FF]/10 text-white shadow-sm'
                      : 'border-slate-800 bg-[#080D1B] text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Fine-tune Latency Slider */}
        {currentStep === 4 && (
          <div className="space-y-4 py-2">
            <p className="text-xs text-slate-300">
              Adjust the latency offset in milliseconds to balance the acoustic propagation:
            </p>

            <div className="space-y-3">
              <div className="p-3 bg-[#080D1B] rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium">Device 1 Latency:</span>
                  <span className="font-mono text-[#00D4FF] font-bold">
                    {formatLatency(tempD1Latency)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApplyNudge('device1', -10)}
                    className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded text-xs hover:bg-slate-700"
                  >
                    -10ms
                  </button>
                  <input
                    type="range"
                    min="-500"
                    max="500"
                    step="10"
                    value={tempD1Latency}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setTempD1Latency(v);
                      onUpdateD1Latency(v);
                    }}
                    className="w-full accent-[#6C63FF]"
                  />
                  <button
                    onClick={() => handleApplyNudge('device1', 10)}
                    className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded text-xs hover:bg-slate-700"
                  >
                    +10ms
                  </button>
                </div>
              </div>

              <div className="p-3 bg-[#080D1B] rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium">Device 2 Latency:</span>
                  <span className="font-mono text-[#6C63FF] font-bold">
                    {formatLatency(tempD2Latency)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApplyNudge('device2', -10)}
                    className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded text-xs hover:bg-slate-700"
                  >
                    -10ms
                  </button>
                  <input
                    type="range"
                    min="-500"
                    max="500"
                    step="10"
                    value={tempD2Latency}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setTempD2Latency(v);
                      onUpdateD2Latency(v);
                    }}
                    className="w-full accent-[#6C63FF]"
                  />
                  <button
                    onClick={() => handleApplyNudge('device2', 10)}
                    className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded text-xs hover:bg-slate-700"
                  >
                    +10ms
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={playTone}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg inline-flex items-center gap-2"
              >
                <Volume2 className="w-3.5 h-3.5 text-[#00D4FF]" />
                <span>Test New Alignment</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Repeat / Verify Test */}
        {currentStep === 5 && (
          <div className="space-y-4 py-2 text-center">
            <h4 className="text-base font-semibold text-white">Verification Test</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Play the tone once more to confirm that the sound hits both ears in crisp unison without noticeable phase lag or hollow echo.
            </p>

            <div className="py-4">
              <button
                onClick={playTone}
                className="w-14 h-14 mx-auto rounded-full bg-slate-800 hover:bg-slate-700 text-emerald-400 flex items-center justify-center border border-slate-700 shadow-md"
              >
                <Volume2 className="w-6 h-6" />
              </button>
            </div>

            <div className="text-xs text-slate-300">
              Current Software Latency Offsets:
              <span className="font-mono tabular-nums text-slate-200 font-bold ml-1">
                D1: {formatLatency(tempD1Latency)} · D2: {formatLatency(tempD2Latency)}
              </span>
            </div>
          </div>
        )}

        {/* Step 6: Save Configuration */}
        {currentStep === 6 && (
          <div className="space-y-4 py-2">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <Check className="w-4 h-4" />
                <span>Calibration Ready to Save</span>
              </div>
              <p className="text-emerald-200/90 leading-relaxed">
                Your tuned latency compensation values will be applied to the Web Audio DSP DelayNodes and saved to persistent device profiles in localStorage.
              </p>
            </div>

            <div className="p-3 bg-[#080D1B] rounded-lg border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Device 1 Final Latency:</span>
                <span className="font-mono text-[#00D4FF] font-semibold">{formatLatency(tempD1Latency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Device 2 Final Latency:</span>
                <span className="font-mono text-[#6C63FF] font-semibold">{formatLatency(tempD2Latency)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Modal Navigation Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          {currentStep > 1 ? (
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 6 ? (
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-gradient-to-r from-[#6C63FF] to-[#00D4FF] hover:opacity-95 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 shadow-md shadow-[#6C63FF]/20 transition-all"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleFinishSave}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Configuration</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
