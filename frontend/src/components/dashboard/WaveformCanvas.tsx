'use client';

import React, { useRef, useEffect } from 'react';

interface WaveformCanvasProps {
  waveform: number[];
  color?: string;
  width: number;
  height: number;
}

export function WaveformCanvas({ waveform, color = '#22c55e', width, height }: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || waveform.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = color + '99';

    const barWidth = width / waveform.length;
    const midY = height / 2;

    waveform.forEach((amp, i) => {
      const barH = Math.max(2, amp * height);
      ctx.fillRect(i * barWidth, midY - barH / 2, Math.max(1, barWidth - 0.5), barH);
    });
  }, [waveform, color, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    />
  );
}
