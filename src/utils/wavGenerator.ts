/**
 * Lightweight procedural audio synthesizer that renders lossless WAV Blobs in-memory.
 * Used for built-in sample demo tracks so users can immediately test audio playback,
 * visualizers, and synchronization without needing to upload files first.
 */

export function generateSyntheticDemoTrack(
  name: string,
  bpm = 110,
  durationSeconds = 18,
  style: 'ambient' | 'synth' | 'percussion' = 'synth'
): { blob: Blob; duration: number } {
  const sampleRate = 44100;
  const numChannels = 2;
  const totalSamples = sampleRate * durationSeconds;
  const buffer = new Float32Array(totalSamples * numChannels);

  const beatInterval = sampleRate * (60 / bpm);
  
  // Base chord frequencies
  const chords = [
    [220, 277.18, 329.63, 440], // A minor
    [174.61, 220, 261.63, 349.23], // F major
    [130.81, 164.81, 196, 261.63], // C major
    [196, 246.94, 293.66, 392], // G major
  ];

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const currentChordIndex = Math.floor((t * (bpm / 60)) / 4) % chords.length;
    const chord = chords[currentChordIndex];

    let left = 0;
    let right = 0;

    if (style === 'synth' || style === 'ambient') {
      // Harmonic pad
      for (let noteIdx = 0; noteIdx < chord.length; noteIdx++) {
        const freq = chord[noteIdx];
        const osc = Math.sin(2 * Math.PI * freq * t);
        const lfo = 0.6 + 0.4 * Math.sin(2 * Math.PI * 0.5 * t + noteIdx);
        const gain = 0.08 * lfo;
        
        // Panned slightly
        const pan = (noteIdx / (chord.length - 1)) * 2 - 1; // -1 to 1
        left += osc * gain * (1 - (pan + 1) * 0.4);
        right += osc * gain * (1 - (1 - pan) * 0.4);
      }

      // Arpeggio
      const arpStep = Math.floor((t * (bpm / 60) * 4)) % 8;
      const arpFreq = chord[arpStep % chord.length] * 2;
      const arpEnv = Math.exp(-((t * (bpm / 60) * 4) % 1) * 6);
      const arpOsc = Math.sin(2 * Math.PI * arpFreq * t);
      left += arpOsc * arpEnv * 0.07;
      right += Math.sin(2 * Math.PI * arpFreq * 1.002 * t) * arpEnv * 0.07;
    }

    // Beat / Kick & Snare
    const beatPos = (i % beatInterval) / sampleRate;
    const beatNumber = Math.floor(i / beatInterval) % 4;

    if (beatNumber === 0 || beatNumber === 2) {
      // Kick drum
      if (beatPos < 0.2) {
        const kickPitch = 120 * Math.exp(-beatPos * 30);
        const kickOsc = Math.sin(2 * Math.PI * kickPitch * beatPos);
        const kickEnv = Math.exp(-beatPos * 14);
        left += kickOsc * kickEnv * 0.35;
        right += kickOsc * kickEnv * 0.35;
      }
    }

    if (beatNumber === 1 || beatNumber === 3) {
      // Snare / Clap
      if (beatPos < 0.15) {
        const noise = (Math.random() * 2 - 1) * Math.exp(-beatPos * 25);
        const body = Math.sin(2 * Math.PI * 220 * beatPos) * Math.exp(-beatPos * 18);
        const snareVal = (noise * 0.25 + body * 0.15);
        left += snareVal;
        right += snareVal;
      }
    }

    // Hi-hat on 8th notes
    const eighthInterval = beatInterval / 2;
    const hatPos = (i % eighthInterval) / sampleRate;
    if (hatPos < 0.04) {
      const hat = (Math.random() * 2 - 1) * Math.exp(-hatPos * 90) * 0.08;
      left += hat * 0.7;
      right += hat * 1.0;
    }

    // Master limiting / soft clipping
    left = Math.tanh(left);
    right = Math.tanh(right);

    buffer[i * 2] = left;
    buffer[i * 2 + 1] = right;
  }

  const wavBlob = encodeWavBlob(buffer, sampleRate, numChannels);
  return {
    blob: wavBlob,
    duration: durationSeconds,
  };
}

function encodeWavBlob(samples: Float32Array, sampleRate: number, numChannels: number): Blob {
  const bytesPerSample = 2; // 16-bit PCM
  const dataByteLength = samples.length * bytesPerSample;
  const headerByteLength = 44;
  const totalLength = headerByteLength + dataByteLength;
  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataByteLength, true);
  writeString(view, 8, 'WAVE');

  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true); // ByteRate
  view.setUint16(32, numChannels * bytesPerSample, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample

  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataByteLength, true);

  // PCM samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
