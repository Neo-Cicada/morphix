'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { MUSIC_PRESETS } from '@/lib/musicPresets';

type MusicStatus = 'idle' | 'generating' | 'ready' | 'error';

export interface UseMusicReturn {
  enabled: boolean;
  selectedPresetId: string;
  customPrompt: string;
  status: MusicStatus;
  errorMessage: string | null;
  audioUrl: string | null;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  volume: number;
  setEnabled: (v: boolean) => void;
  setSelectedPresetId: (id: string) => void;
  setCustomPrompt: (s: string) => void;
  setVolume: (v: number) => void;
  generateMusic: (durationMs: number) => Promise<void>;
  clearMusic: () => void;
}

export function useMusic(): UseMusicReturn {
  const [enabled, setEnabledState] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState('saas');
  const [customPrompt, setCustomPrompt] = useState('');
  const [status, setStatus] = useState<MusicStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [volume, setVolumeState] = useState(0.4);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevAudioUrl = useRef<string | null>(null);

  // Sync volume to audio element
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume, audioUrl]);

  // Revoke blob URL on unmount
  useEffect(() => {
    return () => {
      if (prevAudioUrl.current) URL.revokeObjectURL(prevAudioUrl.current);
    };
  }, []);

  const setEnabled = useCallback((v: boolean) => {
    setEnabledState(v);
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  const generateMusic = useCallback(async (durationMs: number) => {
    const preset = MUSIC_PRESETS.find((p) => p.id === selectedPresetId);
    const prompt = selectedPresetId === 'custom' ? customPrompt : preset?.prompt ?? '';

    if (!prompt.trim()) return;

    setStatus('generating');
    setErrorMessage(null);

    try {
      const res = await fetch('/api/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, durationMs }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      if (prevAudioUrl.current) URL.revokeObjectURL(prevAudioUrl.current);
      const url = URL.createObjectURL(blob);
      prevAudioUrl.current = url;
      setAudioUrl(url);
      setStatus('ready');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to generate music');
      setStatus('error');
    }
  }, [selectedPresetId, customPrompt]);

  const clearMusic = useCallback(() => {
    if (prevAudioUrl.current) {
      URL.revokeObjectURL(prevAudioUrl.current);
      prevAudioUrl.current = null;
    }
    setAudioUrl(null);
    setStatus('idle');
    setErrorMessage(null);
  }, []);

  return {
    enabled,
    selectedPresetId,
    customPrompt,
    status,
    errorMessage,
    audioUrl,
    audioRef,
    volume,
    setEnabled,
    setSelectedPresetId,
    setCustomPrompt,
    setVolume,
    generateMusic,
    clearMusic,
  };
}
