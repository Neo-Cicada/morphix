'use client';

import { useState, useRef, useCallback } from 'react';
import { api } from '@/lib/api';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface ProductionDoc {
  messages: { id: string; role: 'user' | 'assistant'; text: string }[];
  history: { role: 'user' | 'assistant'; content: string }[];
  duration: number;
  thumbnail?: string;
  voiceState?: {
    enabled?: boolean;
    selectedVoiceId?: string;
    script?: string;
    audioUrl?: string | null;
    audioDurationSeconds?: number | null;
  };
  musicState?: {
    enabled?: boolean;
    selectedPresetId?: string;
    customPrompt?: string;
    audioUrl?: string | null;
    volume?: number;
  };
}

const VIDEO_ID_KEY = 'morphix_editor_video_id';

export function useCloudPersistence() {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadStoredVideoId = useCallback((): string | null => {
    try {
      return localStorage.getItem(VIDEO_ID_KEY);
    } catch {
      return null;
    }
  }, []);

  const initVideoId = useCallback((id: string) => {
    setVideoId(id);
    try {
      localStorage.setItem(VIDEO_ID_KEY, id);
    } catch {
      // unavailable — state is still set in memory
    }
  }, []);

  const clearVideoId = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    setVideoId(null);
    try {
      localStorage.removeItem(VIDEO_ID_KEY);
    } catch {
      // unavailable
    }
  }, []);

  const createDraft = useCallback(async (
    title: string,
    animationCode: string,
    productionDoc: ProductionDoc,
  ): Promise<string | null> => {
    setSaveStatus('saving');
    try {
      const { id } = await api.post<{ id: string }>('/videos/draft', {
        title,
        animation_code: animationCode,
        production_doc: productionDoc,
      });
      initVideoId(id);
      setSaveStatus('saved');
      return id;
    } catch {
      setSaveStatus('error');
      return null;
    }
  }, [initVideoId]);

  const scheduleSave = useCallback((
    id: string,
    animationCode: string,
    productionDoc: ProductionDoc,
  ) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus('saving');
    saveTimerRef.current = setTimeout(async () => {
      try {
        await api.patch(`/videos/${id}/code`, {
          animation_code: animationCode,
          production_doc: productionDoc,
        });
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    }, 3000);
  }, []);

  const fetchVideo = useCallback(async (id: string): Promise<{
    animation_code: string | null;
    production_doc: ProductionDoc | null;
  } | null> => {
    try {
      const video = await api.get<{
        animation_code: string | null;
        production_doc: ProductionDoc | null;
      }>(`/videos/${id}`);
      return video;
    } catch {
      return null;
    }
  }, []);

  return {
    videoId,
    saveStatus,
    loadStoredVideoId,
    initVideoId,
    createDraft,
    scheduleSave,
    clearVideoId,
    fetchVideo,
  };
}
