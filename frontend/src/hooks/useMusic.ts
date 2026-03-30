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
  restoreFromDoc: (data: Partial<PersistedMusic>) => void;
}

const BASE_KEY = 'morphix_music';
function storageKey(videoId: string | null) {
  return videoId ? `${BASE_KEY}_${videoId}` : BASE_KEY;
}

export interface PersistedMusic {
  enabled: boolean;
  selectedPresetId: string;
  customPrompt: string;
  audioUrl: string | null;
  volume: number;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function loadFromStorage(key: string): Partial<PersistedMusic> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function useMusic(videoId: string | null = null): UseMusicReturn {
  const key = storageKey(videoId);
  // All state starts with SSR-safe defaults — localStorage is restored in useEffect after mount
  const [enabled, setEnabledState] = useState(false);
  const [selectedPresetId, setSelectedPresetIdState] = useState('saas');
  const [customPrompt, setCustomPromptState] = useState('');
  const [status, setStatus] = useState<MusicStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [volume, setVolumeState] = useState(0.4);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevBlobUrl = useRef<string | null>(null);
  // skipFirstPersistRef: the persist effect's first run fires before restore state
  // lands, so skip it to avoid overwriting localStorage with defaults.
  const skipFirstPersistRef = useRef(true);

  // Restore from localStorage when key changes (covers mount + when videoId loads from cloud)
  useEffect(() => {
    const stored = loadFromStorage(key);
    // Skip if nothing stored for this key — avoids overwriting restoreFromDoc data with empty defaults
    if (Object.keys(stored).length === 0) return;
    if (stored.enabled != null) setEnabledState(stored.enabled);
    if (stored.selectedPresetId) setSelectedPresetIdState(stored.selectedPresetId);
    if (stored.customPrompt) setCustomPromptState(stored.customPrompt);
    if (stored.volume != null) setVolumeState(stored.volume);
    // Restore HTTPS or base64 data URLs (both survive refresh); skip stale blob:// URLs
    if (stored.audioUrl?.startsWith('http') || stored.audioUrl?.startsWith('data:')) {
      setAudioUrl(stored.audioUrl);
      setStatus('ready');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Persist settings to localStorage whenever they change (only save HTTPS audio URLs)
  useEffect(() => {
    if (skipFirstPersistRef.current) {
      skipFirstPersistRef.current = false;
      return; // skip initial run — state is still defaults, restore hasn't landed yet
    }
    try {
      const data: PersistedMusic = {
        enabled,
        selectedPresetId,
        customPrompt,
        audioUrl: (audioUrl?.startsWith('http') || audioUrl?.startsWith('data:')) ? audioUrl : null,
        volume,
      };
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // quota — ignore
    }
  }, [key, enabled, selectedPresetId, customPrompt, audioUrl, volume]);

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

      // Convert to base64 data URL for immediate playback
      const dataUrl = await blobToDataUrl(blob);

      if (prevBlobUrl.current) URL.revokeObjectURL(prevBlobUrl.current);
      // Set data URL immediately so playback works right away
      setAudioUrl(dataUrl);
      setStatus('ready');

      // Upload to Supabase Storage in the background — swap to HTTPS URL for reliable persistence
      try {
        const formData = new FormData();
        formData.append('audio', blob, 'music.mp3');
        const uploadRes = await fetch('/api/upload-audio', { method: 'POST', body: formData });
        if (uploadRes.ok) {
          const { url } = await uploadRes.json();
          if (url) setAudioUrl(url);
        }
      } catch {
        // Upload failed — data URL already set, will work until next refresh
      }
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
    try { localStorage.removeItem(key); } catch {}
  }, [clearMusic]);

  const restoreFromDoc = useCallback((data: Partial<PersistedMusic>) => {
    if (data.enabled != null) setEnabledState(data.enabled);
    if (data.selectedPresetId) setSelectedPresetIdState(data.selectedPresetId);
    if (data.customPrompt) setCustomPromptState(data.customPrompt);
    if (data.volume != null) setVolumeState(data.volume);
    if (data.audioUrl?.startsWith('http') || data.audioUrl?.startsWith('data:')) {
      setAudioUrl(data.audioUrl);
      setStatus('ready');
    }
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
    reset,
    restoreFromDoc,
  };
}
