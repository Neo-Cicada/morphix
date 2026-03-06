'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Download, Loader2, ImagePlus, Code2, Eye } from 'lucide-react';
import dynamic from 'next/dynamic';
import { AnimationPlayer } from './AnimationPlayer';
import { useAnimationState } from '@/hooks/useAnimationState';
import { useGenerationApi } from '@/hooks/useGenerationApi';

// Monaco must be loaded client-side only
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
}

type ExportState = 'idle' | 'rendering' | 'done' | 'error';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractDuration(code: string): number {
  // Look for durationInFrames in the generated code
  const match = code.match(/durationInFrames[:\s=]+(\d+)/);
  if (match) return parseInt(match[1], 10);
  return 150; // default: 5s at 30fps
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EditorPage() {
  // Animation state (code + compiled component)
  const animationState = useAnimationState();
  const { generate, isGenerating, isStreaming } = useGenerationApi();

  // UI state
  const [durationInFrames, setDurationInFrames] = useState(150);
  const [fps] = useState(30);
  const [activePanel, setActivePanel] = useState<'preview' | 'code'>('preview');

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 0, role: 'assistant', text: 'Hi! Describe an animation and I\'ll generate it for you. You can also follow up to refine it.' },
  ]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);

  // Raw streaming buffer for Monaco display (not compiled until complete)
  const [streamingCode, setStreamingCode] = useState('');

  // Conversation history for context (role/content pairs for the API)
  const conversationHistory = useRef<{ role: 'user' | 'assistant'; content: string }[]>([]);

  // Export state
  const [exportState, setExportState] = useState<ExportState>('idle');
  const [exportUrl, setExportUrl] = useState<string | null>(null);

  // Debounce ref for manual Monaco edits
  const compileDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update duration when new code is generated
  useEffect(() => {
    if (animationState.code) {
      const detected = extractDuration(animationState.code);
      setDurationInFrames(detected);
    }
  }, [animationState.code]);

  // ─── Streaming code accumulator ─────────────────────────────────────────────
  const streamBufferRef = useRef('');

  const handleSend = useCallback(async () => {
    const prompt = input.trim();
    if (!prompt || isGenerating) return;

    const userMsg: ChatMessage = { id: Date.now(), role: 'user', text: prompt };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    const images = [...attachedImages];
    setAttachedImages([]);

    const isFollowUp = animationState.code.length > 0;

    // Add to conversation history
    conversationHistory.current.push({ role: 'user', content: prompt });

    if (!isFollowUp) {
      // Streaming generation
      streamBufferRef.current = '';

      // Add pending assistant message
      const assistantMsgId = Date.now() + 1;
      setMessages((prev) => [...prev, { id: assistantMsgId, role: 'assistant', text: '...' }]);

      await generate({
        prompt,
        conversationHistory: conversationHistory.current.slice(0, -1),
        isFollowUp: false,
        frameImages: images,
        onCodeChunk: (delta) => {
          streamBufferRef.current += delta;
          // Show code in Monaco while streaming, but don't compile until complete
          setStreamingCode(streamBufferRef.current);
        },
        onComplete: (fullCode) => {
          setStreamingCode('');
          animationState.setCode(fullCode);
          conversationHistory.current.push({ role: 'assistant', content: 'Generated animation code.' });
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, text: 'Animation generated! You can refine it by describing changes.' }
                : m
            )
          );
        },
        onError: (err) => {
          setStreamingCode('');
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, text: `Error: ${err}` } : m
            )
          );
        },
      });
    } else {
      // Follow-up edit
      const assistantMsgId = Date.now() + 1;
      setMessages((prev) => [...prev, { id: assistantMsgId, role: 'assistant', text: '...' }]);

      await generate({
        prompt,
        conversationHistory: conversationHistory.current.slice(0, -1),
        currentCode: animationState.code,
        isFollowUp: true,
        frameImages: images,
        onComplete: (patchedCode) => {
          animationState.setCode(patchedCode);
          conversationHistory.current.push({ role: 'assistant', content: 'Applied edit to animation.' });
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, text: 'Done! Edit applied.' } : m
            )
          );
        },
        onError: (err) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, text: `Error: ${err}` } : m
            )
          );
        },
      });
    }
  }, [input, isGenerating, animationState, generate, attachedImages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMonacoChange = (value: string | undefined) => {
    if (value === undefined) return;
    // Debounce recompile by 500ms
    if (compileDebounceRef.current) clearTimeout(compileDebounceRef.current);
    compileDebounceRef.current = setTimeout(() => {
      animationState.setCode(value);
    }, 500);
  };

  const handleImageAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const base64s: string[] = [];

    for (const file of files) {
      const reader = new FileReader();
      await new Promise<void>((resolve) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Strip data URL prefix for API
          base64s.push(result.split(',')[1]);
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }

    setAttachedImages((prev) => [...prev, ...base64s]);
    e.target.value = '';
  };

  const handleExport = async () => {
    if (!animationState.code) return;
    setExportState('rendering');
    setExportUrl(null);

    try {
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: animationState.code, durationInFrames, fps }),
      });

      if (!res.ok) throw new Error(`Render failed: ${res.status}`);
      const data = await res.json();
      setExportUrl(data.url);
      setExportState('done');
    } catch {
      setExportState('error');
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-white">Morphix</span>
          <div className="flex items-center gap-2 text-zinc-400 text-xs">
            <label className="flex items-center gap-1">
              <span>Duration:</span>
              <input
                type="number"
                value={durationInFrames}
                onChange={(e) => setDurationInFrames(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 bg-zinc-800 rounded px-1.5 py-0.5 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              <span>frames</span>
            </label>
            <span className="text-zinc-600">|</span>
            <span>{fps} fps</span>
            <span className="text-zinc-600">|</span>
            <span>{(durationInFrames / fps).toFixed(1)}s</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Panel toggle (mobile) */}
          <div className="flex md:hidden gap-1">
            <button
              onClick={() => setActivePanel('preview')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${activePanel === 'preview' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              <Eye className="w-3 h-3" /> Preview
            </button>
            <button
              onClick={() => setActivePanel('code')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${activePanel === 'code' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              <Code2 className="w-3 h-3" /> Code
            </button>
          </div>

          {/* Export button */}
          {exportState === 'idle' && (
            <button
              onClick={handleExport}
              disabled={!animationState.Component}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export MP4
            </button>
          )}
          {exportState === 'rendering' && (
            <button disabled className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-violet-800 text-xs font-medium opacity-70">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Rendering...
            </button>
          )}
          {exportState === 'done' && exportUrl && (
            <a
              href={exportUrl}
              download="animation.mp4"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-green-600 hover:bg-green-500 text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download MP4
            </a>
          )}
          {exportState === 'error' && (
            <button
              onClick={() => setExportState('idle')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-700 hover:bg-red-600 text-xs font-medium transition-colors"
            >
              Retry Export
            </button>
          )}
        </div>
      </header>

      {/* ── Main: Preview + Monaco ── */}
      <div className="flex flex-1 min-h-0">
        {/* Preview panel */}
        <div
          className={`${activePanel === 'preview' ? 'flex' : 'hidden'} md:flex flex-col md:w-[60%] min-h-0 border-r border-zinc-800`}
        >
          <div className="flex-1 min-h-0 p-3">
            <AnimationPlayer
              Component={animationState.Component}
              durationInFrames={durationInFrames}
              fps={fps}
              isCompiling={animationState.isCompiling}
              isStreaming={isStreaming}
              error={animationState.error}
            />
          </div>
        </div>

        {/* Monaco Editor panel */}
        <div
          className={`${activePanel === 'code' ? 'flex' : 'hidden'} md:flex flex-col md:w-[40%] min-h-0`}
        >
          <div className="flex-1 min-h-0">
            <MonacoEditor
              height="100%"
              language="typescript"
              theme="vs-dark"
              value={streamingCode || animationState.code}
              onChange={handleMonacoChange}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineHeight: 20,
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                fontLigatures: true,
                padding: { top: 12 },
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Chat panel ── */}
      <div className="border-t border-zinc-800 bg-zinc-900 shrink-0 flex flex-col" style={{ maxHeight: '280px' }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-0">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-violet-600 text-white'
                    : 'bg-zinc-800 text-zinc-200'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Attached images preview */}
        {attachedImages.length > 0 && (
          <div className="flex gap-2 px-4 pb-1">
            {attachedImages.map((img, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:image/jpeg;base64,${img}`}
                  alt="attached"
                  className="w-10 h-10 object-cover rounded border border-zinc-700"
                />
                <button
                  onClick={() => setAttachedImages((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full text-white text-[10px] flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input row */}
        <div className="flex items-end gap-2 px-4 py-3">
          <input type="file" ref={fileInputRef} onChange={handleImageAttach} accept="image/*" multiple className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors shrink-0"
            title="Attach image"
          >
            <ImagePlus className="w-4 h-4" />
          </button>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={animationState.code ? 'Describe a change...' : 'Describe your animation...'}
            rows={1}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 resize-none"
            style={{ maxHeight: '100px', overflowY: 'auto' }}
          />

          <button
            onClick={handleSend}
            disabled={!input.trim() || isGenerating}
            className="p-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors shrink-0"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
