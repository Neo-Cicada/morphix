'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Send, Download, Loader2, ImagePlus, Code2, Sparkles,
  PanelRightClose, PanelRightOpen, MessageSquare, FilePlus,
  Mic, Volume2, Play, Square, ChevronDown, RefreshCw, Music2, Wand2,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import type { PlayerRef } from '@remotion/player';
import { AnimationPlayer } from './AnimationPlayer';
import { useAnimationState } from '@/hooks/useAnimationState';
import { useGenerationApi } from '@/hooks/useGenerationApi';
import { useEditorPersistence } from '@/hooks/useEditorPersistence';
import { useCloudPersistence } from '@/hooks/useCloudPersistence';
import { useVoice } from '@/hooks/useVoice';
import { useMusic } from '@/hooks/useMusic';
import { MUSIC_PRESETS } from '@/lib/musicPresets';
import { createCodeThumbnail } from '@/lib/thumbnail';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

type ExportState = 'idle' | 'rendering' | 'done' | 'error';
type RightPanel = 'chat' | 'code' | 'voice' | 'music';

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
  const searchParams = useSearchParams();
  const animationState = useAnimationState();
  const { generate, isGenerating, isStreaming } = useGenerationApi();
  const { load, save, clear } = useEditorPersistence();
  const cloud = useCloudPersistence();
  const videoId = searchParams.get('videoId') ?? cloud.videoId;
  const voice = useVoice(videoId);
  const music = useMusic(videoId);

  // Player state
  const [durationInFrames, setDurationInFrames] = useState(180);
  const [fps] = useState(30);
  const playerRef = useRef<PlayerRef | null>(null);

  // UI state
  const [rightPanel, setRightPanel] = useState<RightPanel>('chat');
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'assistant', text: "Hi! Describe an animation and I'll generate it for you. You can also follow up to refine it." },
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

  // Persistence error
  const [persistError, setPersistError] = useState<'quota' | 'unavailable' | null>(null);

  // New animation modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const compileDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Preview audio refs for standalone panel play buttons (separate from Remotion player)
  const voicePreviewRef = useRef<HTMLAudioElement | null>(null);
  const musicPreviewRef = useRef<HTMLAudioElement | null>(null);
  const [voiceOpen, setVoiceOpen] = useState(false);

  // ── Effects ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (animationState.code) {
      setDurationInFrames(extractDuration(animationState.code));
    }
  }, [animationState.code]);

  // Restore persisted state on mount
  useEffect(() => {
    const urlVideoId = searchParams.get('videoId');
    const storedVideoId = cloud.loadStoredVideoId();
    const idToLoad = urlVideoId ?? storedVideoId;

    if (idToLoad) {
      cloud.fetchVideo(idToLoad).then((video) => {
        if (video?.animation_code) {
          cloud.initVideoId(idToLoad);
          animationState.setCode(video.animation_code);
          if (video.production_doc) {
            const doc = video.production_doc;
            if (doc.messages && doc.messages.length > 0) setMessages(doc.messages);
            if (doc.history) conversationHistory.current = doc.history;
            if (doc.duration) setDurationInFrames(doc.duration);
            if (doc.voiceState) voice.restoreFromDoc(doc.voiceState);
            if (doc.musicState) music.restoreFromDoc(doc.musicState);
          }
          return;
        }
        // fallback to localStorage
        const saved = load();
        if (saved.code) animationState.setCode(saved.code);
        if (saved.messages && saved.messages.length > 0) setMessages(saved.messages);
        if (saved.history) conversationHistory.current = saved.history;
        if (saved.duration) setDurationInFrames(saved.duration);
      });
    } else {
      const saved = load();
      if (saved.code) animationState.setCode(saved.code);
      if (saved.messages && saved.messages.length > 0) setMessages(saved.messages);
      if (saved.history) conversationHistory.current = saved.history;
      if (saved.duration) setDurationInFrames(saved.duration);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save state to localStorage (debounced)
  useEffect(() => {
    save(
      {
        code: animationState.code,
        messages,
        history: conversationHistory.current,
        duration: durationInFrames,
      },
      (type) => setPersistError(type),
    );
  }, [animationState.code, messages, durationInFrames, save]);

  // Cloud auto-save (debounced 3s) — only runs after a draft has been created this session
  useEffect(() => {
    if (!cloud.videoId || !animationState.code || streamingCode.length > 0) return;
    cloud.scheduleSave(cloud.videoId, animationState.code, {
      messages,
      history: conversationHistory.current,
      duration: durationInFrames,
      voiceState: voice.enabled ? {
        enabled: voice.enabled,
        selectedVoiceId: voice.selectedVoiceId,
        script: voice.script,
        audioUrl: voice.audioUrl?.startsWith('http') ? voice.audioUrl : null,
        audioDurationSeconds: voice.audioDurationSeconds,
      } : undefined,
      musicState: music.enabled ? {
        enabled: music.enabled,
        selectedPresetId: music.selectedPresetId,
        customPrompt: music.customPrompt,
        audioUrl: music.audioUrl?.startsWith('http') ? music.audioUrl : null,
        volume: music.volume,
      } : undefined,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animationState.code, messages, durationInFrames, cloud.videoId, voice.audioUrl, music.audioUrl]);

  // Sync state from other tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (!['morphix_editor_code', 'morphix_editor_messages', 'morphix_editor_history', 'morphix_editor_duration'].includes(e.key ?? '')) return;
      const saved = load();
      if (saved.code !== undefined && saved.code !== animationState.code) {
        if (saved.code) animationState.setCode(saved.code);
      }
      if (saved.messages && saved.messages.length > 0) {
        setMessages(saved.messages);
      }
      if (saved.history) {
        conversationHistory.current = saved.history;
      }
      if (saved.duration) {
        setDurationInFrames(saved.duration);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-set video duration to match narration length
  useEffect(() => {
    if (voice.enabled && voice.audioDurationSeconds) {
      setDurationInFrames(Math.ceil(voice.audioDurationSeconds * fps));
    }
  }, [voice.audioDurationSeconds, voice.enabled, fps]);


  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const prompt = input.trim();
    if (!prompt || isGenerating) return;

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', text: prompt }]);
    setInput('');
    const images = [...attachedImages];
    setAttachedImages([]);
    const isFollowUp = animationState.code.length > 0;
    conversationHistory.current.push({ role: 'user', content: prompt });

    const assistantMsgId = crypto.randomUUID();
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
          if (!cloud.videoId) {
            const thumbnail = createCodeThumbnail(fullCode, prompt.slice(0, 40));
            cloud.createDraft(prompt.slice(0, 200), fullCode, {
              messages: messages.map((m) =>
                m.id === assistantMsgId ? { ...m, text: 'Animation generated! Refine it by describing changes.' } : m
              ),
              history: conversationHistory.current,
              duration: durationInFrames,
              ...(thumbnail ? { thumbnail } : {}),
            });
          }
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
  }, [input, isGenerating, animationState, generate, attachedImages, cloud.videoId, cloud]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  // Esc closes the new-animation modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showNewModal) setShowNewModal(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showNewModal]);

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

  const handleGenerateScript = async () => {
    setIsGeneratingScript(true);
    try {
      const userPrompt = messages.filter((m) => m.role === 'user').map((m) => m.text).join(' ');
      const res = await fetch('/api/generate-narration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animationCode: animationState.code || undefined,
          userPrompt: userPrompt || undefined,
          durationSeconds: durationInFrames / fps,
        }),
      });
      if (res.ok) {
        const { script } = await res.json();
        voice.setScript(script);
        if (voice.audioUrl) voice.clearAudio();
      }
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleExport = async () => {
    if (!animationState.code) return;
    setExportState('rendering');
    setExportUrl(null);
    try {
      // Upload music and voice to Supabase Storage in parallel so Lambda can access them
      const uploadAudio = async (url: string, filename: string) => {
        // If already a public HTTPS URL (persisted from previous session), use directly
        if (url.startsWith('http')) return url;
        const blob = await fetch(url).then((r) => r.blob());
        const form = new FormData();
        form.append('audio', new File([blob], filename, { type: 'audio/mpeg' }));
        const res = await fetch('/api/upload-audio', { method: 'POST', body: form });
        if (res.ok) return (await res.json()).url as string;
        return undefined;
      };

      const [audioUrl, voiceUrl] = await Promise.all([
        music.enabled && music.audioUrl ? uploadAudio(music.audioUrl, 'music.mp3') : Promise.resolve(undefined),
        voice.enabled && voice.audioUrl ? uploadAudio(voice.audioUrl, 'narration.mp3') : Promise.resolve(undefined),
      ]);

      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: animationState.code, durationInFrames, fps, audioUrl, voiceUrl }),
      });
      if (!res.ok) throw new Error(`Render failed: ${res.status}`);
      const data = await res.json();
      setExportUrl(data.url);
      setExportState('done');
    } catch {
      setExportState('error');
    }
  };

  const handleNewConfirm = useCallback(() => {
    animationState.reset();
    clear();
    cloud.clearVideoId();
    voice.reset();
    music.reset();
    setMessages([{ id: '0', role: 'assistant', text: "Hi! Describe an animation and I'll generate it for you. You can also follow up to refine it." }]);
    conversationHistory.current = [];
    setDurationInFrames(180);
    setExportState('idle');
    setExportUrl(null);
    setShowNewModal(false);
  }, [animationState, clear, cloud, voice, music]);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col bg-[#111110] text-[#FAFAF7] overflow-hidden">

      {/* ── Header ── */}
      <header className="relative flex items-center justify-between px-4 py-2 shrink-0">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C17B4F]/30 to-transparent pointer-events-none" />

        {/* Duration controls */}
        <div className="flex items-center gap-2 text-xs text-[#888884]">
          <label className="flex items-center gap-1.5">
            <span className="text-[#555553]">Frames</span>
            <input
              type="number"
              value={durationInFrames}
              onChange={(e) => setDurationInFrames(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-14 bg-[#1a1a18] border border-[#2e2e2c] rounded-md px-1.5 py-0.5 text-[#FAFAF7] focus:outline-none focus:border-[#C17B4F]/60 focus:ring-1 focus:ring-[#C17B4F]/20 transition-all text-center"
            />
          </label>
          <span className="text-[#3a3a38]">·</span>
          <span className="text-[#555553]">{fps} fps</span>
          <span className="text-[#3a3a38]">·</span>
          <span className="text-[#888884] tabular-nums">{(durationInFrames / fps).toFixed(1)}s</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Cloud save status */}
          {cloud.saveStatus === 'saving' && (
            <span className="flex items-center gap-1 text-xs text-[#888884]">
              <Loader2 className="w-3 h-3 animate-spin" />
              Saving...
            </span>
          )}
          {cloud.saveStatus === 'saved' && (
            <span className="text-xs text-[#555553]">Saved</span>
          )}
          {cloud.saveStatus === 'error' && (
            <span className="text-xs text-red-500">Save failed</span>
          )}

          {/* New animation */}
          {animationState.code && (
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#888884] hover:text-[#FAFAF7] hover:bg-[#1f1f1d] border border-transparent hover:border-[#2a2a28] transition-all"
            >
              <FilePlus className="w-3.5 h-3.5" />
              New
            </button>
          )}

          {/* Panel toggle */}
          <button
            onClick={() => setIsPanelOpen((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#888884] hover:text-[#FAFAF7] hover:bg-[#1f1f1d] border border-transparent hover:border-[#2a2a28] transition-all"
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
                  : 'bg-[#1a1a18] border border-[#2e2e2c] text-[#555553] cursor-not-allowed'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              Export MP4
            </button>
          )}
          {exportState === 'rendering' && (
            <button disabled className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1a18] border border-[#C17B4F]/30 text-xs font-medium text-[#D4A574]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Rendering...
            </button>
          )}
          {exportState === 'done' && exportUrl && (
            <a href={exportUrl} download="animation.mp4" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#5c9e53]/20 border border-[#5c9e53]/40 hover:bg-[#5c9e53]/30 text-[#7ab872] text-xs font-medium transition-all">
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

      {/* ── Persist error banner ── */}
      {persistError && (
        <div className="flex items-center justify-between gap-3 px-4 py-2 bg-amber-950/60 border-b border-amber-700/40 text-amber-300 text-xs shrink-0">
          <span>
            {persistError === 'quota'
              ? 'Auto-save failed: storage is full. Your changes may not be saved.'
              : 'Auto-save unavailable (private browsing?). Your changes will be lost on refresh.'}
          </span>
          <button
            onClick={() => setPersistError(null)}
            className="shrink-0 text-amber-400 hover:text-amber-200 transition-colors"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Main: Preview + Right Panel ── */}
      <div className="flex flex-1 min-h-0">

        {/* Preview */}
        <div className="flex-1 min-h-0 p-3 noise-overlay">
          <AnimationPlayer
            playerRef={playerRef}
            Component={animationState.Component}
            durationInFrames={durationInFrames}
            fps={fps}
            isCompiling={animationState.isCompiling}
            isStreaming={isStreaming}
            streamingChars={streamingCode.length}
            error={animationState.error}
            audioUrl={music.enabled ? music.audioUrl : null}
            voiceUrl={voice.enabled ? voice.audioUrl : null}
          />
        </div>

        {/* Right panel */}
        {isPanelOpen && (
          <div className="w-[360px] shrink-0 flex flex-col min-h-0 border-l border-[#2e2e2c]/60">

            {/* Tabs */}
            <div className="flex items-center border-b border-[#2e2e2c]/60 shrink-0 px-2 pt-1">
              <button
                onClick={() => setRightPanel('chat')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-all ${
                  rightPanel === 'chat'
                    ? 'text-white border-[#C17B4F]'
                    : 'text-[#888884] border-transparent hover:text-[#bbb]'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                AI Chat
              </button>
              <button
                onClick={() => setRightPanel('code')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-all ${
                  rightPanel === 'code'
                    ? 'text-white border-[#C17B4F]'
                    : 'text-[#888884] border-transparent hover:text-[#bbb]'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                Code
                {(isStreaming || animationState.isCompiling) && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C17B4F] animate-pulse ml-0.5" />
                )}
              </button>
              <button
                onClick={() => setRightPanel('voice')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-all ${
                  rightPanel === 'voice'
                    ? 'text-white border-[#C17B4F]'
                    : 'text-[#888884] border-transparent hover:text-[#bbb]'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                Voice
                {voice.enabled && voice.audioUrl && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#5c9e53]/70 ml-0.5" />
                )}
              </button>
              <button
                onClick={() => setRightPanel('music')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-all ${
                  rightPanel === 'music'
                    ? 'text-white border-[#C17B4F]'
                    : 'text-[#888884] border-transparent hover:text-[#bbb]'
                }`}
              >
                <Music2 className="w-3.5 h-3.5" />
                Music
                {music.enabled && music.audioUrl && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#5c9e53]/70 ml-0.5" />
                )}
              </button>
            </div>

            {/* ── Chat ── */}
            {rightPanel === 'chat' && (
              <>
                <div className="flex items-center gap-2 px-4 py-2 border-b border-[#2e2e2c]/40 shrink-0">
                  <Sparkles className="w-3 h-3 text-[#D4A574]" />
                  <span className="text-xs font-medium text-[#888884]">AI Director</span>
                  {isGenerating && (
                    <div className="ml-auto flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 text-[#D4A574] animate-spin" />
                      <span className="text-[10px] text-[#555553]">thinking...</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-0">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                          msg.role === 'assistant'
                            ? 'bg-[#1a1a18] border border-[#2e2e2c]/80 text-[#bbb]'
                            : 'text-white'
                        }`}
                        style={msg.role === 'user' ? {
                          background: '#C17B4F',
                          boxShadow: '0 0 12px rgba(193,123,79,0.2)',
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
                        <img src={`data:image/jpeg;base64,${img}`} alt="attached" className="w-10 h-10 object-cover rounded-lg border border-[#3a3a38]/60" />
                        <button
                          onClick={() => setAttachedImages((prev) => prev.filter((_, j) => j !== i))}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-[#3a3a38] hover:bg-red-600 border border-[#555553] rounded-full text-[#bbb] text-[10px] flex items-center justify-center transition-colors"
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-end gap-2 px-4 py-3 border-t border-[#2e2e2c]/40 shrink-0">
                  <input type="file" ref={fileInputRef} onChange={handleImageAttach} accept="image/*" multiple className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="p-2 text-[#555553] hover:text-[#bbb] hover:bg-[#222220]/80 rounded-lg transition-all shrink-0">
                    <ImagePlus className="w-4 h-4" />
                  </button>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={animationState.code ? 'Describe a change... (⌘↵ to send)' : 'Describe your animation... (⌘↵ to send)'}
                    rows={3}
                    className="flex-1 bg-[#1a1a18] border border-[#2e2e2c] rounded-xl px-3 py-2.5 text-sm text-[#FAFAF7] placeholder-[#555553] focus:outline-none focus:border-[#C17B4F]/50 focus:ring-1 focus:ring-[#C17B4F]/15 resize-none transition-all"
                    style={{ maxHeight: '160px', overflowY: 'auto' }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isGenerating}
                    className={`p-2.5 rounded-xl transition-all shrink-0 ${
                      !input.trim() || isGenerating
                        ? 'bg-[#1a1a18] border border-[#2e2e2c] text-[#555553] cursor-not-allowed'
                        : 'btn-gradient-pulse text-white'
                    }`}
                  >
                    {isGenerating
                      ? <Loader2 className="w-4 h-4 animate-spin text-[#D4A574]" />
                      : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </>
            )}

            {/* ── Code ── */}
            {rightPanel === 'code' && (
              <div className="flex-1 flex flex-col min-h-0 bg-[#1e1e1e]">
                <div className="flex items-center gap-2 px-3 h-8 border-b border-[#2e2e2c]/80 bg-[#141412] shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C17B4F]/70" />
                  <span className="text-[11px] text-[#888884] font-medium">animation.tsx</span>
                  <div className="ml-auto flex items-center gap-1.5">
                    {(isStreaming || animationState.isCompiling) && (
                      <>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#C17B4F] animate-pulse" />
                        <span className="text-[10px] text-[#555553]">{isStreaming ? 'streaming...' : 'compiling...'}</span>
                      </>
                    )}
                    {animationState.Component && !isStreaming && !animationState.isCompiling && (
                      <>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#5c9e53]/70" />
                        <span className="text-[10px] text-[#555553]">compiled</span>
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

            {/* ── Voice ── */}
            {rightPanel === 'voice' && (
              <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
                {/* Header */}
                <div className="flex items-center gap-2 px-4 py-2 border-b border-[#2e2e2c]/40 shrink-0">
                  <Volume2 className="w-3 h-3 text-[#D4A574]" />
                  <span className="text-xs font-medium text-[#888884]">Voice Narration</span>
                  <div className="ml-auto">
                    <button
                      onClick={() => voice.setEnabled(!voice.enabled)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                        voice.enabled ? 'bg-[#C17B4F]' : 'bg-[#2e2e2c]'
                      }`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                        voice.enabled ? 'translate-x-4' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                </div>

                {!voice.enabled ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{
                      background: 'rgba(193,123,79,0.1)',
                      border: '1px solid rgba(193,123,79,0.2)',
                    }}>
                      <Mic className="w-5 h-5 text-[#C17B4F]" />
                    </div>
                    <div>
                      <p className="text-[#bbb] text-sm font-medium mb-1">Add voice narration</p>
                      <p className="text-[#888884] text-xs leading-relaxed">Enable to add an AI voice that reads your script alongside the animation.</p>
                    </div>
                    <button
                      onClick={() => voice.setEnabled(true)}
                      className="mt-1 px-4 py-1.5 rounded-lg text-xs font-medium btn-gradient text-white transition-all"
                    >
                      Enable Voice
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 p-4">
                    {/* Voice selector */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-[#888884] uppercase tracking-wider">Voice</label>
                      {voice.status === 'loading-voices' ? (
                        <div className="flex items-center gap-2 h-9 px-3 bg-[#1a1a18] border border-[#2e2e2c] rounded-lg">
                          <Loader2 className="w-3.5 h-3.5 text-[#D4A574] animate-spin shrink-0" />
                          <span className="text-xs text-[#555553]">Loading voices...</span>
                        </div>
                      ) : voice.voices.length === 0 ? (
                        <button
                          onClick={() => voice.setEnabled(true)}
                          className="flex items-center gap-2 w-full h-9 px-3 bg-[#1a1a18] border border-[#2e2e2c] rounded-lg text-xs text-[#D4A574] hover:border-[#C17B4F]/40 transition-all"
                        >
                          <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                          Retry loading voices
                        </button>
                      ) : (
                        <div className="relative">
                          <select
                            value={voice.selectedVoiceId}
                            onChange={(e) => voice.setSelectedVoiceId(e.target.value)}
                            className="w-full appearance-none bg-[#1a1a18] border border-[#2e2e2c] rounded-lg px-3 py-2 text-sm text-[#FAFAF7] focus:outline-none focus:border-[#C17B4F]/50 focus:ring-1 focus:ring-[#C17B4F]/15 transition-all pr-8"
                          >
                            {voice.voices.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.name}{v.gender ? ` · ${v.gender}` : ''}{v.accent ? ` · ${v.accent}` : ''}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#555553] pointer-events-none" />
                        </div>
                      )}
                      {/* Voice preview button */}
                      {voice.selectedVoiceId && (() => {
                        const v = voice.voices.find((x) => x.id === voice.selectedVoiceId);
                        return v?.previewUrl ? (
                          <button
                            onClick={() => {
                              const a = new Audio(v.previewUrl);
                              a.play().catch(() => undefined);
                            }}
                            className="flex items-center gap-1.5 text-[11px] text-[#888884] hover:text-[#D4A574] transition-colors"
                          >
                            <Play className="w-3 h-3" />
                            Preview voice sample
                          </button>
                        ) : null;
                      })()}
                    </div>

                    {/* Script textarea */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-medium text-[#888884] uppercase tracking-wider">Narration Script</label>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] tabular-nums ${voice.script.length > 4800 ? 'text-amber-400' : 'text-[#3a3a38]'}`}>
                            {voice.script.length}/5000
                          </span>
                          <button
                            onClick={handleGenerateScript}
                            disabled={isGeneratingScript || (!animationState.code && messages.filter(m => m.role === 'user').length === 0)}
                            title="Generate script with AI based on your animation"
                            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-[#C17B4F]/15 text-[#D4A574] hover:bg-[#C17B4F]/25 border border-[#C17B4F]/20"
                          >
                            {isGeneratingScript ? (
                              <Loader2 className="w-2.5 h-2.5 animate-spin" />
                            ) : (
                              <Wand2 className="w-2.5 h-2.5" />
                            )}
                            {isGeneratingScript ? 'Writing…' : 'AI Write'}
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={voice.script}
                        onChange={(e) => {
                          voice.setScript(e.target.value);
                          if (voice.audioUrl) voice.clearAudio();
                        }}
                        placeholder="Write the narration yourself, or click AI Write to generate one from your animation..."
                        rows={6}
                        maxLength={5000}
                        className="w-full bg-[#1a1a18] border border-[#2e2e2c] rounded-xl px-3 py-2.5 text-sm text-[#FAFAF7] placeholder-[#555553] focus:outline-none focus:border-[#C17B4F]/50 focus:ring-1 focus:ring-[#C17B4F]/15 resize-none transition-all leading-relaxed"
                      />
                    </div>

                    {/* Error */}
                    {voice.status === 'error' && voice.errorMessage && (
                      <div className="flex items-start gap-2 px-3 py-2.5 bg-red-950/40 border border-red-800/50 rounded-lg">
                        <span className="text-[11px] text-red-400 leading-relaxed">{voice.errorMessage}</span>
                      </div>
                    )}

                    {/* Generate button */}
                    <button
                      onClick={voice.generateAudio}
                      disabled={!voice.script.trim() || !voice.selectedVoiceId || voice.status === 'generating' || voice.status === 'loading-voices'}
                      className={`flex items-center justify-center gap-2 w-full py-2 rounded-xl text-sm font-medium transition-all ${
                        !voice.script.trim() || !voice.selectedVoiceId || voice.status === 'generating' || voice.status === 'loading-voices'
                          ? 'bg-[#1a1a18] border border-[#2e2e2c] text-[#555553] cursor-not-allowed'
                          : voice.audioUrl
                            ? 'bg-[#1a1a18] border border-[#C17B4F]/40 text-[#D4A574] hover:bg-[#C17B4F]/10'
                            : 'btn-gradient text-white'
                      }`}
                    >
                      {voice.status === 'generating' ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Generating...
                        </>
                      ) : voice.audioUrl ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5" />
                          Regenerate
                        </>
                      ) : (
                        <>
                          <Mic className="w-3.5 h-3.5" />
                          Generate Voice
                        </>
                      )}
                    </button>

                    {/* Audio player */}
                    {voice.audioUrl && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#5c9e53]/70" />
                          <span className="text-[11px] text-[#888884]">Audio ready · plays in sync with animation</span>
                        </div>
                        <div
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                          style={{ background: 'rgba(92,158,83,0.08)', border: '1px solid rgba(92,158,83,0.2)' }}
                        >
                          <button
                            onClick={() => {
                              if (!voice.audioUrl) return;
                              const a = voicePreviewRef.current;
                              if (a && !a.paused) {
                                a.pause();
                                setVoiceOpen(false);
                              } else {
                                const audio = new Audio(voice.audioUrl);
                                voicePreviewRef.current = audio;
                                audio.onended = () => setVoiceOpen(false);
                                audio.play().catch(() => undefined);
                                setVoiceOpen(true);
                              }
                            }}
                            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all hover:scale-105"
                            style={{ background: 'rgba(92,158,83,0.2)', border: '1px solid rgba(92,158,83,0.3)' }}
                          >
                            {voiceOpen ? <Square className="w-3 h-3 text-[#7ab872]" /> : <Play className="w-3 h-3 text-[#7ab872]" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-[#7ab872] font-medium truncate">
                              {voice.voices.find((v) => v.id === voice.selectedVoiceId)?.name ?? 'Voice'}
                            </p>
                            <p className="text-[10px] text-[#3a3a38] mt-0.5">narration.mp3</p>
                          </div>
                          <a
                            href={voice.audioUrl}
                            download="narration.mp3"
                            className="p-1.5 rounded-lg text-[#555553] hover:text-[#7ab872] hover:bg-[#5c9e53]/10 transition-all"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {/* ── Music ── */}
            {rightPanel === 'music' && (
              <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
                {/* Header */}
                <div className="flex items-center gap-2 px-4 py-2 border-b border-[#2e2e2c]/40 shrink-0">
                  <Music2 className="w-3 h-3 text-[#D4A574]" />
                  <span className="text-xs font-medium text-[#888884]">Background Music</span>
                  <div className="ml-auto">
                    <button
                      onClick={() => music.setEnabled(!music.enabled)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                        music.enabled ? 'bg-[#C17B4F]' : 'bg-[#2e2e2c]'
                      }`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                        music.enabled ? 'translate-x-4' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                </div>

                {!music.enabled ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{
                      background: 'rgba(193,123,79,0.1)',
                      border: '1px solid rgba(193,123,79,0.2)',
                    }}>
                      <Music2 className="w-5 h-5 text-[#C17B4F]" />
                    </div>
                    <div>
                      <p className="text-[#bbb] text-sm font-medium mb-1">Add background music</p>
                      <p className="text-[#888884] text-xs leading-relaxed">Generate AI music by ElevenLabs that plays alongside your animation. Choose from presets or write your own prompt.</p>
                    </div>
                    <button
                      onClick={() => music.setEnabled(true)}
                      className="mt-1 px-4 py-1.5 rounded-lg text-xs font-medium btn-gradient text-white transition-all"
                    >
                      Enable Music
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 p-4">
                    {/* Category presets */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-[#888884] uppercase tracking-wider">Style</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {MUSIC_PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            onClick={() => {
                              music.setSelectedPresetId(preset.id);
                              if (music.audioUrl) music.clearMusic();
                            }}
                            className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all ${
                              music.selectedPresetId === preset.id
                                ? 'bg-[#C17B4F]/15 border border-[#C17B4F]/50 text-[#D4A574]'
                                : 'bg-[#1a1a18] border border-[#2e2e2c] text-[#888884] hover:border-[#3a3a38] hover:text-[#bbb]'
                            }`}
                          >
                            <span className="text-base leading-none">{preset.emoji}</span>
                            <div className="min-w-0">
                              <p className="text-[11px] font-medium truncate">{preset.label}</p>
                              <p className="text-[10px] text-[#555553] truncate">{preset.description}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom prompt */}
                    {music.selectedPresetId === 'custom' && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-medium text-[#888884] uppercase tracking-wider">Music Prompt</label>
                          <span className={`text-[10px] tabular-nums ${music.customPrompt.length > 900 ? 'text-amber-400' : 'text-[#3a3a38]'}`}>
                            {music.customPrompt.length}/1000
                          </span>
                        </div>
                        <textarea
                          value={music.customPrompt}
                          onChange={(e) => {
                            music.setCustomPrompt(e.target.value);
                            if (music.audioUrl) music.clearMusic();
                          }}
                          placeholder="Describe the music you want... e.g. 'Upbeat jazz with piano and light drums, energetic and fun'"
                          rows={4}
                          maxLength={1000}
                          className="w-full bg-[#1a1a18] border border-[#2e2e2c] rounded-xl px-3 py-2.5 text-sm text-[#FAFAF7] placeholder-[#555553] focus:outline-none focus:border-[#C17B4F]/50 focus:ring-1 focus:ring-[#C17B4F]/15 resize-none transition-all leading-relaxed"
                        />
                      </div>
                    )}

                    {/* Volume */}
                    {music.audioUrl && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-medium text-[#888884] uppercase tracking-wider">Volume</label>
                          <span className="text-[10px] text-[#555553] tabular-nums">{Math.round(music.volume * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.05}
                          value={music.volume}
                          onChange={(e) => music.setVolume(parseFloat(e.target.value))}
                          className="w-full accent-[#C17B4F]"
                        />
                      </div>
                    )}

                    {/* Error */}
                    {music.status === 'error' && music.errorMessage && (
                      <div className="flex items-start gap-2 px-3 py-2.5 bg-red-950/40 border border-red-800/50 rounded-lg">
                        <span className="text-[11px] text-red-400 leading-relaxed">{music.errorMessage}</span>
                      </div>
                    )}

                    {/* Generate button */}
                    <button
                      onClick={() => music.generateMusic(Math.round((durationInFrames / fps) * 1000))}
                      disabled={
                        music.status === 'generating' ||
                        (music.selectedPresetId === 'custom' && !music.customPrompt.trim())
                      }
                      className={`flex items-center justify-center gap-2 w-full py-2 rounded-xl text-sm font-medium transition-all ${
                        music.status === 'generating' ||
                        (music.selectedPresetId === 'custom' && !music.customPrompt.trim())
                          ? 'bg-[#1a1a18] border border-[#2e2e2c] text-[#555553] cursor-not-allowed'
                          : music.audioUrl
                            ? 'bg-[#1a1a18] border border-[#C17B4F]/40 text-[#D4A574] hover:bg-[#C17B4F]/10'
                            : 'btn-gradient text-white'
                      }`}
                    >
                      {music.status === 'generating' ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Generating...
                        </>
                      ) : music.audioUrl ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5" />
                          Regenerate
                        </>
                      ) : (
                        <>
                          <Music2 className="w-3.5 h-3.5" />
                          Generate Music
                        </>
                      )}
                    </button>

                    {/* Audio player */}
                    {music.audioUrl && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#5c9e53]/70" />
                          <span className="text-[11px] text-[#888884]">Music ready · loops with animation</span>
                        </div>
                        <div
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                          style={{ background: 'rgba(92,158,83,0.08)', border: '1px solid rgba(92,158,83,0.2)' }}
                        >
                          <button
                            onClick={() => {
                              if (!music.audioUrl) return;
                              const a = musicPreviewRef.current;
                              if (a && !a.paused) {
                                a.pause();
                              } else {
                                const audio = new Audio(music.audioUrl);
                                musicPreviewRef.current = audio;
                                audio.play().catch(() => undefined);
                              }
                            }}
                            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all hover:scale-105"
                            style={{ background: 'rgba(92,158,83,0.2)', border: '1px solid rgba(92,158,83,0.3)' }}
                          >
                            <Play className="w-3 h-3 text-[#7ab872]" />
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-[#7ab872] font-medium truncate">
                              {MUSIC_PRESETS.find((p) => p.id === music.selectedPresetId)?.label ?? 'Music'}
                            </p>
                            <p className="text-[10px] text-[#3a3a38] mt-0.5">background.mp3 · loops</p>
                          </div>
                          <a
                            href={music.audioUrl}
                            download="background-music.mp3"
                            className="p-1.5 rounded-lg text-[#555553] hover:text-[#7ab872] hover:bg-[#5c9e53]/10 transition-all"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── New Animation Modal ── */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a18] border border-[#2e2e2c] rounded-2xl p-6 w-80 shadow-2xl">
            <h2 className="text-sm font-semibold text-[#FAFAF7] mb-2">Start a new animation?</h2>
            <p className="text-xs text-[#888884] mb-6 leading-relaxed">Your current code and chat history will be cleared.</p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#888884] hover:text-[#FAFAF7] hover:bg-[#222220] border border-[#2e2e2c] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleNewConfirm}
                className="px-3 py-1.5 rounded-lg text-xs font-medium btn-gradient text-white transition-all"
              >
                New Animation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
