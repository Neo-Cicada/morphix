'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Send, Download, Loader2, ImagePlus, Code2, Sparkles,
  PanelRightClose, PanelRightOpen, MessageSquare,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { AnimationPlayer } from './AnimationPlayer';
import { useAnimationState } from '@/hooks/useAnimationState';
import { useGenerationApi } from '@/hooks/useGenerationApi';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
}

type ExportState = 'idle' | 'rendering' | 'done' | 'error';
type RightPanel = 'chat' | 'code';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractDuration(code: string): number {
  const upper = code.match(/DURATION_IN_FRAMES\s*=\s*(\d+)/);
  if (upper) return parseInt(upper[1], 10);
  const lower = code.match(/durationInFrames[:\s=]+(\d+)/);
  if (lower) return parseInt(lower[1], 10);
  return 180;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EditorPage() {
  const animationState = useAnimationState();
  const { generate, isGenerating, isStreaming } = useGenerationApi();

  // Player state
  const [durationInFrames, setDurationInFrames] = useState(180);
  const [fps] = useState(30);

  // UI state
  const [rightPanel, setRightPanel] = useState<RightPanel>('chat');
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 0, role: 'assistant', text: "Hi! Describe an animation and I'll generate it for you. You can also follow up to refine it." },
  ]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [streamingCode, setStreamingCode] = useState('');
  const conversationHistory = useRef<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const streamBufferRef = useRef('');

  // Export state
  const [exportState, setExportState] = useState<ExportState>('idle');
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const compileDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Effects ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (animationState.code) {
      setDurationInFrames(extractDuration(animationState.code));
    }
  }, [animationState.code]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const prompt = input.trim();
    if (!prompt || isGenerating) return;

    setMessages((prev) => [...prev, { id: Date.now(), role: 'user', text: prompt }]);
    setInput('');
    const images = [...attachedImages];
    setAttachedImages([]);
    const isFollowUp = animationState.code.length > 0;
    conversationHistory.current.push({ role: 'user', content: prompt });

    const assistantMsgId = Date.now() + 1;
    setMessages((prev) => [...prev, { id: assistantMsgId, role: 'assistant', text: '...' }]);

    if (!isFollowUp) {
      streamBufferRef.current = '';
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
          setMessages((prev) => prev.map((m) =>
            m.id === assistantMsgId ? { ...m, text: 'Animation generated! Refine it by describing changes.' } : m
          ));
        },
        onError: (err) => {
          setStreamingCode('');
          setMessages((prev) => prev.map((m) =>
            m.id === assistantMsgId ? { ...m, text: `Error: ${err}` } : m
          ));
        },
      });
    } else {
      await generate({
        prompt,
        conversationHistory: conversationHistory.current.slice(0, -1),
        currentCode: animationState.code,
        isFollowUp: true,
        frameImages: images,
        onComplete: (patchedCode) => {
          animationState.setCode(patchedCode);
          conversationHistory.current.push({ role: 'assistant', content: 'Applied edit.' });
          setMessages((prev) => prev.map((m) =>
            m.id === assistantMsgId ? { ...m, text: 'Done! Edit applied.' } : m
          ));
        },
        onError: (err) => {
          setMessages((prev) => prev.map((m) =>
            m.id === assistantMsgId ? { ...m, text: `Error: ${err}` } : m
          ));
        },
      });
    }
  }, [input, isGenerating, animationState, generate, attachedImages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleMonacoChange = (value: string | undefined) => {
    if (value === undefined) return;
    if (compileDebounceRef.current) clearTimeout(compileDebounceRef.current);
    compileDebounceRef.current = setTimeout(() => animationState.setCode(value), 500);
  };

  const handleImageAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const base64s: string[] = [];
    for (const file of files) {
      const reader = new FileReader();
      await new Promise<void>((resolve) => {
        reader.onload = () => { base64s.push((reader.result as string).split(',')[1]); resolve(); };
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

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden">

      {/* ── Header ── */}
      <header className="relative flex items-center justify-between px-4 py-2 shrink-0">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent pointer-events-none" />

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

        <div className="flex items-center gap-2">
          {/* Panel toggle */}
          <button
            onClick={() => setIsPanelOpen((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-all"
          >
            {isPanelOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
            <span>{isPanelOpen ? 'Hide panel' : 'Show panel'}</span>
          </button>

          {/* Export */}
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
            <a href={exportUrl} download="animation.mp4" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/30 text-emerald-400 text-xs font-medium transition-all">
              <Download className="w-3.5 h-3.5" />
              Download MP4
            </a>
          )}
          {exportState === 'error' && (
            <button onClick={() => setExportState('idle')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-800/50 hover:bg-red-950/60 text-red-400 text-xs font-medium transition-all">
              Retry Export
            </button>
          )}
        </div>
      </header>

      {/* ── Main: Preview + Right Panel ── */}
      <div className="flex flex-1 min-h-0">

        {/* Preview */}
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

        {/* Right panel */}
        {isPanelOpen && (
          <div className="w-[360px] shrink-0 flex flex-col min-h-0 border-l border-zinc-800/60">

            {/* Tabs */}
            <div className="flex items-center border-b border-zinc-800/60 shrink-0 px-2 pt-1">
              <button
                onClick={() => setRightPanel('chat')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-all ${
                  rightPanel === 'chat'
                    ? 'text-white border-blue-500'
                    : 'text-zinc-500 border-transparent hover:text-zinc-300'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                AI Chat
              </button>
              <button
                onClick={() => setRightPanel('code')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-all ${
                  rightPanel === 'code'
                    ? 'text-white border-blue-500'
                    : 'text-zinc-500 border-transparent hover:text-zinc-300'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                Code
                {(isStreaming || animationState.isCompiling) && (
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse ml-0.5" />
                )}
              </button>
            </div>

            {/* ── Chat ── */}
            {rightPanel === 'chat' && (
              <>
                <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800/40 shrink-0">
                  <Sparkles className="w-3 h-3 text-violet-400" />
                  <span className="text-xs font-medium text-zinc-500">AI Director</span>
                  {isGenerating && (
                    <div className="ml-auto flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 text-violet-400 animate-spin" />
                      <span className="text-[10px] text-zinc-600">thinking...</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-0">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                          msg.role === 'assistant'
                            ? 'bg-zinc-900 border border-zinc-800/80 text-zinc-300'
                            : 'text-white'
                        }`}
                        style={msg.role === 'user' ? {
                          background: 'linear-gradient(135deg, #3b82f6, #7c3aed)',
                          boxShadow: '0 0 12px rgba(99,102,241,0.2)',
                        } : {}}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {attachedImages.length > 0 && (
                  <div className="flex gap-2 px-4 pb-1 shrink-0">
                    {attachedImages.map((img, i) => (
                      <div key={i} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`data:image/jpeg;base64,${img}`} alt="attached" className="w-10 h-10 object-cover rounded-lg border border-zinc-700/60" />
                        <button
                          onClick={() => setAttachedImages((prev) => prev.filter((_, j) => j !== i))}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-zinc-700 hover:bg-red-600 border border-zinc-600 rounded-full text-zinc-300 text-[10px] flex items-center justify-center transition-colors"
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-end gap-2 px-4 py-3 border-t border-zinc-800/40 shrink-0">
                  <input type="file" ref={fileInputRef} onChange={handleImageAttach} accept="image/*" multiple className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="p-2 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/80 rounded-lg transition-all shrink-0">
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
                    {isGenerating
                      ? <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                      : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </>
            )}

            {/* ── Code ── */}
            {rightPanel === 'code' && (
              <div className="flex-1 flex flex-col min-h-0 bg-[#1e1e1e]">
                <div className="flex items-center gap-2 px-3 h-8 border-b border-zinc-800/80 bg-zinc-900/60 shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400/70" />
                  <span className="text-[11px] text-zinc-500 font-medium">animation.tsx</span>
                  <div className="ml-auto flex items-center gap-1.5">
                    {(isStreaming || animationState.isCompiling) && (
                      <>
                        <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                        <span className="text-[10px] text-zinc-600">{isStreaming ? 'streaming...' : 'compiling...'}</span>
                      </>
                    )}
                    {animationState.Component && !isStreaming && !animationState.isCompiling && (
                      <>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/70" />
                        <span className="text-[10px] text-zinc-600">compiled</span>
                      </>
                    )}
                  </div>
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
                      fontSize: 12,
                      lineHeight: 19,
                      wordWrap: 'on',
                      scrollBeyondLastLine: false,
                      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                      fontLigatures: true,
                      padding: { top: 12 },
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
