/**
 * Web Audio Engine for DualSync BT.
 * Architected with real Web Audio API DSP pipeline:
 * Source -> Master Gain -> Split into Device 1 Branch (DelayNode1 + GainNode1) & Device 2 Branch (DelayNode2 + GainNode2) -> AnalyserNode -> Destination
 */

import { calculateEffectiveVolume } from '../utils/volume';
import { calculateSoftwareDelays } from '../utils/latency';

class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;

  // Web Audio Nodes
  private masterGainNode: GainNode | null = null;
  private device1GainNode: GainNode | null = null;
  private device2GainNode: GainNode | null = null;
  private device1DelayNode: DelayNode | null = null;
  private device2DelayNode: DelayNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private mergerNode: ChannelMergerNode | null = null;

  // Internal states
  private masterVol = 0.8;
  private d1Vol = 0.8;
  private d2Vol = 0.8;
  private d1LatencyMs = 0;
  private d2LatencyMs = 0;
  private isInitialized = false;

  constructor() {
    // Lazily initialized on user interaction to abide by browser Autoplay policy
  }

  public init(): void {
    if (this.isInitialized) return;
    if (typeof window === 'undefined') return;

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) {
        console.warn('Web Audio API not supported in this browser environment');
        return;
      }

      this.audioCtx = new AudioCtxClass();
      this.audioElement = new Audio();
      this.audioElement.crossOrigin = 'anonymous';

      // Create DSP nodes
      this.sourceNode = this.audioCtx.createMediaElementSource(this.audioElement);
      this.masterGainNode = this.audioCtx.createGain();
      
      // Delay nodes max delay 2.0s
      this.device1DelayNode = this.audioCtx.createDelay(2.0);
      this.device2DelayNode = this.audioCtx.createDelay(2.0);

      this.device1GainNode = this.audioCtx.createGain();
      this.device2GainNode = this.audioCtx.createGain();

      this.analyserNode = this.audioCtx.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.analyserNode.smoothingTimeConstant = 0.8;

      this.mergerNode = this.audioCtx.createChannelMerger(2);

      // Connect Graph:
      // source -> masterGain
      this.sourceNode.connect(this.masterGainNode);

      // Branch 1: masterGain -> d1Delay -> d1Gain -> mergerNode
      this.masterGainNode.connect(this.device1DelayNode);
      this.device1DelayNode.connect(this.device1GainNode);
      this.device1GainNode.connect(this.mergerNode, 0, 0);

      // Branch 2: masterGain -> d2Delay -> d2Gain -> mergerNode
      this.masterGainNode.connect(this.device2DelayNode);
      this.device2DelayNode.connect(this.device2GainNode);
      this.device2GainNode.connect(this.mergerNode, 0, 1);

      // mergerNode -> analyserNode -> destination
      this.mergerNode.connect(this.analyserNode);
      this.analyserNode.connect(this.audioCtx.destination);

      this.applyVolumes();
      this.applyDelays();

      this.isInitialized = true;
    } catch (err) {
      console.error('Failed to initialize AudioEngine:', err);
    }
  }

  public ensureAudioContext(): void {
    if (!this.isInitialized) {
      this.init();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public getAudioElement(): HTMLAudioElement | null {
    if (!this.isInitialized) {
      this.init();
    }
    return this.audioElement;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyserNode;
  }

  public setMasterVolume(vol: number): void {
    this.masterVol = vol;
    this.applyVolumes();
  }

  public setDevice1Volume(vol: number): void {
    this.d1Vol = vol;
    this.applyVolumes();
  }

  public setDevice2Volume(vol: number): void {
    this.d2Vol = vol;
    this.applyVolumes();
  }

  private applyVolumes(): void {
    if (!this.masterGainNode || !this.device1GainNode || !this.device2GainNode || !this.audioCtx) return;

    const effectiveD1 = calculateEffectiveVolume(1.0, this.d1Vol);
    const effectiveD2 = calculateEffectiveVolume(1.0, this.d2Vol);

    const now = this.audioCtx.currentTime;
    this.masterGainNode.gain.cancelScheduledValues(now);
    this.masterGainNode.gain.setValueAtTime(this.masterVol, now);

    this.device1GainNode.gain.cancelScheduledValues(now);
    this.device1GainNode.gain.setValueAtTime(effectiveD1, now);

    this.device2GainNode.gain.cancelScheduledValues(now);
    this.device2GainNode.gain.setValueAtTime(effectiveD2, now);
  }

  public setLatencies(d1Ms: number, d2Ms: number): void {
    this.d1LatencyMs = d1Ms;
    this.d2LatencyMs = d2Ms;
    this.applyDelays();
  }

  private applyDelays(): void {
    if (!this.device1DelayNode || !this.device2DelayNode || !this.audioCtx) return;

    const { d1DelaySeconds, d2DelaySeconds } = calculateSoftwareDelays(this.d1LatencyMs, this.d2LatencyMs);
    const now = this.audioCtx.currentTime;

    this.device1DelayNode.delayTime.cancelScheduledValues(now);
    this.device1DelayNode.delayTime.setValueAtTime(d1DelaySeconds, now);

    this.device2DelayNode.delayTime.cancelScheduledValues(now);
    this.device2DelayNode.delayTime.setValueAtTime(d2DelaySeconds, now);
  }

  /**
   * Sets sinkId for media element if supported by browser (e.g. Chrome on Windows/Linux/Android)
   */
  public async setAudioSink(sinkId: string): Promise<boolean> {
    if (!this.audioElement) return false;
    if ('setSinkId' in this.audioElement) {
      try {
        await (this.audioElement as any).setSinkId(sinkId);
        return true;
      } catch (err) {
        console.warn('Failed to set sinkId on HTMLAudioElement:', err);
        return false;
      }
    }
    return false;
  }

  /**
   * Generates a precise synchronization calibration test tone (sharp click + harmonic beep)
   * Plays through the delay and volume pipeline to allow the user to discern sync offsets.
   */
  public playCalibrationPulse(d1OffsetMs = 0, d2OffsetMs = 0): void {
    this.ensureAudioContext();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime + 0.05; // 50ms scheduling head
    const { d1DelaySeconds, d2DelaySeconds } = calculateSoftwareDelays(d1OffsetMs, d2OffsetMs);

    // Channel 1 Oscillator (Left / Device 1)
    const osc1 = this.audioCtx.createOscillator();
    const gain1 = this.audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now); // A5 note

    const d1Time = now + d1DelaySeconds;
    gain1.gain.setValueAtTime(0, d1Time);
    gain1.gain.linearRampToValueAtTime(0.4 * this.d1Vol * this.masterVol, d1Time + 0.005);
    gain1.gain.exponentialRampToValueAtTime(0.0001, d1Time + 0.12);

    osc1.connect(gain1);
    gain1.connect(this.audioCtx.destination);
    osc1.start(d1Time);
    osc1.stop(d1Time + 0.15);

    // Channel 2 Oscillator (Right / Device 2)
    const osc2 = this.audioCtx.createOscillator();
    const gain2 = this.audioCtx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(440, now); // A4 note

    const d2Time = now + d2DelaySeconds;
    gain2.gain.setValueAtTime(0, d2Time);
    gain2.gain.linearRampToValueAtTime(0.4 * this.d2Vol * this.masterVol, d2Time + 0.005);
    gain2.gain.exponentialRampToValueAtTime(0.0001, d2Time + 0.12);

    osc2.connect(gain2);
    gain2.connect(this.audioCtx.destination);
    osc2.start(d2Time);
    osc2.stop(d2Time + 0.15);
  }
}

export const audioEngine = new AudioEngine();
