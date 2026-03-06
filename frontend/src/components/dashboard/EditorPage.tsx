'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Download, Loader2, ImagePlus, Code2, Eye, Sparkles, PanelRightClose, PanelRightOpen } from 'lucide-react';
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
  // Prefer the top-level DURATION_IN_FRAMES constant the AI is instructed to declare
  const upper = code.match(/DURATION_IN_FRAMES\s*=\s*(\d+)/);
  if (upper) return parseInt(upper[1], 10);
  // Fallback: any durationInFrames assignment/property
  const lower = code.match(/durationInFrames[:\s=]+(\d+)/);
  if (lower) return parseInt(lower[1], 10);
  return 180; // default: 6s at 30fps
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EditorPage() {
  const animationState = useAnimationState();
  const { generate, isGenerating, isStreaming } = useGenerationApi();

  // UI state
  const [durationInFrames, setDurationInFrames] = useState(150);
  const [fps] = useState(30);
  const [activePanel, setActivePanel] = useState<'preview' | 'code'>('preview');
  const [isCodePanelOpen, setIsCodePanelOpen] = useState(true);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 0, role: 'assistant', text: 'Hi! Describe an animation and I\'ll generate it for you. You can also follow up to refine it.' },
  ]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);

  const [streamingCode, setStreamingCode] = useState('');
  const conversationHistory = useRef<{ role: 'user' | 'assistant'; content: string }[]>([]);

  // Export state
  const [exportState, setExportState] = useState<ExportState>('idle');
  const [exportUrl, setExportUrl] = useState<string | null>(null);

  const compileDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (animationState.code) {
      const detected = extractDuration(animationState.code);
      setDurationInFrames(detected);
    }
  }, [animationState.code]);

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
    conversationHistory.current.push({ role: 'user', content: prompt });

    if (!isFollowUp) {
      streamBufferRef.current = '';
      const assistantMsgId = Date.now() + 1;
      setMessages((prev) => [...prev, { id: assistantMsgId, role: 'assistant', text: '...' }]);

      await generate({
        prompt,
        conversationHistory: conversationHistory.current.slice(0, -1),
        isFollowUp: false,
        frameImages: images,
        onCodeChunk: (delta) => {
          streamBufferRef.current += delta;
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
    <div className="h-full flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden">

      {/* ── Header ── */}
      <header className="relative flex items-center justify-between px-4 py-2 shrink-0">
        {/* Gradient border bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent pointer-events-none" />

        <div className="flex items-center gap-3">
          {/* Duration controls */}
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <label className="flex items-center gap-1.5">
              <span className="text-zinc-600">Frames</span>
              <input
                type="number"
                value={durationInFrames}
                onChange={(e) => setDurationInFrames(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-14 bg-zinc-900 border border-zinc-800 rounded-md px-1.5 py-0.5 text-zinc-200 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all text-center"
              />
            </label>
            <span className="text-zinc-700">·</span>
            <span className="text-zinc-600">{fps} fps</span>
            <span className="text-zinc-700">·</span>
            <span className="text-zinc-500 tabular-nums">{(durationInFrames / fps).toFixed(1)}s</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Code panel toggle (desktop) */}
          <button
            onClick={() => setIsCodePanelOpen((v) => !v)}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-all"
            title={isCodePanelOpen ? 'Hide code panel' : 'Show code panel'}
          >
            {isCodePanelOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
            <span>{isCodePanelOpen ? 'Hide code' : 'Show code'}</span>
          </button>

          {/* Panel toggle (mobile) — segmented control */}
          <div className="flex md:hidden gap-0.5 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
            <button
              onClick={() => setActivePanel('preview')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                activePanel === 'preview'
                  ? 'bg-zinc-700 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Eye className="w-3 h-3" />
              Preview
            </button>
            <button
              onClick={() => setActivePanel('code')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                activePanel === 'code'
                  ? 'bg-zinc-700 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Code2 className="w-3 h-3" />
              Code
            </button>
          </div>

          {/* Export button */}
          {exportState === 'idle' && (
            <button
              onClick={handleExport}
              disabled={!animationState.Component}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                animationState.Component
                  ? 'btn-gradient text-white'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-600 cursor-not-allowed'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              Export MP4
            </button>
          )}
          {exportState === 'rendering' && (
            <button disabled className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-blue-500/30 text-xs font-medium text-blue-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Rendering...
            </button>
          )}
          {exportState === 'done' && exportUrl && (
            <a
              href={exportUrl}
              download="animation.mp4"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/30 text-emerald-400 text-xs font-medium transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Download MP4
            </a>
          )}
          {exportState === 'error' && (
            <button
              onClick={() => setExportState('idle')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-800/50 hover:bg-red-950/60 text-red-400 text-xs font-medium transition-all"
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
          className={`${activePanel === 'preview' ? 'flex' : 'hidden'} md:flex flex-col min-h-0 relative transition-all duration-300 ${
            isCodePanelOpen ? 'md:w-[60%]' : 'md:flex-1'
          }`}
        >
          {/* Vertical gradient divider */}
          {isCodePanelOpen && (
            <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-zinc-700/60 to-transparent pointer-events-none" />
          )}

          <div className="flex-1 min-h-0 p-3 noise-overlay">
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
          className={`${activePanel === 'code' ? 'flex' : 'hidden'} flex-col min-h-0 bg-[#1e1e1e] transition-all duration-300 overflow-hidden ${
            isCodePanelOpen ? 'md:flex md:w-[40%]' : 'md:hidden md:w-0'
          }`}
        >
          {/* Tab header */}
          <div className="flex items-center gap-2 px-3 h-8 border-b border-zinc-800/80 bg-zinc-900/60 shrink-0">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400/70" />
              <span className="text-[11px] text-zinc-500 font-medium">animation.tsx</span>
            </div>
            {(isStreaming || animationState.isCompiling) && (
              <div className="ml-auto flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                <span className="text-[10px] text-zinc-600">
                  {isStreaming ? 'streaming...' : 'compiling...'}
                </span>
              </div>
            )}
            {animationState.Component && !isStreaming && !animationState.isCompiling && (
              <div className="ml-auto flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/70" />
                <span className="text-[10px] text-zinc-600">compiled</span>
              </div>
            )}
          </div>

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
      <div className="border-t border-zinc-800/60 bg-zinc-950 shrink-0 flex flex-col" style={{ maxHeight: '280px' }}>

        {/* Chat header */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800/40 shrink-0">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-violet-400" />
            <span className="text-xs font-medium text-zinc-500">AI Director</span>
          </div>
          {isGenerating && (
            <div className="ml-auto flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 text-violet-400 animate-spin" />
              <span className="text-[10px] text-zinc-600">thinking...</span>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-0">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[78%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  msg.role === 'assistant'
                    ? 'bg-zinc-900 border border-zinc-800/80 text-zinc-300'
                    : 'text-white'
                }`}
                style={
                  msg.role === 'user'
                    ? {
                        background: 'linear-gradient(135deg, #3b82f6, #7c3aed)',
                        boxShadow: '0 0 12px rgba(99, 102, 241, 0.2)',
                      }
                    : {}
                }
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
                  className="w-10 h-10 object-cover rounded-lg border border-zinc-700/60"
                />
                <button
                  onClick={() => setAttachedImages((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-zinc-700 hover:bg-red-600 border border-zinc-600 rounded-full text-zinc-300 text-[10px] flex items-center justify-center transition-colors"
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
            className="p-2 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/80 rounded-lg transition-all shrink-0"
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
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/15 resize-none transition-all"
            style={{ maxHeight: '100px', overflowY: 'auto' }}
          />

          <button
            onClick={handleSend}
            disabled={!input.trim() || isGenerating}
            className={`p-2.5 rounded-xl transition-all shrink-0 ${
              !input.trim() || isGenerating
                ? 'bg-zinc-900 border border-zinc-800 text-zinc-600 cursor-not-allowed'
                : 'btn-gradient-pulse text-white'
            }`}
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
