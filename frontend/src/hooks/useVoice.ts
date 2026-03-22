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

const BASE_KEY = 'morphix_voice';
function storageKey(videoId: string | null) {
  return videoId ? `${BASE_KEY}_${videoId}` : BASE_KEY;
}

interface PersistedVoice {
  enabled: boolean;
  selectedVoiceId: string;
  script: string;
  audioUrl: string | null;
  audioDurationSeconds: number | null;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function loadFromStorage(key: string): Partial<PersistedVoice> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function useVoice(videoId: string | null = null): UseVoiceReturn {
  const key = storageKey(videoId);
  // All state starts with SSR-safe defaults — localStorage is restored in useEffect after mount
  const [enabled, setEnabledState] = useState(false);
  const [voices, setVoices] = useState<ElevenLabsVoice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState('');
  const [script, setScript] = useState('');
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioDurationSeconds, setAudioDurationSeconds] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevBlobUrl = useRef<string | null>(null);
  // skipFirstPersistRef: the persist effect's first run fires before restore state
  // lands, so skip it to avoid overwriting localStorage with defaults.
  const skipFirstPersistRef = useRef(true);

  // Restore from localStorage after mount (client only — avoids SSR hydration mismatch)
  useEffect(() => {
    const stored = loadFromStorage(key);
    if (stored.enabled) setEnabledState(stored.enabled);
    if (stored.selectedVoiceId) setSelectedVoiceId(stored.selectedVoiceId);
    if (stored.script) setScript(stored.script);
    if (stored.audioDurationSeconds) setAudioDurationSeconds(stored.audioDurationSeconds);
    // Restore HTTPS or base64 data URLs (both survive refresh); skip stale blob:// URLs
    if (stored.audioUrl?.startsWith('http') || stored.audioUrl?.startsWith('data:')) {
      setAudioUrl(stored.audioUrl);
      setStatus('ready');
    }
    // Fetch voices if previously enabled
    if (stored.enabled) fetchVoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist settings to localStorage whenever they change (only save HTTPS audio URLs)
  useEffect(() => {
    if (skipFirstPersistRef.current) {
      skipFirstPersistRef.current = false;
      return; // skip initial run — state is still defaults, restore hasn't landed yet
    }
    try {
      const data: PersistedVoice = {
        enabled,
        selectedVoiceId,
        script,
        audioUrl: (audioUrl?.startsWith('http') || audioUrl?.startsWith('data:')) ? audioUrl : null,
        audioDurationSeconds,
      };
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // quota — ignore
    }
  }, [enabled, selectedVoiceId, script, audioUrl, audioDurationSeconds]);

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
      // Use functional update to avoid stale closure — don't override 'ready' (restored audio)
      setStatus(prev => prev === 'ready' ? 'ready' : 'idle');
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

      // Convert to base64 data URL — survives page refresh without external storage
      const dataUrl = await blobToDataUrl(blob);

      // Detect duration
      const duration = await new Promise<number>((resolve) => {
        const tmp = new Audio(dataUrl);
        tmp.addEventListener('loadedmetadata', () => resolve(tmp.duration), { once: true });
        tmp.addEventListener('error', () => resolve(0), { once: true });
      });

      if (prevBlobUrl.current) URL.revokeObjectURL(prevBlobUrl.current);
      setAudioUrl(dataUrl);
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
    try { localStorage.removeItem(key); } catch {}
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
