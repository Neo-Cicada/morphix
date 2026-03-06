'use client';

import React from 'react';
import { Player } from '@remotion/player';

interface AnimationPlayerProps {
  Component: React.ComponentType | null;
  durationInFrames: number;
  fps: number;
  isCompiling: boolean;
  isStreaming: boolean;
  error: string | null;
}

export function AnimationPlayer({
  Component,
  durationInFrames,
  fps,
  isCompiling,
  isStreaming,
  error,
}: AnimationPlayerProps) {
  const renderContent = () => {
    if (isStreaming) {
      return (
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 rounded-full animate-bounce"
                style={{
                  animationDelay: `${i * 0.15}s`,
                  background: 'linear-gradient(135deg, #3b82f6, #7c3aed)',
                  boxShadow: '0 0 8px rgba(99, 102, 241, 0.5)',
                }}
              />
            ))}
          </div>
          <p className="text-sm text-zinc-500 animate-pulse tracking-wide">Generating animation...</p>
        </div>
      );
    }

    if (isCompiling) {
      return (
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-9 h-9 rounded-full border-2 border-t-transparent animate-spin"
            style={{
              borderColor: '#7c3aed',
              borderTopColor: 'transparent',
              boxShadow: '0 0 12px rgba(124, 58, 237, 0.3)',
            }}
          />
          <p className="text-sm text-zinc-500 tracking-wide">Compiling...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="w-full max-w-lg mx-auto p-4 bg-red-950/30 border border-red-900/50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">Compile Error</p>
          </div>
          <pre className="text-xs text-red-300/80 whitespace-pre-wrap break-all leading-relaxed">{error}</pre>
        </div>
      );
    }

    if (!Component) {
      return (
        <div className="flex flex-col items-center gap-4 text-center px-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(124,58,237,0.15))',
              border: '1px solid rgba(99,102,241,0.2)',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.1)',
            }}
          >
            ✨
          </div>
          <div>
            <p className="text-zinc-300 text-sm font-medium mb-1">Ready to create</p>
            <p className="text-zinc-500 text-xs leading-relaxed">
              Describe your animation in the chat below
            </p>
            <p className="text-zinc-700 text-[11px] mt-1.5">
              e.g. &ldquo;A title card that says Hello World with a fade-in&rdquo;
            </p>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="relative w-full h-full bg-zinc-950 rounded-xl overflow-hidden flex items-center justify-center">
      {/* Subtle inner border */}
      <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/5 pointer-events-none z-10" />

      {Component && !isCompiling && !isStreaming && !error ? (
        <div className="w-full">
          <Player
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
        </div>
      ) : (
        renderContent()
      )}
    </div>
  );
}
