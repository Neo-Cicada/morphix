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
  reset: () => void;
}

const STORAGE_KEY = 'morphix_music';

interface PersistedMusic {
  enabled: boolean;
  selectedPresetId: string;
  customPrompt: string;
  audioUrl: string | null;
  volume: number;
}

function loadFromStorage(): Partial<PersistedMusic> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function useMusic(): UseMusicReturn {
  const stored = useRef(loadFromStorage());

  const [enabled, setEnabledState] = useState(() => stored.current.enabled ?? false);
  const [selectedPresetId, setSelectedPresetIdState] = useState(() => stored.current.selectedPresetId ?? 'saas');
  const [customPrompt, setCustomPromptState] = useState(() => stored.current.customPrompt ?? '');
  const [status, setStatus] = useState<MusicStatus>(() => stored.current.audioUrl ? 'ready' : 'idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(() => stored.current.audioUrl ?? null);
  const [volume, setVolumeState] = useState(() => stored.current.volume ?? 0.4);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevBlobUrl = useRef<string | null>(null);

  // Persist settings whenever they change
  useEffect(() => {
    try {
      const data: PersistedMusic = { enabled, selectedPresetId, customPrompt, audioUrl, volume };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // quota — ignore
    }
  }, [enabled, selectedPresetId, customPrompt, audioUrl, volume]);

  // Sync volume to audio element
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume, audioUrl]);

  // Revoke blob URL on unmount
  useEffect(() => {
    return () => {
      if (prevBlobUrl.current) URL.revokeObjectURL(prevBlobUrl.current);
    };
  }, []);

  const setEnabled = useCallback((v: boolean) => setEnabledState(v), []);

  const setSelectedPresetId = useCallback((id: string) => setSelectedPresetIdState(id), []);

  const setCustomPrompt = useCallback((s: string) => setCustomPromptState(s), []);

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

      // Upload to Supabase Storage for a persistent public URL
      const form = new FormData();
      form.append('audio', new File([blob], 'music.mp3', { type: 'audio/mpeg' }));
      const uploadRes = await fetch('/api/upload-audio', { method: 'POST', body: form });

      if (uploadRes.ok) {
        const { url } = await uploadRes.json();
        setAudioUrl(url);
      } else {
        // Fallback: blob URL (not persistent across refresh, but works for current session)
        if (prevBlobUrl.current) URL.revokeObjectURL(prevBlobUrl.current);
        const blobUrl = URL.createObjectURL(blob);
        prevBlobUrl.current = blobUrl;
        setAudioUrl(blobUrl);
      }

      setStatus('ready');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to generate music');
      setStatus('error');
    }
  }, [selectedPresetId, customPrompt]);

  const clearMusic = useCallback(() => {
    if (prevBlobUrl.current) {
      URL.revokeObjectURL(prevBlobUrl.current);
      prevBlobUrl.current = null;
    }
    setAudioUrl(null);
    setStatus('idle');
    setErrorMessage(null);
  }, []);

  const reset = useCallback(() => {
    clearMusic();
    setEnabledState(false);
    setSelectedPresetIdState('saas');
    setCustomPromptState('');
    setVolumeState(0.4);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, [clearMusic]);

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
    reset,
  };
}
