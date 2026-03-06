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
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <p className="text-sm text-zinc-400 animate-pulse">Generating animation...</p>
        </div>
      );
    }

    if (isCompiling) {
      return (
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-400">Compiling...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="w-full max-w-lg mx-auto p-4 bg-red-950/40 border border-red-800 rounded-lg">
          <p className="text-xs font-semibold text-red-400 mb-1">Compile Error</p>
          <pre className="text-xs text-red-300 whitespace-pre-wrap break-all">{error}</pre>
        </div>
      );
    }

    if (!Component) {
      return (
        <div className="flex flex-col items-center gap-3 text-center px-8">
          <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-2xl">
            ✨
          </div>
          <p className="text-zinc-400 text-sm">Describe your animation above to get started</p>
          <p className="text-zinc-600 text-xs">e.g. "Create a title card that says Hello World with a fade-in"</p>
        </div>
      );
    }

    return (
      <Player
        component={Component}
        durationInFrames={Math.max(1, durationInFrames)}
        fps={fps}
        compositionWidth={1920}
        compositionHeight={1080}
        controls
        autoPlay
        loop
        style={{ width: '100%', borderRadius: '8px' }}
      />
    );
  };

  return (
    <div className="relative w-full h-full bg-zinc-950 rounded-lg overflow-hidden flex items-center justify-center">
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
            style={{ width: '100%', borderRadius: '8px' }}
          />
        </div>
      ) : (
        renderContent()
      )}
    </div>
  );
}
