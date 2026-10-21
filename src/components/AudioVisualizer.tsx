/**
 * Real-time Audio Visualizer Component for DualSync BT.
 * Renders live frequency spectrum or oscilloscope waveform from Web Audio AnalyserNode.
 */

import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../services/audioEngine';

interface AudioVisualizerProps {
  isPlaying: boolean;
  className?: string;
  variant?: 'bars' | 'wave';
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isPlaying,
  className = '',
  variant = 'bars',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = audioEngine.getAnalyser();

    const bufferLength = analyser ? analyser.frequencyBinCount : 64;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);

      try {
        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        if (analyser && isPlaying) {
        if (variant === 'bars') {
          analyser.getByteFrequencyData(dataArray);

          const barCount = 36;
          const barWidth = (width / barCount) - 2;

          for (let i = 0; i < barCount; i++) {
            const dataIndex = Math.floor((i / barCount) * (bufferLength / 2));
            const value = dataArray[dataIndex] || 0;
            const barHeight = Math.max(3, (value / 255) * height * 0.9);
            const x = i * (barWidth + 2);
            const y = height - barHeight;

            // Gradient: primary #6C63FF to secondary #00D4FF
            const gradient = ctx.createLinearGradient(0, height, 0, 0);
            gradient.addColorStop(0, '#6C63FF');
            gradient.addColorStop(1, '#00D4FF');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            if (typeof (ctx as any).roundRect === 'function') {
              (ctx as any).roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
            } else {
              ctx.rect(x, y, barWidth, barHeight);
            }
            ctx.fill();
          }
        } else {
          analyser.getByteTimeDomainData(dataArray);

          ctx.lineWidth = 2;
          ctx.strokeStyle = '#00D4FF';
          ctx.beginPath();

          const sliceWidth = width / bufferLength;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * height) / 2;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }

            x += sliceWidth;
          }

          ctx.lineTo(width, height / 2);
          ctx.stroke();
        }
      } else {
        // Idle subtle waveform or bars
        const barCount = 36;
        const barWidth = (width / barCount) - 2;
        ctx.fillStyle = 'rgba(108, 99, 255, 0.2)';

        for (let i = 0; i < barCount; i++) {
          const x = i * (barWidth + 2);
          const idleHeight = 3 + Math.sin(i * 0.4) * 2;
          ctx.fillRect(x, height - idleHeight, barWidth, idleHeight);
        }
      }
    } catch (err) {
      // Canvas rendering or context lost error
      console.warn('AudioVisualizer render warning:', err);
    }
  };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, variant]);

  return (
    <div className={`relative overflow-hidden rounded-lg bg-[#080D1B]/80 border border-slate-800/80 p-2 ${className}`}>
      <canvas
        ref={canvasRef}
        width={320}
        height={56}
        className="w-full h-12 block"
      />
    </div>
  );
};
