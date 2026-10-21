/**
 * Latency calculation and formatting utility for DualSync BT
 */

export const MIN_LATENCY_MS = -500;
export const MAX_LATENCY_MS = 500;
export const LATENCY_STEP_MS = 10;

/**
 * Clamps latency to allowable range [-500, +500]
 */
export function clampLatency(latencyMs: number): number {
  if (isNaN(latencyMs)) return 0;
  return Math.min(MAX_LATENCY_MS, Math.max(MIN_LATENCY_MS, latencyMs));
}

/**
 * Formats latency in ms with explicit sign (e.g., "+120 ms", "-50 ms", "0 ms")
 */
export function formatLatency(latencyMs: number): string {
  const clamped = clampLatency(latencyMs);
  if (clamped > 0) return `+${clamped} ms`;
  return `${clamped} ms`;
}

export interface SoftwareDelayCalculation {
  d1DelaySeconds: number;
  d2DelaySeconds: number;
  relativeOffsetMs: number;
  explanation: string;
}

/**
 * Calculates real Web Audio DelayNode delay values (in seconds) for Device 1 and Device 2.
 * Audio delay nodes cannot be negative (cannot look into the future).
 * If Device 1 has negative delay (e.g. -50ms), we compensate by adding +50ms delay to Device 2.
 */
export function calculateSoftwareDelays(d1Ms: number, d2Ms: number): SoftwareDelayCalculation {
  const d1 = clampLatency(d1Ms);
  const d2 = clampLatency(d2Ms);

  // Find min delay to normalize base to 0
  const minVal = Math.min(d1, d2, 0);
  
  // Normalized positive software delays in milliseconds
  const d1SoftwareMs = d1 - minVal;
  const d2SoftwareMs = d2 - minVal;

  const d1DelaySeconds = Number((d1SoftwareMs / 1000).toFixed(4));
  const d2DelaySeconds = Number((d2SoftwareMs / 1000).toFixed(4));
  const relativeOffsetMs = d1 - d2;

  let explanation = '';
  if (d1 === 0 && d2 === 0) {
    explanation = 'Outputs are aligned with zero software delay compensation.';
  } else if (d1 > d2) {
    explanation = `Device 1 delayed by ${d1SoftwareMs} ms relative to Device 2 in software buffer.`;
  } else {
    explanation = `Device 2 delayed by ${d2SoftwareMs} ms relative to Device 1 in software buffer.`;
  }

  return {
    d1DelaySeconds,
    d2DelaySeconds,
    relativeOffsetMs,
    explanation,
  };
}
