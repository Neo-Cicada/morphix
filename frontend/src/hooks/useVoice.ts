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
  // Audio element ref for player sync
  audioRef: React.RefObject<HTMLAudioElement | null>;
  // Actions
  setEnabled: (v: boolean) => void;
  setSelectedVoiceId: (id: string) => void;
  setScript: (s: string) => void;
  generateAudio: () => Promise<void>;
  clearAudio: () => void;
}

export function useVoice(): UseVoiceReturn {
  const [enabled, setEnabledState] = useState(false);
  const [voices, setVoices] = useState<ElevenLabsVoice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState('');
  const [script, setScript] = useState('');
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevAudioUrl = useRef<string | null>(null);

  // Revoke previous object URL to avoid memory leaks
  useEffect(() => {
    return () => {
      if (prevAudioUrl.current) URL.revokeObjectURL(prevAudioUrl.current);
    };
  }, []);

  const fetchVoices = useCallback(async () => {
    if (voices.length > 0) return; // already loaded
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
      setStatus('idle');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load voices');
      setStatus('error');
    }
  }, [voices.length, selectedVoiceId]);

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
      if (prevAudioUrl.current) URL.revokeObjectURL(prevAudioUrl.current);
      const url = URL.createObjectURL(blob);
      prevAudioUrl.current = url;
      setAudioUrl(url);
      setStatus('ready');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to generate audio');
      setStatus('error');
    }
  }, [script, selectedVoiceId]);

  const clearAudio = useCallback(() => {
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
    voices,
    selectedVoiceId,
    script,
    status,
    errorMessage,
    audioUrl,
    audioRef,
    setEnabled,
    setSelectedVoiceId,
    setScript,
    generateAudio,
    clearAudio,
  };
}
