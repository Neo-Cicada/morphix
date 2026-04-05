'use client';

import React from 'react';
import { Sequence as RemotionSequence } from 'remotion';

// ─── Context ──────────────────────────────────────────────────────────────────

/** Set of layer keys (`${from}:${duration}`) that should be hidden. */
export const HiddenLayersContext = React.createContext<Set<string>>(new Set());

export function layerKey(from: number, duration: number): string {
  return `${from}:${duration}`;
}

// ─── Proxy Sequence ───────────────────────────────────────────────────────────

/**
 * Drop-in replacement for Remotion's Sequence that reads HiddenLayersContext
 * to skip rendering hidden layers. Used as the injected Sequence global in the
 * in-browser compiler so visibility toggles work without recompiling.
 */
export function SequenceProxy(props: React.ComponentProps<typeof RemotionSequence>) {
  const { from = 0, durationInFrames, children, ...rest } = props;
  const hidden = React.useContext(HiddenLayersContext);
  if (durationInFrames !== undefined && hidden.has(layerKey(from, durationInFrames))) {
    return null;
  }
  return (
    <RemotionSequence from={from} durationInFrames={durationInFrames} {...rest}>
      {children}
    </RemotionSequence>
  );
}
