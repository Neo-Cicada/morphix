'use client';

import { useState, useEffect } from 'react';
import { getAudioData, getWaveformPortion } from '@remotion/media-utils';

export function useWaveform(src: string, samples = 200): number[] {
  const [waveform, setWaveform] = useState<number[]>([]);

  useEffect(() => {
    if (!src) return;
    let cancelled = false;

    getAudioData(src)
      .then(audioData => {
        if (cancelled) return;
        const bars = getWaveformPortion({
          audioData,
          startTimeInSeconds: 0,
          durationInSeconds: audioData.durationInSeconds,
          numberOfSamples: samples,
        });
        if (!cancelled) setWaveform(bars.map(b => b.amplitude));
      })
      .catch(() => {
        // silently ignore errors (e.g., CORS issues)
      });

    return () => { cancelled = true; };
  }, [src, samples]);

  return waveform;
}
