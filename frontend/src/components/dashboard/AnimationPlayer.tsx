'use client';

import React from 'react';
import { Player } from '@remotion/player';
import { Audio, useCurrentFrame, useVideoConfig } from 'remotion';
import type { PlayerRef } from '@remotion/player';

interface AnimationPlayerProps {
  Component: React.ComponentType | null;
  durationInFrames: number;
  fps: number;
  isCompiling: boolean;
  isStreaming: boolean;
  streamingChars?: number;
  error: string | null;
  onFixError?: () => void;
  isFixingError?: boolean;
  playerRef?: React.RefObject<PlayerRef | null>;
  audioUrl?: string | null;
  voiceUrl?: string | null;
  musicVolume?: number;
  voiceScript?: string | null;
  voiceDurationSeconds?: number | null;
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

function SubtitleOverlay({ script, voiceDurationSeconds }: { script: string; voiceDurationSeconds: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = script.trim().split(/\s+/);
  const totalVoiceFrames = voiceDurationSeconds * fps;
  const progress = Math.min(frame / totalVoiceFrames, 1);
  // Show ~5 words at a time around the current position
  const activeIndex = Math.min(Math.floor(progress * words.length), words.length - 1);
  const windowStart = Math.max(0, activeIndex - 2);
  const windowEnd = Math.min(words.length, windowStart + 7);
  const visibleWords = words.slice(windowStart, windowEnd);

  return (
    <div style={{
      position: 'absolute',
      bottom: 48,
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '0 10px',
      padding: '0 80px',
      pointerEvents: 'none',
    }}>
      {visibleWords.map((word, i) => {
        const globalIndex = windowStart + i;
        const isActive = globalIndex === activeIndex;
        return (
          <span key={globalIndex} style={{
            fontSize: 48,
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: isActive ? 700 : 400,
            color: isActive ? '#ffffff' : 'rgba(255,255,255,0.55)',
            textShadow: isActive
              ? '0 2px 12px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,1)'
              : '0 1px 6px rgba(0,0,0,0.8)',
            transition: 'color 0.1s, font-weight 0.1s',
          }}>
            {word}
          </span>
        );
      })}
    </div>
  );
}

export function AnimationPlayer({
  Component,
  durationInFrames,
  fps,
  isCompiling,
  isStreaming,
  streamingChars = 0,
  error,
  onFixError,
  isFixingError = false,
  playerRef,
  audioUrl,
  voiceUrl,
  musicVolume = 0.4,
  voiceScript,
  voiceDurationSeconds,
}: AnimationPlayerProps) {
  // Wrap the animation with audio — same pattern as DynamicComposition on Lambda
  const CompositionWithAudio = React.useMemo(() => {
    if (!Component) return null;
    const hasAudio = audioUrl || voiceUrl;
    const hasSubtitle = voiceUrl && voiceScript && voiceDurationSeconds;
    if (!hasAudio && !hasSubtitle) return Component;
    return function AudioWrapper() {
      return (
        <>
          {audioUrl && <Audio src={audioUrl} volume={musicVolume} crossOrigin="anonymous" />}
          {voiceUrl && <Audio src={voiceUrl} crossOrigin="anonymous" />}
          <Component />
          {hasSubtitle && (
            <SubtitleOverlay script={voiceScript!} voiceDurationSeconds={voiceDurationSeconds!} />
          )}
        </>
      );
    };
  }, [Component, audioUrl, voiceUrl, musicVolume, voiceScript, voiceDurationSeconds]);
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
            {onFixError && (
              <button
                onClick={onFixError}
                disabled={isFixingError}
                className="mt-1 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-[#1e1e1c] border border-[#3a3a38] text-[#C17B4F] hover:bg-[#252523] hover:border-[#C17B4F]/40"
              >
                {isFixingError ? (
                  <>
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Fixing...
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Fix with AI
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      );
    }

    if (!CompositionWithAudio) return (
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

      {CompositionWithAudio && !overlay ? (
        <Player
          ref={playerRef}
          component={CompositionWithAudio}
          durationInFrames={Math.max(1, durationInFrames)}
          fps={fps}
          compositionWidth={1920}
          compositionHeight={1080}
          controls
          loop
          numberOfSharedAudioTags={5}
          style={{ width: '100%', borderRadius: '12px' }}
        />
      ) : overlay}
    </div>
  );
}
