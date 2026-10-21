/**
 * Latency Compensation Slider Component for DualSync BT.
 * Configurable from -500ms to +500ms with fine steps, numeric input, and software delay estimation.
 */

import React from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { formatLatency, clampLatency, MIN_LATENCY_MS, MAX_LATENCY_MS } from '../utils/latency';

interface LatencySliderProps {
  label: string;
  latencyMs: number;
  onChange: (newLatencyMs: number) => void;
  onReset?: () => void;
  estimatedSoftwareDelaySec?: number;
  disabled?: boolean;
}

export const LatencySlider: React.FC<LatencySliderProps> = ({
  label,
  latencyMs,
  onChange,
  onReset,
  estimatedSoftwareDelaySec = 0,
  disabled = false,
}) => {
  const handleNudge = (delta: number) => {
    onChange(clampLatency(latencyMs + delta));
  };

  const softwareDelayMs = Math.round(estimatedSoftwareDelaySec * 1000);

  return (
    <div className={`p-3 rounded-lg bg-[#0B1020]/70 border border-slate-800/80 space-y-2.5 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-medium text-slate-200">{label}</span>
          <span className="text-[11px] text-slate-400 block">
            Latency Compensation
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono tabular-nums text-sm font-semibold text-[#00D4FF] bg-[#141B2D] px-2 py-0.5 rounded border border-slate-700">
            {formatLatency(latencyMs)}
          </span>
          {onReset && (
            <button
              onClick={onReset}
              title="Reset to 0 ms"
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => handleNudge(-10)}
          className="w-7 h-7 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors shrink-0"
          title="-10 ms"
          aria-label="Decrease latency by 10 ms"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <input
          type="range"
          min={MIN_LATENCY_MS}
          max={MAX_LATENCY_MS}
          step="10"
          value={latencyMs}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full cursor-pointer accent-[#6C63FF]"
          aria-label={`${label} latency slider`}
        />

        <button
          onClick={() => handleNudge(10)}
          className="w-7 h-7 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors shrink-0"
          title="+10 ms"
          aria-label="Increase latency by 10 ms"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5 border-t border-slate-800/60 font-mono tabular-nums">
        <span>Estimated software delay:</span>
        <span className="text-slate-300 font-medium">{softwareDelayMs} ms</span>
      </div>
    </div>
  );
};
