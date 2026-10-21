/**
 * Volume Slider Component for DualSync BT.
 * Displays title, numeric percentage (tabular-nums), and smooth range slider.
 */

import React from 'react';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';
import { formatVolumePercent, clampVolume } from '../utils/volume';

interface VolumeSliderProps {
  label: string;
  volume: number; // 0.0 to 1.0
  onChange: (newVolume: number) => void;
  subtitle?: string;
  disabled?: boolean;
}

export const VolumeSlider: React.FC<VolumeSliderProps> = ({
  label,
  volume,
  onChange,
  subtitle,
  disabled = false,
}) => {
  const percent = Math.round(clampVolume(volume) * 100);

  const getIcon = () => {
    if (percent === 0) return <VolumeX className="w-4 h-4 text-slate-500" />;
    if (percent < 50) return <Volume1 className="w-4 h-4 text-[#00D4FF]" />;
    return <Volume2 className="w-4 h-4 text-[#6C63FF]" />;
  };

  return (
    <div className={`space-y-1.5 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-medium text-slate-200">
          {getIcon()}
          <span>{label}</span>
        </div>
        <span className="font-mono tabular-nums text-slate-300 font-semibold text-xs">
          {formatVolumePercent(volume)}
        </span>
      </div>

      <div className="relative flex items-center">
        <input
          type="range"
          min="0"
          max="100"
          value={percent}
          onChange={(e) => onChange(Number(e.target.value) / 100)}
          className="w-full cursor-pointer accent-[#6C63FF]"
          aria-label={label}
        />
      </div>

      {subtitle && (
        <p className="text-[11px] text-slate-400 leading-tight">
          {subtitle}
        </p>
      )}
    </div>
  );
};
