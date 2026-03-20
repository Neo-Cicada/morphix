'use client';

import { useCallback, useRef } from 'react';
import { useAnimationState } from './useAnimationState';
import { useGenerationApi } from './useGenerationApi';
import { compile } from '@/remotion/compiler';

const MAX_CORRECTION_ATTEMPTS = 3;

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AutoCorrectionOptions {
  prompt: string;
  conversationHistory?: ConversationMessage[];
  currentCode?: string;
  isFollowUp?: boolean;
  frameImages?: string[];
  errorCorrection?: {
    error: string;
    attemptNumber: number;
    maxAttempts: number;
  };
  onCodeChunk?: (delta: string) => void;
  onComplete?: (fullCode: string) => void;
  onError?: (error: string) => void;
}

export function useAutoCorrection() {
  const animationState = useAnimationState();
  const { generate, isGenerating, isStreaming } = useGenerationApi();
  const correctionAttempt = useRef(0);

  const generateWithCorrection = useCallback(
    async (opts: AutoCorrectionOptions, attempt = 0) => {
      correctionAttempt.current = attempt;

      await generate({
        ...opts,
        onComplete: async (code) => {
          // Compile immediately to get the real error (avoids stale closure on animationState.error)
          const result = compile(code);
          animationState.setCode(code);
          opts.onComplete?.(code);

          if (result.error && attempt < MAX_CORRECTION_ATTEMPTS) {
            // Auto-correct: retry with error context
            await generateWithCorrection(
              {
                ...opts,
                currentCode: code,
                isFollowUp: true,
                errorCorrection: {
                  error: result.error,
                  attemptNumber: attempt + 1,
                  maxAttempts: MAX_CORRECTION_ATTEMPTS,
                },
              },
              attempt + 1
            );
          }
        },
        onError: (error) => {
          opts.onError?.(error);
        },
      });
    },
    [generate, animationState]
  );

  return {
    ...animationState,
    isGenerating,
    isStreaming,
    generate: generateWithCorrection,
  };
}
