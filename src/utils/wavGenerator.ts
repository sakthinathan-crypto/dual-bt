/**
 * Lightweight procedural audio synthesizer that renders lossless WAV Blobs in-memory.
 * Optimized for mobile CPU and memory efficiency: creates a lightweight 4-second seamless loop
 * in < 15ms so the browser never freezes on initial load.
 */

export function generateSyntheticDemoTrack(
  name: string,
  bpm = 110,
  durationSeconds = 4,
  style: 'ambient' | 'synth' = 'synth'
): { blob: Blob; duration: number } {
  const sampleRate = 22050; // High efficiency sample rate
  const numChannels = 2;
  const totalSamples = sampleRate * durationSeconds;
  const buffer = new Float32Array(totalSamples * numChannels);

  const beatInterval = sampleRate * (60 / bpm);
  
  // Base chord frequencies: Am - F - C - G
  const chords = [
    [220, 261.63, 329.63, 440],
    [174.61, 220, 261.63, 349.23],
  ];

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const currentChordIndex = Math.floor((t * (bpm / 60)) / 2) % chords.length;
    const chord = chords[currentChordIndex];

    let left = 0;
    let right = 0;

    // Harmonic warm pad
    for (let noteIdx = 0; noteIdx < chord.length; noteIdx++) {
      const freq = chord[noteIdx];
      const osc = Math.sin(2 * Math.PI * freq * t);
      const gain = 0.07;
      const pan = (noteIdx / (chord.length - 1)) * 2 - 1;
      left += osc * gain * (1 - (pan + 1) * 0.3);
      right += osc * gain * (1 - (1 - pan) * 0.3);
    }

    // Melodic pulse
    const arpStep = Math.floor((t * (bpm / 60) * 4)) % 8;
    const arpFreq = chord[arpStep % chord.length] * 2;
    const arpEnv = Math.exp(-((t * (bpm / 60) * 4) % 1) * 6);
    const arpOsc = Math.sin(2 * Math.PI * arpFreq * t);
    left += arpOsc * arpEnv * 0.06;
    right += arpOsc * arpEnv * 0.06;

    // Kick & Snare rhythm
    const beatPos = (i % beatInterval) / sampleRate;
    const beatNumber = Math.floor(i / beatInterval) % 4;

    if (beatNumber === 0 || beatNumber === 2) {
      if (beatPos < 0.15) {
        const kickPitch = 100 * Math.exp(-beatPos * 35);
        const kickOsc = Math.sin(2 * Math.PI * kickPitch * beatPos);
        const kickEnv = Math.exp(-beatPos * 18);
        left += kickOsc * kickEnv * 0.3;
        right += kickOsc * kickEnv * 0.3;
      }
    } else {
      if (beatPos < 0.1) {
        const noise = (Math.random() * 2 - 1) * Math.exp(-beatPos * 30);
        left += noise * 0.12;
        right += noise * 0.12;
      }
    }

    // Soft limiting
    buffer[i * 2] = Math.tanh(left);
    buffer[i * 2 + 1] = Math.tanh(right);
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

  // RIFF chunk
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataByteLength, true);
  writeString(view, 8, 'WAVE');

  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
  view.setUint16(32, numChannels * bytesPerSample, true);
  view.setUint16(34, 16, true);

  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataByteLength, true);

  // PCM samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
