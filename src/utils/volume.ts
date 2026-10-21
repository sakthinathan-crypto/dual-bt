/**
 * Volume calculations and formatting utility for DualSync BT
 */

/**
 * Clamps volume to valid range [0, 1]
 */
export function clampVolume(volume: number): number {
  if (isNaN(volume)) return 0;
  return Math.min(1, Math.max(0, volume));
}

/**
 * Calculates effective volume product: Master Volume * Device Volume
 */
export function calculateEffectiveVolume(masterVolume: number, deviceVolume: number): number {
  const master = clampVolume(masterVolume);
  const device = clampVolume(deviceVolume);
  return Number((master * device).toFixed(4));
}

/**
 * Formats a volume fraction (0.0 - 1.0) into human percentage (e.g. "80%")
 */
export function formatVolumePercent(volume: number): string {
  const clamped = clampVolume(volume);
  return `${Math.round(clamped * 100)}%`;
}

/**
 * Converts percentage string or number (0 - 100) to fraction (0.0 - 1.0)
 */
export function percentToFraction(percent: number): number {
  return clampVolume(percent / 100);
}
