import { useRef, useCallback } from 'react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

interface PersistedState {
  code: string;
  messages: ChatMessage[];
  history: { role: 'user' | 'assistant'; content: string }[];
  duration: number;
}

const KEYS = {
  code: 'morphix_editor_code',
  messages: 'morphix_editor_messages',
  history: 'morphix_editor_history',
  duration: 'morphix_editor_duration',
};

export function useEditorPersistence() {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback((): Partial<PersistedState> => {
    try {
      const code = localStorage.getItem(KEYS.code) ?? '';
      const messagesRaw = localStorage.getItem(KEYS.messages);
      const historyRaw = localStorage.getItem(KEYS.history);
      const durationRaw = localStorage.getItem(KEYS.duration);

      return {
        code,
        messages: messagesRaw ? JSON.parse(messagesRaw) : undefined,
        history: historyRaw ? JSON.parse(historyRaw) : undefined,
        duration: durationRaw ? parseInt(durationRaw, 10) : undefined,
      };
    } catch {
      return {};
    }
  }, []);

  const save = useCallback((state: PersistedState) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(KEYS.code, state.code);
        localStorage.setItem(KEYS.messages, JSON.stringify(state.messages));
        localStorage.setItem(KEYS.history, JSON.stringify(state.history));
        localStorage.setItem(KEYS.duration, String(state.duration));
      } catch {
        // localStorage may be full or unavailable
      }
    }, 500);
  }, []);

  const clear = useCallback(() => {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  }, []);

  return { load, save, clear };
}
