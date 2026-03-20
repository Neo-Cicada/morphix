'use client';

import React from 'react';
import { Player } from '@remotion/player';
import type { PlayerRef } from '@remotion/player';

interface AnimationPlayerProps {
  Component: React.ComponentType | null;
  durationInFrames: number;
  fps: number;
  isCompiling: boolean;
  isStreaming: boolean;
  streamingChars?: number;
  error: string | null;
  playerRef?: React.RefObject<PlayerRef | null>;
}

// ─── Error helpers ─────────────────────────────────────────────────────────────

type ErrorCategory = 'syntax' | 'global' | 'component' | 'runtime';

function categorizeError(error: string): { label: string; type: ErrorCategory; hint: string } {
  if (/^(unknown:|SyntaxError:)/i.test(error) || error.includes('animation.tsx')) {
    return {
      label: 'Syntax Error',
      type: 'syntax',
      hint: 'Check for mismatched brackets, invalid JSX, or unsupported syntax.',
    };
  }
  if (error.includes('is not defined')) {
    const match = error.match(/(\w+) is not defined/);
    const name = match?.[1] ?? 'variable';
    return {
      label: 'Missing Global',
      type: 'global',
      hint: `"${name}" isn't injected. Available globals: React, Remotion exports, THREE, ThreeCanvas, Drei components.`,
    };
  }
  if (error.startsWith('No component found')) {
    return {
      label: 'No Component',
      type: 'component',
      hint: 'Define a React component — preferably named MyAnimation.',
    };
  }
  return {
    label: 'Runtime Error',
    type: 'runtime',
    hint: 'An error occurred while running the animation. Check your logic and data types.',
  };
}

function cleanMessage(error: string): string {
  return error
    .replace(/^unknown:\s*/i, '')
    .replace(/\(animation\.tsx\)/g, '')
    .trim();
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AnimationPlayer({
  Component,
  durationInFrames,
  fps,
  isCompiling,
  isStreaming,
  streamingChars = 0,
  error,
  playerRef,
}: AnimationPlayerProps) {
  const overlay = (() => {
    if (isStreaming) return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#111110] rounded-xl">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2.5 h-2.5 rounded-full animate-bounce" style={{
              animationDelay: `${i * 0.15}s`,
              background: '#C17B4F',
              boxShadow: '0 0 8px rgba(193,123,79,0.5)',
            }} />
          ))}
        </div>
        <p className="text-sm text-[#888884] animate-pulse tracking-wide">Generating animation...</p>
        {streamingChars > 0 && (
          <p className="text-[11px] text-[#3a3a38] tabular-nums">{streamingChars.toLocaleString()} chars</p>
        )}
      </div>
    );

    if (isCompiling) return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#111110] rounded-xl">
        <div className="w-9 h-9 rounded-full border-2 border-t-transparent animate-spin" style={{
          borderColor: '#B8652A', borderTopColor: 'transparent',
          boxShadow: '0 0 12px rgba(193,123,79,0.25)',
        }} />
        <p className="text-sm text-[#888884] tracking-wide">Compiling...</p>
      </div>
    );

    if (error) {
      const { label, type, hint } = categorizeError(error);
      const badgeColor: Record<ErrorCategory, string> = {
        syntax:    'bg-orange-950/60 border-orange-800/50 text-orange-400',
        global:    'bg-yellow-950/60 border-yellow-800/50 text-yellow-400',
        component: 'bg-[#1a1a18]   border-[#2e2e2c]   text-[#D4A574]',
        runtime:   'bg-red-950/60    border-red-800/50    text-red-400',
      };
      const dotColor: Record<ErrorCategory, string> = {
        syntax:    'bg-orange-500',
        global:    'bg-yellow-500',
        component: 'bg-[#C17B4F]',
        runtime:   'bg-red-500',
      };

      return (
        <div className="absolute inset-0 flex items-center justify-center bg-[#111110] rounded-xl p-6">
          <div className="w-full max-w-lg space-y-3">
            <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-wider ${badgeColor[type]}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${dotColor[type]}`} />
              {label}
            </div>
            <pre className="text-xs text-[#bbb] whitespace-pre-wrap break-all leading-relaxed bg-[#1a1a18] border border-[#2e2e2c] rounded-lg p-3 font-mono">
              {cleanMessage(error)}
            </pre>
            <p className="text-[11px] text-[#888884] leading-relaxed">{hint}</p>
          </div>
        </div>
      );
    }

    if (!Component) return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-8 bg-[#111110] rounded-xl">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{
          background: 'rgba(193,123,79,0.12)',
          border: '1px solid rgba(193,123,79,0.2)',
          boxShadow: '0 0 20px rgba(193,123,79,0.1)',
        }}>✨</div>
        <div>
          <p className="text-[#bbb] text-sm font-medium mb-1">Ready to create</p>
          <p className="text-[#888884] text-xs leading-relaxed">Describe your animation in the chat</p>
          <p className="text-[#3a3a38] text-[11px] mt-1.5">e.g. &ldquo;A title card that says Hello World with a fade-in&rdquo;</p>
        </div>
      </div>
    );

    return null;
  })();

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden">
      <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/5 pointer-events-none z-10" />

      {Component && !overlay ? (
        <Player
          ref={playerRef}
          component={Component}
          durationInFrames={Math.max(1, durationInFrames)}
          fps={fps}
          compositionWidth={1920}
          compositionHeight={1080}
          controls
          autoPlay
          loop
          style={{ width: '100%', borderRadius: '12px' }}
        />
      ) : overlay}
    </div>
  );
}
