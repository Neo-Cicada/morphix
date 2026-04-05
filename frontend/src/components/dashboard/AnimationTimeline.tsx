'use client';

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import type { PlayerRef } from '@remotion/player';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Sequence {
  from: number;
  duration: number;
}

interface AnimationTimelineProps {
  playerRef: React.RefObject<PlayerRef | null>;
  durationInFrames: number;
  fps: number;
  code: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LANE_COLORS = ['#C17B4F', '#5c9e53', '#4F7BC1', '#9e5c7a', '#c1b04f', '#4fc1a0'];

function parseSequences(code: string): Sequence[] {
  const results: Sequence[] = [];
  // Match opening <Sequence tags (may be self-closing or open, multiline)
  const tagRe = /<Sequence\b([\s\S]*?)(?:\/?>)/g;
  let m;
  while ((m = tagRe.exec(code)) !== null) {
    const attrs = m[1];
    const fromM = attrs.match(/from=\{(\d+)\}/);
    const durM = attrs.match(/durationInFrames=\{(\d+)\}/);
    if (fromM && durM) {
      results.push({ from: parseInt(fromM[1]), duration: parseInt(durM[1]) });
    }
  }
  return results;
}

function formatTime(frame: number, fps: number): string {
  const s = frame / fps;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  const rem = Math.round(s % 60).toString().padStart(2, '0');
  return `${m}:${rem}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AnimationTimeline({ playerRef, durationInFrames, fps, code }: AnimationTimelineProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Sync with Remotion Player events
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    const onFrame = (e: { detail: { frame: number } }) => setCurrentFrame(e.detail.frame);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    player.addEventListener('frameupdate', onFrame);
    player.addEventListener('play', onPlay);
    player.addEventListener('pause', onPause);
    return () => {
      player.removeEventListener('frameupdate', onFrame);
      player.removeEventListener('play', onPlay);
      player.removeEventListener('pause', onPause);
    };
  }, [playerRef]);

  // Reset when new animation is generated
  useEffect(() => {
    setCurrentFrame(0);
    setIsPlaying(false);
  }, [code]);

  const seekToClientX = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track || !playerRef.current) return;
    const { left, width } = track.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - left, width));
    const frame = Math.round((x / width) * Math.max(1, durationInFrames - 1));
    playerRef.current.seekTo(frame);
    setCurrentFrame(frame);
  }, [durationInFrames, playerRef]);

  const handleTrackMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    playerRef.current?.pause();
    seekToClientX(e.clientX);
  }, [seekToClientX, playerRef]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (isDragging.current) seekToClientX(e.clientX); };
    const onUp = () => { isDragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [seekToClientX]);

  const sequences = useMemo(() => parseSequences(code), [code]);

  // Compute tick label positions (max ~8 labels)
  const labelInterval = Math.max(fps, Math.ceil(durationInFrames / 8 / fps) * fps);
  const labels: number[] = [];
  for (let f = 0; f <= durationInFrames; f += labelInterval) labels.push(f);
  if (labels[labels.length - 1] !== durationInFrames) labels.push(durationInFrames);

  const progress = durationInFrames > 1 ? currentFrame / (durationInFrames - 1) : 0;

  const togglePlay = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    isPlaying ? p.pause() : p.play();
  }, [playerRef, isPlaying]);

  return (
    <div className="shrink-0 border-t border-[#2e2e2c]/60 bg-[#111110] px-3 pt-2 pb-2.5 select-none">

      {/* ── Scrub row ── */}
      <div className="flex items-center gap-2">

        {/* Play / Pause */}
        <button
          onClick={togglePlay}
          className="w-6 h-6 flex items-center justify-center rounded text-[#888884] hover:text-[#FAFAF7] hover:bg-[#1f1f1d] transition-colors shrink-0"
        >
          {isPlaying ? (
            <svg viewBox="0 0 14 14" fill="currentColor" className="w-3 h-3">
              <rect x="2" y="1" width="3.5" height="12" rx="1" />
              <rect x="8.5" y="1" width="3.5" height="12" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 14 14" fill="currentColor" className="w-3 h-3">
              <path d="M3 1.5l9 5.5-9 5.5V1.5z" />
            </svg>
          )}
        </button>

        {/* Current time */}
        <span className="text-[10px] text-[#C17B4F] tabular-nums w-9 shrink-0 font-mono">
          {formatTime(currentFrame, fps)}
        </span>

        {/* Track */}
        <div className="flex-1 relative" style={{ height: 22 }}>
          {/* Tick labels */}
          <div className="absolute top-0 inset-x-0 pointer-events-none" style={{ height: 10 }}>
            {labels.map((f) => (
              <div
                key={f}
                className="absolute flex flex-col items-center"
                style={{ left: `${(f / durationInFrames) * 100}%`, transform: 'translateX(-50%)' }}
              >
                <div className="w-px h-1.5 bg-[#2e2e2c]" />
                <span className="text-[8.5px] text-[#3a3a38] tabular-nums mt-px leading-none">
                  {formatTime(f, fps)}
                </span>
              </div>
            ))}
          </div>

          {/* Scrub bar */}
          <div
            ref={trackRef}
            className="absolute bottom-0 inset-x-0 rounded-full cursor-pointer"
            style={{ height: 5, background: '#1e1e1c' }}
            onMouseDown={handleTrackMouseDown}
          >
            {/* Filled portion */}
            <div
              className="absolute inset-y-0 left-0 rounded-full pointer-events-none"
              style={{ width: `${progress * 100}%`, background: 'rgba(193,123,79,0.45)' }}
            />

            {/* Playhead knob */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full pointer-events-none"
              style={{
                left: `${progress * 100}%`,
                width: 11,
                height: 11,
                background: '#C17B4F',
                border: '2px solid #E8935E',
                boxShadow: '0 0 6px rgba(193,123,79,0.7)',
              }}
            />
          </div>
        </div>

        {/* Total duration */}
        <span className="text-[10px] text-[#3a3a38] tabular-nums w-9 text-right shrink-0 font-mono">
          {formatTime(durationInFrames, fps)}
        </span>
      </div>

      {/* ── Sequence lanes ── */}
      {sequences.length > 0 && (
        <div className="mt-2 flex flex-col gap-1 pl-[3.75rem] pr-[2.75rem]">
          {sequences.map((seq, i) => {
            const leftPct = (seq.from / durationInFrames) * 100;
            const widthPct = Math.min((seq.duration / durationInFrames) * 100, 100 - leftPct);
            const color = LANE_COLORS[i % LANE_COLORS.length];
            return (
              <div
                key={i}
                className="relative rounded-sm overflow-hidden"
                style={{ height: 8, background: '#1a1a18' }}
              >
                <div
                  className="absolute inset-y-0 rounded-sm"
                  style={{
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                    background: `${color}30`,
                    borderLeft: `2px solid ${color}99`,
                    borderRight: `1px solid ${color}50`,
                  }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
