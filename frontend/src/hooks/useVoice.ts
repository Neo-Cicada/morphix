'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export interface ElevenLabsVoice {
  id: string;
  name: string;
  accent?: string;
  description?: string;
  age?: string;
  gender?: string;
  useCase?: string;
  previewUrl?: string;
}

type VoiceStatus = 'idle' | 'loading-voices' | 'generating' | 'ready' | 'error';

export interface UseVoiceReturn {
  // State
  enabled: boolean;
  voices: ElevenLabsVoice[];
  selectedVoiceId: string;
  script: string;
  status: VoiceStatus;
  errorMessage: string | null;
  audioUrl: string | null;
  audioDurationSeconds: number | null;
  // Audio element ref for player sync
  audioRef: React.RefObject<HTMLAudioElement | null>;
  // Actions
  setEnabled: (v: boolean) => void;
  setSelectedVoiceId: (id: string) => void;
  setScript: (s: string) => void;
  generateAudio: () => Promise<void>;
  clearAudio: () => void;
  reset: () => void;
}

const STORAGE_KEY = 'morphix_voice';

interface PersistedVoice {
  enabled: boolean;
  selectedVoiceId: string;
  script: string;
  audioUrl: string | null;
  audioDurationSeconds: number | null;
}

function loadFromStorage(): Partial<PersistedVoice> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function useVoice(): UseVoiceReturn {
  const stored = useRef(loadFromStorage());

  const [enabled, setEnabledState] = useState(() => stored.current.enabled ?? false);
  const [voices, setVoices] = useState<ElevenLabsVoice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState(() => stored.current.selectedVoiceId ?? '');
  const [script, setScript] = useState(() => stored.current.script ?? '');
  const [status, setStatus] = useState<VoiceStatus>(() => stored.current.audioUrl ? 'ready' : 'idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(() => stored.current.audioUrl ?? null);
  const [audioDurationSeconds, setAudioDurationSeconds] = useState<number | null>(() => stored.current.audioDurationSeconds ?? null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevBlobUrl = useRef<string | null>(null);

  // Persist settings whenever they change
  useEffect(() => {
    try {
      const data: PersistedVoice = { enabled, selectedVoiceId, script, audioUrl, audioDurationSeconds };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // quota — ignore
    }
  }, [enabled, selectedVoiceId, script, audioUrl, audioDurationSeconds]);

  // Auto-fetch voices on mount if voice was previously enabled (restored from localStorage)
  useEffect(() => {
    if (enabled) fetchVoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Revoke blob URL on unmount
  useEffect(() => {
    return () => {
      if (prevBlobUrl.current) URL.revokeObjectURL(prevBlobUrl.current);
    };
  }, []);

  const fetchVoices = useCallback(async () => {
    if (voices.length > 0) return;
    setStatus('loading-voices');
    setErrorMessage(null);
    try {
      const res = await fetch('/api/voice');
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setVoices(data.voices ?? []);
      if (data.voices?.length > 0 && !selectedVoiceId) {
        setSelectedVoiceId(data.voices[0].id);
      }
      setStatus(audioUrl ? 'ready' : 'idle');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load voices');
      setStatus('error');
    }
  }, [voices.length, selectedVoiceId, audioUrl]);

  const setEnabled = useCallback((v: boolean) => {
    setEnabledState(v);
    if (v) fetchVoices();
  }, [fetchVoices]);

  const generateAudio = useCallback(async () => {
    if (!script.trim() || !selectedVoiceId) return;
    setStatus('generating');
    setErrorMessage(null);

    try {
      const res = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: script, voiceId: selectedVoiceId }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }

      const blob = await res.blob();

      // Detect duration from blob before uploading
      const blobUrl = URL.createObjectURL(blob);
      const duration = await new Promise<number>((resolve) => {
        const tmp = new Audio(blobUrl);
        tmp.addEventListener('loadedmetadata', () => resolve(tmp.duration), { once: true });
        tmp.addEventListener('error', () => resolve(0), { once: true });
      });
      URL.revokeObjectURL(blobUrl);

      // Upload to Supabase Storage for a persistent public URL
      const form = new FormData();
      form.append('audio', new File([blob], 'narration.mp3', { type: 'audio/mpeg' }));
      const uploadRes = await fetch('/api/upload-audio', { method: 'POST', body: form });

      if (uploadRes.ok) {
        const { url } = await uploadRes.json();
        if (prevBlobUrl.current) URL.revokeObjectURL(prevBlobUrl.current);
        setAudioUrl(url);
      } else {
        // Fallback: blob URL
        if (prevBlobUrl.current) URL.revokeObjectURL(prevBlobUrl.current);
        const fallback = URL.createObjectURL(blob);
        prevBlobUrl.current = fallback;
        setAudioUrl(fallback);
      }

      setAudioDurationSeconds(duration > 0 ? duration : null);
      setStatus('ready');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to generate audio');
      setStatus('error');
    }
  }, [script, selectedVoiceId]);

  const clearAudio = useCallback(() => {
    if (prevBlobUrl.current) {
      URL.revokeObjectURL(prevBlobUrl.current);
      prevBlobUrl.current = null;
    }
    setAudioUrl(null);
    setAudioDurationSeconds(null);
    setStatus('idle');
    setErrorMessage(null);
  }, []);

  const reset = useCallback(() => {
    clearAudio();
    setEnabledState(false);
    setScript('');
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, [clearAudio]);

  return {
    enabled,
    voices,
    selectedVoiceId,
    script,
    status,
    errorMessage,
    audioUrl,
    audioDurationSeconds,
    audioRef,
    setEnabled,
    setSelectedVoiceId,
    setScript,
    generateAudio,
    clearAudio,
    reset,
  };
}
