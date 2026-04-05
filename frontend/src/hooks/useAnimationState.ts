'use client';

import { useState, useCallback } from 'react';
import React from 'react';
import { compile } from '@/remotion/compiler';

interface AnimationState {
  code: string;
  Component: React.ComponentType | null;
  error: string | null;
  isCompiling: boolean;
}

interface UseAnimationStateReturn extends AnimationState {
  setCode: (code: string) => void;
  clearError: () => void;
  reset: () => void;
}

export function useAnimationState(): UseAnimationStateReturn {
  const [state, setState] = useState<AnimationState>({
    code: '',
    Component: null,
    error: null,
    isCompiling: false,
  });

  // Incremented on every reset() call to cancel in-flight compilations.
  const compilationEpoch = React.useRef(0);

  const setCode = useCallback((code: string) => {
    const epoch = compilationEpoch.current;
    setState((prev) => ({ ...prev, code, isCompiling: true, error: null }));

    // Compile asynchronously to avoid blocking the UI
    setTimeout(() => {
      // Discard result if reset() was called after this setCode
      if (compilationEpoch.current !== epoch) return;
      const result = compile(code);
      setState((prev) => ({
        ...prev,
        Component: result.Component,
        error: result.error,
        isCompiling: false,
      }));
    }, 0);
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const reset = useCallback(() => {
    compilationEpoch.current += 1; // invalidate any pending setTimeout compilation
    setState({ code: '', Component: null, error: null, isCompiling: false });
  }, []);

  return { ...state, setCode, clearError, reset };
}
