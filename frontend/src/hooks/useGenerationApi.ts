'use client';

import { useState, useCallback } from 'react';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface GenerateOptions {
  prompt: string;
  conversationHistory?: ConversationMessage[];
  currentCode?: string;
  isFollowUp?: boolean;
  errorCorrection?: {
    error: string;
    attemptNumber: number;
    maxAttempts: number;
  };
  frameImages?: string[];
  onCodeChunk?: (delta: string) => void;
  onComplete?: (fullCode: string) => void;
  onError?: (error: string) => void;
}

interface GenerationApiState {
  isGenerating: boolean;
  isStreaming: boolean;
}

function sanitizeCode(raw: string): string {
  let code = raw.trim();

  // Strip opening markdown fence (e.g. ```tsx, ```ts, ```javascript, ```)
  code = code.replace(/^```(?:tsx?|javascript|js|jsx)?\s*\n?/i, '');
  // Strip closing fence
  code = code.replace(/\n?```\s*$/i, '');

  code = code.trim();

  // Strip any prose before the first line of code
  const firstCodeLine = code.search(/^(?:export|const|let|var|function|class|\/\/|\/\*)/m);
  if (firstCodeLine > 0) {
    code = code.slice(firstCodeLine).trim();
  }

  return code;
}

export function useGenerationApi(): GenerationApiState & { generate: (opts: GenerateOptions) => Promise<void> } {
  const [state, setState] = useState<GenerationApiState>({
    isGenerating: false,
    isStreaming: false,
  });

  const generate = useCallback(async (opts: GenerateOptions) => {
    const {
      prompt,
      conversationHistory = [],
      currentCode,
      isFollowUp = false,
      errorCorrection,
      frameImages,
      onCodeChunk,
      onComplete,
      onError,
    } = opts;

    setState({ isGenerating: true, isStreaming: !isFollowUp });

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          conversationHistory,
          currentCode,
          isFollowUp,
          errorCorrection,
          frameImages,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API error ${res.status}: ${text}`);
      }

      if (isFollowUp) {
        // Non-streaming: JSON response
        const data = await res.json();

        if (data.type === 'error') {
          onError?.(data.error);
        } else if (data.code) {
          const sanitized = sanitizeCode(data.code);
          onComplete?.(sanitized);
        }
      } else {
        // Streaming: SSE data stream from Vercel AI SDK
        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let fullCode = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          // toTextStreamResponse() sends plain text chunks
          fullCode += chunk;
          onCodeChunk?.(chunk);
        }

        const sanitized = sanitizeCode(fullCode);
        console.log('[generate] stream complete, code length:', sanitized.length, '\n', sanitized.slice(0, 200));
        onComplete?.(sanitized);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      onError?.(message);
    } finally {
      setState({ isGenerating: false, isStreaming: false });
    }
  }, []);

  return { ...state, generate };
}
