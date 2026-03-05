'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight,
  Send, Sparkles, Film, Type, Square, Trash2, Plus, Loader2, Download,
  Undo2, Redo2, LayoutTemplate, Video, Music,
} from 'lucide-react';
import { Player, type PlayerRef } from '@remotion/player';
import { MorphixVideo } from '@/remotion/MorphixVideo';
import {
  type Scene, type Layer, type TextLayer, type ShapeLayer,
  type VideoLayer, type AudioLayer,
  type SceneKeyframe, DEFAULT_SCENE, getTrackColor,
} from '@/remotion/schema';
import { api } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import { uploadMedia } from '@/utils/uploadMedia';
import { TemplateModal } from './TemplateModal';
import { useWaveform } from '@/hooks/useWaveform';
import { WaveformCanvas } from './WaveformCanvas';

// ─── Constants ────────────────────────────────────────────────────────────────

const PX_PER_FRAME = 5;
const MIN_CLIP_F   = 10;

// ─── Drag operation types ─────────────────────────────────────────────────────

type DragOp =
  | { kind: 'move';  id: string; ox: number; os: number; ok: SceneKeyframe[] }
  | { kind: 'left';  id: string; ox: number; os: number; od: number }
  | { kind: 'right'; id: string; ox: number; od: number };

// ─── Chat types ───────────────────────────────────────────────────────────────

interface ChatMessage { id: number; role: 'user' | 'assistant'; text: string; }

const INITIAL_MESSAGES: ChatMessage[] = [{
  id: 0, role: 'assistant',
  text: 'Hi! I can help you edit your video. Try "trim the last 2 seconds" or "add a fade-in transition".',
}];

function fmtTimecode(frame: number, fps: number): string {
  const totalSec = Math.floor(frame / fps);
  const mm = Math.floor(totalSec / 60);
  const ss = totalSec % 60;
  const ff = frame % fps;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}:${String(ff).padStart(2, '0')}`;
}

// ─── Ruler heights / track sizes ──────────────────────────────────────────────

const RULER_H = 32;
const TRACK_H = 36;

// ─── Properties panel ─────────────────────────────────────────────────────────

const P_IN: React.CSSProperties = {
  width: '100%', padding: '3px 7px', fontSize: 11, color: '#ccc',
  background: '#111', border: '1px solid #1a1a1a', borderRadius: 5,
  outline: 'none', fontFamily: 'inherit',
};

const P_SELECT: React.CSSProperties = {
  ...P_IN, cursor: 'pointer', appearance: 'none' as const,
  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'8\' height=\'4\' viewBox=\'0 0 8 4\'%3E%3Cpath fill=\'%23555\' d=\'M0 0l4 4 4-4z\'/%3E%3C/svg%3E")',
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 7px center',
  paddingRight: 20,
};

function r(v: number, d = 1) { return Math.round(v * 10 ** d) / 10 ** d; }

function PropertiesPanel({
  layer, onUpdate, onAdd, onAddVideo, onAddAudio, onDelete, onDeleteKeyframe,
}: {
  layer: Layer | null;
  onUpdate: (id: string, patch: Record<string, unknown>) => void;
  onAdd: (type: 'text' | 'shape') => void;
  onAddVideo: () => void;
  onAddAudio: () => void;
  onDelete: (id: string) => void;
  onDeleteKeyframe: (layerId: string, index: number) => void;
}) {
  const Section = ({ label }: { label: string }) => (
    <p style={{
      fontSize: 9, color: '#383838', textTransform: 'uppercase', letterSpacing: 1.5,
      borderBottom: '1px solid #161616', paddingBottom: 5, marginTop: 14, marginBottom: 8,
    }}>
      {label}
    </p>
  );

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ minWidth: 0 }}>
      <p style={{ fontSize: 9, color: '#3d3d3d', marginBottom: 3, letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</p>
      {children}
    </div>
  );

  const G2 = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginBottom: 5 }}>
      {children}
    </div>
  );

  const num = (prop: keyof Layer, step = 1) => (
    <input
      type="number" step={step} style={P_IN}
      value={r(layer![prop] as number, step < 1 ? 2 : 0)}
      onChange={e => onUpdate(layer!.id, { [prop]: parseFloat(e.target.value) || 0 })}
    />
  );

  // sorted keyframes for display, keeping original index for deletion
  const sortedKfs = layer
    ? layer.keyframes
        .map((kf, i) => ({ kf, i }))
        .sort((a, b) => a.kf.frame - b.kf.frame)
    : [];

  const btnStyle: React.CSSProperties = {
    padding: '3px 6px', border: '1px solid #1e1e1e',
    background: 'rgba(255,255,255,0.03)', color: '#666', borderRadius: 5,
  };

  return (
    <div className="flex-shrink-0 flex flex-col overflow-hidden"
      style={{ width: 220, borderRight: '1px solid #1a1a1a', background: '#0a0a0a' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-3 flex-shrink-0"
        style={{ height: 44, borderBottom: '1px solid #1a1a1a' }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Properties
        </span>
        <div className="flex gap-1">
          <button onClick={() => onAdd('text')} title="Add Text"
            className="flex items-center gap-1 rounded-md transition-colors duration-150 cursor-pointer hover:bg-white/[0.06]"
            style={btnStyle}>
            <Type size={10} />
            <span style={{ fontSize: 10 }}>Text</span>
          </button>
          <button onClick={() => onAdd('shape')} title="Add Shape"
            className="flex items-center gap-1 rounded-md transition-colors duration-150 cursor-pointer hover:bg-white/[0.06]"
            style={btnStyle}>
            <Square size={10} />
            <span style={{ fontSize: 10 }}>Shape</span>
          </button>
          <button onClick={onAddVideo} title="Add Video"
            className="flex items-center gap-1 rounded-md transition-colors duration-150 cursor-pointer hover:bg-white/[0.06]"
            style={btnStyle}>
            <Video size={10} />
          </button>
          <button onClick={onAddAudio} title="Add Audio"
            className="flex items-center gap-1 rounded-md transition-colors duration-150 cursor-pointer hover:bg-white/[0.06]"
            style={btnStyle}>
            <Music size={10} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0, padding: '8px 12px 20px' }}>
        {!layer ? (
          <div className="flex flex-col items-center justify-center h-full gap-3"
            style={{ opacity: 0.4, paddingTop: 48 }}>
            <div style={{ fontSize: 28, lineHeight: 1 }}>↖</div>
            <p style={{ fontSize: 11, color: '#555', textAlign: 'center', lineHeight: 1.6 }}>
              Click a clip<br />to inspect
            </p>
          </div>
        ) : (
          <>
            {/* Layer name + delete */}
            <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
              <input
                type="text" style={{ ...P_IN, flex: 1, marginRight: 6 }}
                value={layer.label}
                onChange={e => onUpdate(layer.id, { label: e.target.value })}
              />
              <button onClick={() => onDelete(layer.id)} title="Delete layer"
                className="flex items-center justify-center rounded cursor-pointer transition-colors"
                style={{
                  width: 24, height: 24, flexShrink: 0,
                  border: '1px solid #1e1e1e', background: 'rgba(239,68,68,0.08)', color: '#555',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#555'; e.currentTarget.style.borderColor = '#1e1e1e'; }}
              >
                <Trash2 size={11} />
              </button>
            </div>

            {/* ── Timing ──────────────────────────────────────── */}
            <Section label="Timing" />
            <G2>
              <Field label="Start f">
                <input type="number" step={1} style={P_IN}
                  value={layer.from}
                  onChange={e => onUpdate(layer.id, { from: Math.max(0, parseInt(e.target.value) || 0) })} />
              </Field>
              <Field label="Duration f">
                <input type="number" step={1} style={P_IN}
                  value={layer.durationInFrames}
                  onChange={e => onUpdate(layer.id, { durationInFrames: Math.max(MIN_CLIP_F, parseInt(e.target.value) || MIN_CLIP_F) })} />
              </Field>
            </G2>

            {/* ── Transform (hide for audio) ───────────────────── */}
            {layer.type !== 'audio' && (
              <>
                <Section label="Transform" />
                <G2>
                  <Field label="X px">{num('x')}</Field>
                  <Field label="Y px">{num('y')}</Field>
                  <Field label="Scale">{num('scale', 0.01)}</Field>
                  <Field label="Rotation °">{num('rotation')}</Field>
                </G2>
                <Field label="Opacity">
                  <input type="number" step={0.01} min={0} max={1} style={P_IN}
                    value={r(layer.opacity, 2)}
                    onChange={e => onUpdate(layer.id, { opacity: Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)) })} />
                </Field>
              </>
            )}

            {/* ── Appearance ──────────────────────────────────── */}
            {'color' in layer && (
              <>
                <Section label="Appearance" />
                <Field label="Color">
                  <div className="flex gap-2 items-center">
                    <input type="color" value={layer.color as string}
                      onChange={e => onUpdate(layer.id, { color: e.target.value })}
                      style={{
                        width: 28, height: 24, borderRadius: 4, border: '1px solid #1a1a1a',
                        background: 'none', padding: '1px 2px', cursor: 'pointer', flexShrink: 0,
                      }} />
                    <input type="text" style={{ ...P_IN, flex: 1 }} value={layer.color as string}
                      onChange={e => onUpdate(layer.id, { color: e.target.value })} />
                  </div>
                </Field>
              </>
            )}

            {/* ── Text fields ──────────────────────────────────── */}
            {layer.type === 'text' && (
              <>
                <Section label="Text" />
                <Field label="Content">
                  <input type="text" style={P_IN} value={layer.content}
                    onChange={e => onUpdate(layer.id, { content: e.target.value })} />
                </Field>
                <G2>
                  <Field label="Font size">
                    <input type="number" step={1} style={P_IN} value={layer.fontSize}
                      onChange={e => onUpdate(layer.id, { fontSize: parseInt(e.target.value) || 12 })} />
                  </Field>
                  <Field label="Weight">
                    <select style={P_SELECT} value={layer.fontWeight}
                      onChange={e => onUpdate(layer.id, { fontWeight: parseInt(e.target.value) })}>
                      {[300, 400, 500, 600, 700, 800].map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </Field>
                  <Field label="Spacing">
                    <input type="number" step={0.5} style={P_IN} value={layer.letterSpacing}
                      onChange={e => onUpdate(layer.id, { letterSpacing: parseFloat(e.target.value) || 0 })} />
                  </Field>
                </G2>
              </>
            )}

            {/* ── Shape fields ─────────────────────────────────── */}
            {layer.type === 'shape' && (
              <>
                <Section label="Shape" />
                <G2>
                  <Field label="Width px">
                    <input type="number" step={1} style={P_IN} value={r(layer.width)}
                      onChange={e => onUpdate(layer.id, { width: parseFloat(e.target.value) || 1 })} />
                  </Field>
                  <Field label="Height px">
                    <input type="number" step={1} style={P_IN} value={r(layer.height)}
                      onChange={e => onUpdate(layer.id, { height: parseFloat(e.target.value) || 1 })} />
                  </Field>
                  <Field label="Type">
                    <select style={P_SELECT} value={layer.shape}
                      onChange={e => onUpdate(layer.id, { shape: e.target.value })}>
                      <option value="rect">Rect</option>
                      <option value="circle">Circle</option>
                    </select>
                  </Field>
                  <Field label="Blur px">
                    <input type="number" step={1} min={0} style={P_IN} value={layer.blur}
                      onChange={e => onUpdate(layer.id, { blur: parseInt(e.target.value) || 0 })} />
                  </Field>
                </G2>
              </>
            )}

            {/* ── Video fields ─────────────────────────────────── */}
            {layer.type === 'video' && (
              <>
                <Section label="Video" />
                <G2>
                  <Field label="Width px">
                    <input type="number" step={1} style={P_IN} value={r(layer.width)}
                      onChange={e => onUpdate(layer.id, { width: parseFloat(e.target.value) || 1 })} />
                  </Field>
                  <Field label="Height px">
                    <input type="number" step={1} style={P_IN} value={r(layer.height)}
                      onChange={e => onUpdate(layer.id, { height: parseFloat(e.target.value) || 1 })} />
                  </Field>
                  <Field label="Volume">
                    <input type="number" step={0.01} min={0} max={1} style={P_IN} value={r(layer.volume, 2)}
                      onChange={e => onUpdate(layer.id, { volume: Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)) })} />
                  </Field>
                  <Field label="Start f">
                    <input type="number" step={1} min={0} style={P_IN} value={layer.startFrom}
                      onChange={e => onUpdate(layer.id, { startFrom: Math.max(0, parseInt(e.target.value) || 0) })} />
                  </Field>
                  <Field label="Speed">
                    <input type="number" step={0.1} min={0.1} max={4} style={P_IN} value={r(layer.playbackRate, 2)}
                      onChange={e => onUpdate(layer.id, { playbackRate: Math.max(0.1, parseFloat(e.target.value) || 1) })} />
                  </Field>
                </G2>
              </>
            )}

            {/* ── Audio fields ─────────────────────────────────── */}
            {layer.type === 'audio' && (
              <>
                <Section label="Audio" />
                <G2>
                  <Field label="Volume">
                    <input type="number" step={0.01} min={0} max={1} style={P_IN} value={r(layer.volume, 2)}
                      onChange={e => onUpdate(layer.id, { volume: Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)) })} />
                  </Field>
                  <Field label="Start f">
                    <input type="number" step={1} min={0} style={P_IN} value={layer.startFrom}
                      onChange={e => onUpdate(layer.id, { startFrom: Math.max(0, parseInt(e.target.value) || 0) })} />
                  </Field>
                  <Field label="Speed">
                    <input type="number" step={0.1} min={0.1} max={4} style={P_IN} value={r(layer.playbackRate, 2)}
                      onChange={e => onUpdate(layer.id, { playbackRate: Math.max(0.1, parseFloat(e.target.value) || 1) })} />
                  </Field>
                </G2>
              </>
            )}

            {/* ── Keyframes ────────────────────────────────────── */}
            {layer.type !== 'audio' && (
              <>
                <Section label={`Keyframes (${layer.keyframes.length})`} />
                {sortedKfs.length === 0 && (
                  <p style={{ fontSize: 10, color: '#333', fontStyle: 'italic' }}>No keyframes</p>
                )}
                {sortedKfs.map(({ kf, i }) => (
                  <div key={i} className="flex items-center gap-1.5" style={{ marginBottom: 3 }}>
                    <span style={{ fontSize: 9, color: '#3b82f6', fontFamily: 'monospace', minWidth: 30 }}>
                      f{kf.frame}
                    </span>
                    <span style={{ fontSize: 9, color: '#555', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                      {kf.prop}
                    </span>
                    <span style={{ fontSize: 9, color: '#666', minWidth: 34, textAlign: 'right', fontFamily: 'monospace' }}>
                      {r(kf.value, 2)}
                    </span>
                    <button onClick={() => onDeleteKeyframe(layer.id, i)}
                      className="flex items-center justify-center cursor-pointer rounded transition-colors"
                      style={{
                        width: 16, height: 16, flexShrink: 0, fontSize: 10,
                        color: '#333', border: 'none', background: 'none',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#333'; }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── AudioTrackRow ────────────────────────────────────────────────────────────

function AudioTrackRow({
  layer, isSelected, onMove,
}: {
  layer: AudioLayer;
  isSelected: boolean;
  onMove: (e: React.MouseEvent, id: string) => void;
}) {
  const waveform = useWaveform(layer.src);
  const clipW = layer.durationInFrames * PX_PER_FRAME;

  return (
    <div
      className={`tl-clip absolute${isSelected ? ' selected' : ''}`}
      style={{
        top: 4, height: TRACK_H - 8,
        left: layer.from * PX_PER_FRAME,
        width: clipW,
        background: isSelected ? '#22c55e35' : '#22c55e22',
        border: `1px solid ${isSelected ? '#22c55eaa' : '#22c55e55'}`,
        borderRadius: 5, cursor: 'grab', minWidth: 8, userSelect: 'none',
        position: 'relative', overflow: 'hidden',
      }}
      onMouseDown={e => onMove(e, layer.id)}
    >
      {waveform.length > 0 && (
        <WaveformCanvas waveform={waveform} color="#22c55e" width={clipW} height={TRACK_H - 8} />
      )}
      <span className="absolute pointer-events-none truncate select-none"
        style={{
          left: 8, right: 8, top: '50%', transform: 'translateY(-50%)',
          fontSize: 10, color: '#22c55e', fontWeight: 600,
          zIndex: 1,
        }}>
        {layer.label}
      </span>
    </div>
  );
}

// ─── EditorPage ───────────────────────────────────────────────────────────────

export function EditorPage() {
  const { user } = useUser();

  /* ── State ──────────────────────────────────────────────────────────── */
  const [scene,        setScene]        = useState<Scene>(() => structuredClone(DEFAULT_SCENE));
  const [selectedId,   setSelectedId]   = useState<string | null>(null);
  const [frame,        setFrame]        = useState(0);
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [messages,     setMessages]     = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input,        setInput]        = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
  const [isAiLoading,  setIsAiLoading]   = useState(false);
  const [renderStatus, setRenderStatus] = useState<'idle' | 'queued' | 'rendering' | 'done' | 'failed'>('idle');
  const [outputUrl,    setOutputUrl]    = useState<string | null>(null);
  const [jobId,        setJobId]        = useState<string>(() => crypto.randomUUID());
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [brandContext, setBrandContext] = useState('');
  const [brandContextOpen, setBrandContextOpen] = useState(false);

  // Undo/Redo
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const historyRef = useRef<Scene[]>([]);
  const futureRef  = useRef<Scene[]>([]);

  const playerRef      = useRef<PlayerRef>(null);
  const pollRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const clipAreaRef    = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dragRef        = useRef<DragOp | null>(null);
  const nextIdRef      = useRef(scene.layers.length + 1);
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const videoInputRef  = useRef<HTMLInputElement>(null);
  const audioInputRef  = useRef<HTMLInputElement>(null);

  // Keep sceneRef/frameRef in sync so callbacks can read current values without stale closure
  const sceneRef = useRef<Scene>(scene);
  sceneRef.current = scene;
  const frameRef = useRef(frame);
  frameRef.current = frame;

  const TOTAL_FRAMES = scene.durationInFrames;
  const FPS          = scene.fps;
  const TOTAL_PX     = TOTAL_FRAMES * PX_PER_FRAME;

  /* ── History helpers ─────────────────────────────────────────────── */
  const pushHistory = useCallback((snapshot: Scene) => {
    historyRef.current = [...historyRef.current.slice(-49), structuredClone(snapshot)];
    futureRef.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, []);

  const undo = useCallback(() => {
    const prev = historyRef.current.pop();
    if (!prev) return;
    futureRef.current = [structuredClone(sceneRef.current), ...futureRef.current];
    setScene(prev);
    setCanUndo(historyRef.current.length > 0);
    setCanRedo(true);
  }, []);

  const redo = useCallback(() => {
    const next = futureRef.current.shift();
    if (!next) return;
    historyRef.current = [...historyRef.current, structuredClone(sceneRef.current)];
    setScene(next);
    setCanUndo(true);
    setCanRedo(futureRef.current.length > 0);
  }, []);

  /* ── Keyboard shortcuts ──────────────────────────────────────────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (inputFocused) return;
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      else if (e.key === 'z' && e.shiftKey) { e.preventDefault(); redo(); }
      else if (e.key === 'y') { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inputFocused, undo, redo]);

  /* ── Sync frame from Player ──────────────────────────────────────── */
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const onFrame = () => {
      const f = player.getCurrentFrame();
      setFrame(f);
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => { setIsPlaying(false); setFrame(0); };

    player.addEventListener('frameupdate', onFrame);
    player.addEventListener('play', onPlay);
    player.addEventListener('pause', onPause);
    player.addEventListener('ended', onEnded);

    return () => {
      player.removeEventListener('frameupdate', onFrame);
      player.removeEventListener('play', onPlay);
      player.removeEventListener('pause', onPause);
      player.removeEventListener('ended', onEnded);
    };
  }, []);

  /* ── Chat scroll ──────────────────────────────────────────────────── */
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  /* ── Render ──────────────────────────────────────────────────────── */
  const handleRender = useCallback(async () => {
    if (renderStatus === 'queued' || renderStatus === 'rendering') return;

    setRenderStatus('queued');
    setOutputUrl(null);

    try {
      await api.post(`/videos/${jobId}/render`, { scene });

      // Poll for status
      pollRef.current = setInterval(async () => {
        try {
          const data = await api.get<{ render_status: string; output_url: string | null; render_error: string | null }>(
            `/videos/${jobId}/render-status`,
          );

          if (data.render_status === 'rendering') {
            setRenderStatus('rendering');
          } else if (data.render_status === 'done') {
            clearInterval(pollRef.current!);
            setRenderStatus('done');
            setOutputUrl(data.output_url);
          } else if (data.render_status === 'failed') {
            clearInterval(pollRef.current!);
            setRenderStatus('failed');
          }
        } catch {
          clearInterval(pollRef.current!);
          setRenderStatus('failed');
        }
      }, 3000);
    } catch {
      setRenderStatus('failed');
    }
  }, [renderStatus, jobId, scene]);

  // Cleanup poll on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  /* ── Global drag (timeline clips) ─────────────────────────────────── */
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const delta = Math.round((e.clientX - drag.ox) / PX_PER_FRAME);
      setScene(prev => ({
        ...prev,
        layers: prev.layers.map(c => {
          if (c.id !== drag.id) return c;
          if (drag.kind === 'move') {
            const newStart   = Math.max(0, Math.min(TOTAL_FRAMES - c.durationInFrames, drag.os + delta));
            const frameDelta = newStart - drag.os;
            return { ...c, from: newStart, keyframes: drag.ok.map(kf => ({ ...kf, frame: kf.frame + frameDelta })) };
          }
          if (drag.kind === 'left') {
            const newStart    = Math.max(0, Math.min(drag.os + drag.od - MIN_CLIP_F, drag.os + delta));
            const newDuration = drag.od - (newStart - drag.os);
            return { ...c, from: newStart, durationInFrames: newDuration };
          }
          if (drag.kind === 'right') {
            const newDuration = Math.max(MIN_CLIP_F, Math.min(TOTAL_FRAMES - c.from, drag.od + delta));
            return { ...c, durationInFrames: newDuration };
          }
          return c;
        }),
      }));
    };
    const onUp = () => { dragRef.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',  onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [TOTAL_FRAMES]);

  /* ── Layer mutations ─────────────────────────────────────────────── */
  const updateLayer = useCallback((id: string, patch: Record<string, unknown>) => {
    pushHistory(sceneRef.current);
    setScene(prev => ({
      ...prev,
      layers: prev.layers.map(l => l.id === id ? { ...l, ...patch } as Layer : l),
    }));
  }, [pushHistory]);

  const addLayer = useCallback((type: 'text' | 'shape') => {
    pushHistory(sceneRef.current);
    const idx   = nextIdRef.current++;
    const id    = `layer-${idx}`;
    const color = getTrackColor(idx);
    const base = {
      id, label: type === 'text' ? `Text ${idx}` : `Shape ${idx}`,
      trackColor: color,
      from: frameRef.current, durationInFrames: 90,
      x: sceneRef.current.width / 2, y: sceneRef.current.height / 2,
      scale: 1, rotation: 0, opacity: 1,
      keyframes: [] as SceneKeyframe[],
    };
    const newLayer: Layer = type === 'text'
      ? { ...base, type: 'text', content: 'New Text', fontSize: 48, color: '#ffffff', fontWeight: 600, fontFamily: 'var(--font-sans, system-ui)', letterSpacing: 0 }
      : { ...base, type: 'shape', shape: 'rect', width: 384, height: 108, color, blur: 0 };
    setScene(prev => ({ ...prev, layers: [...prev.layers, newLayer] }));
    setSelectedId(id);
  }, [pushHistory]);

  const deleteLayer = useCallback((id: string) => {
    pushHistory(sceneRef.current);
    setScene(prev => ({ ...prev, layers: prev.layers.filter(l => l.id !== id) }));
    setSelectedId(s => s === id ? null : s);
  }, [pushHistory]);

  const deleteKeyframe = useCallback((layerId: string, index: number) => {
    pushHistory(sceneRef.current);
    setScene(prev => ({
      ...prev,
      layers: prev.layers.map(l =>
        l.id === layerId ? { ...l, keyframes: l.keyframes.filter((_, i) => i !== index) } : l,
      ),
    }));
  }, [pushHistory]);

  /* ── Video / Audio layer add ──────────────────────────────────────── */
  const addVideoLayer = useCallback(async (file: File) => {
    if (!user) return;
    const url = await uploadMedia(file, user.id);

    // Get video dimensions via hidden element
    const dims = await new Promise<{ w: number; h: number }>(resolve => {
      const vid = document.createElement('video');
      vid.src = url;
      vid.onloadedmetadata = () => resolve({ w: vid.videoWidth || 1280, h: vid.videoHeight || 720 });
      vid.onerror = () => resolve({ w: 1280, h: 720 });
    });

    const idx = nextIdRef.current++;
    const id  = `layer-${idx}`;
    const newLayer: VideoLayer = {
      id, label: file.name.replace(/\.[^.]+$/, ''),
      type: 'video',
      trackColor: getTrackColor(idx),
      from: 0, durationInFrames: 90,
      x: sceneRef.current.width / 2, y: sceneRef.current.height / 2,
      scale: 1, rotation: 0, opacity: 1,
      keyframes: [],
      src: url,
      width: dims.w, height: dims.h,
      volume: 1, startFrom: 0, playbackRate: 1,
    };

    pushHistory(sceneRef.current);
    setScene(prev => ({ ...prev, layers: [...prev.layers, newLayer] }));
    setSelectedId(id);
  }, [user, pushHistory]);

  const addAudioLayer = useCallback(async (file: File) => {
    if (!user) return;
    const url = await uploadMedia(file, user.id);

    const idx = nextIdRef.current++;
    const id  = `layer-${idx}`;
    const newLayer: AudioLayer = {
      id, label: file.name.replace(/\.[^.]+$/, ''),
      type: 'audio',
      trackColor: '#22c55e',
      from: 0, durationInFrames: 90,
      x: 0, y: 0, scale: 1, rotation: 0, opacity: 1,
      keyframes: [],
      src: url,
      volume: 1, startFrom: 0, playbackRate: 1,
    };

    pushHistory(sceneRef.current);
    setScene(prev => ({ ...prev, layers: [...prev.layers, newLayer] }));
    setSelectedId(id);
  }, [user, pushHistory]);

  /* ── Timeline interaction ─────────────────────────────────────────── */
  const xToFrame = useCallback((clientX: number): number => {
    if (!clipAreaRef.current) return 0;
    const rect   = clipAreaRef.current.getBoundingClientRect();
    const scroll = clipAreaRef.current.scrollLeft;
    return Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round((clientX - rect.left + scroll) / PX_PER_FRAME)));
  }, [TOTAL_FRAMES]);

  const onTimelineMouseDown = useCallback((e: React.MouseEvent) => {
    const f = xToFrame(e.clientX);
    setFrame(f);
    playerRef.current?.seekTo(f);
  }, [xToFrame]);

  const startMove = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation(); e.preventDefault();
    setSelectedId(id);
    const c = sceneRef.current.layers.find(x => x.id === id)!;
    pushHistory(sceneRef.current);
    dragRef.current = { kind: 'move', id, ox: e.clientX, os: c.from, ok: c.keyframes };
  }, [pushHistory]);

  const startResizeLeft = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation(); e.preventDefault();
    setSelectedId(id);
    const c = sceneRef.current.layers.find(x => x.id === id)!;
    pushHistory(sceneRef.current);
    dragRef.current = { kind: 'left', id, ox: e.clientX, os: c.from, od: c.durationInFrames };
  }, [pushHistory]);

  const startResizeRight = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation(); e.preventDefault();
    setSelectedId(id);
    const c = sceneRef.current.layers.find(x => x.id === id)!;
    pushHistory(sceneRef.current);
    dragRef.current = { kind: 'right', id, ox: e.clientX, od: c.durationInFrames };
  }, [pushHistory]);

  /* ── Transport controls ──────────────────────────────────────────── */
  const togglePlay = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    if (isPlaying) { player.pause(); } else { player.play(); }
  }, [isPlaying]);

  const seekTo = useCallback((f: number) => {
    setFrame(f);
    playerRef.current?.seekTo(f);
  }, []);

  /* ── Chat ─────────────────────────────────────────────────────────── */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const names = files.map(f => f.name);
    setAttachedFiles(prev => [...prev, ...names]);
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    const text = input.trim();
    const hasFiles = attachedFiles.length > 0;
    if ((!text && !hasFiles) || isAiLoading) return;

    const uid = Date.now();
    const parts: string[] = [];
    if (hasFiles) parts.push(`📎 ${attachedFiles.join(', ')}`);
    if (text) parts.push(text);
    const fullText = parts.join('\n');

    // Show user message immediately
    setMessages(m => [...m, { id: uid, role: 'user', text: fullText }]);
    setInput('');
    setAttachedFiles([]);
    setIsAiLoading(true);

    try {
      // Build history from recent messages (skip thinking indicators)
      const chatHistory = messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .slice(-10)
        .map(m => ({ role: m.role, text: m.text }));

      const result = await api.post<{ scene: Scene; reply: string }>('/ai/edit', {
        scene,
        message: fullText,
        history: chatHistory,
        ...(brandContext.trim() ? { brandContext: brandContext.trim() } : {}),
      });

      // Apply the updated scene (with undo support)
      if (result.scene) {
        pushHistory(sceneRef.current);
        setScene(result.scene);
      }

      // Show Claude's reply
      setMessages(m => [...m, {
        id: uid + 1, role: 'assistant',
        text: result.reply || 'Done! Scene updated.',
      }]);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Something went wrong';
      setMessages(m => [...m, {
        id: uid + 1, role: 'assistant',
        text: `⚠️ ${errMsg}`,
      }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  /* ── Derived ─────────────────────────────────────────────────────── */
  const selectedLayer = scene.layers.find(l => l.id === selectedId) ?? null;
  const playheadPx    = frame * PX_PER_FRAME;
  const scrubberPct   = `${(frame / (TOTAL_FRAMES - 1)) * 100}%`;
  const SECS          = Math.ceil(TOTAL_FRAMES / FPS);

  const iconBtnStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 28, height: 28, borderRadius: 6,
    border: '1px solid #1e1e1e', background: 'rgba(255,255,255,0.03)',
    cursor: 'pointer', color: '#555', flexShrink: 0,
    transition: 'all 150ms',
  };

  return (
    <div className="flex h-full overflow-hidden text-white" style={{ background: '#080808' }}>

      {/* ── Scoped styles ────────────────────────────────────────────────── */}
      <style>{`
        .editor-scrubber{-webkit-appearance:none;appearance:none;background:transparent;width:100%;height:20px;cursor:pointer;outline:none;}
        .editor-scrubber::-webkit-slider-runnable-track{height:3px;border-radius:2px;background:linear-gradient(to right,#3b82f6 var(--sp,0%),#1e1e1e var(--sp,0%));}
        .editor-scrubber::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:#3b82f6;margin-top:-5.5px;box-shadow:0 0 7px rgba(59,130,246,0.7);cursor:grab;}
        .editor-scrubber:active::-webkit-slider-thumb{cursor:grabbing;}
        .editor-scrubber::-moz-range-track{height:3px;border-radius:2px;background:#1e1e1e;}
        .editor-scrubber::-moz-range-progress{height:3px;background:#3b82f6;border-radius:2px;}
        .editor-scrubber::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:#3b82f6;border:none;}
        .clip-handle{opacity:0;transition:opacity .12s;}
        .tl-clip:hover .clip-handle,.tl-clip.selected .clip-handle{opacity:1;}
      `}</style>

      {/* Hidden file inputs */}
      <input ref={videoInputRef} type="file" accept="video/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) addVideoLayer(f); e.target.value = ''; }} />
      <input ref={audioInputRef} type="file" accept="audio/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) addAudioLayer(f); e.target.value = ''; }} />

      {/* Template modal */}
      <TemplateModal
        open={templatesOpen}
        currentScene={scene}
        onClose={() => setTemplatesOpen(false)}
        onLoad={s => { pushHistory(sceneRef.current); setScene(s); setTemplatesOpen(false); }}
      />

      {/* ─── PROPERTIES PANEL ────────────────────────────────────────────── */}
      <PropertiesPanel
        layer={selectedLayer}
        onUpdate={updateLayer}
        onAdd={addLayer}
        onAddVideo={() => videoInputRef.current?.click()}
        onAddAudio={() => audioInputRef.current?.click()}
        onDelete={deleteLayer}
        onDeleteKeyframe={deleteKeyframe}
      />

      {/* ─── CENTER — toolbar + preview + transport + timeline ───────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Toolbar */}
        <div className="flex items-center flex-shrink-0 px-4 gap-2"
          style={{ height: 44, borderBottom: '1px solid #1a1a1a', background: '#0a0a0a' }}>
          <div className="flex items-center gap-2 mr-3 select-none">
            <Film className="size-[15px] text-[#3b82f6]" />
            <span className="font-bold text-[14px] tracking-tight text-white">Morphix</span>
          </div>

          {/* Undo / Redo */}
          <button
            title="Undo (⌘Z)" onClick={undo} disabled={!canUndo}
            style={{ ...iconBtnStyle, opacity: canUndo ? 1 : 0.3 }}
            onMouseEnter={e => { if (canUndo) e.currentTarget.style.color = '#aaa'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#555'; }}
          >
            <Undo2 size={13} />
          </button>
          <button
            title="Redo (⌘Y)" onClick={redo} disabled={!canRedo}
            style={{ ...iconBtnStyle, opacity: canRedo ? 1 : 0.3 }}
            onMouseEnter={e => { if (canRedo) e.currentTarget.style.color = '#aaa'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#555'; }}
          >
            <Redo2 size={13} />
          </button>

          {/* Templates */}
          <button
            title="Scene Templates" onClick={() => setTemplatesOpen(true)}
            style={iconBtnStyle}
            onMouseEnter={e => { e.currentTarget.style.color = '#aaa'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#555'; }}
          >
            <LayoutTemplate size={13} />
          </button>

          <div className="flex-1" />
          {renderStatus === 'done' && outputUrl ? (
            <a
              href={`${outputUrl}?download=render.mp4`}
              download="render.mp4"
              className="btn-gradient px-4 py-1.5 text-[13px] font-semibold text-white rounded-lg border-0 flex items-center gap-1.5"
            >
              <Download className="size-[13px]" />
              Download MP4
            </a>
          ) : (
            <button
              onClick={handleRender}
              disabled={renderStatus === 'queued' || renderStatus === 'rendering'}
              className="btn-gradient px-4 py-1.5 text-[13px] font-semibold text-white rounded-lg cursor-pointer border-0 flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {(renderStatus === 'queued' || renderStatus === 'rendering') && (
                <Loader2 className="size-[13px] animate-spin" />
              )}
              {renderStatus === 'failed' ? 'Render Failed — Retry' : renderStatus === 'queued' || renderStatus === 'rendering' ? 'Rendering...' : 'Render'}
            </button>
          )}
        </div>

        {/* Preview — Remotion Player */}
        <div className="flex-1 flex items-center justify-center overflow-hidden morphix-dot-grid"
          style={{ background: '#0d0d0d', padding: 24, minHeight: 0 }}>
          <div className="morphix-card noise-overlay relative rounded-lg overflow-hidden"
            style={{
              width: '100%', maxWidth: 700, aspectRatio: '16/9',
              border: '1px solid #1e1e1e',
              boxShadow: '0 0 60px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.03)',
            }}>
            <Player
              ref={playerRef}
              component={MorphixVideo}
              inputProps={{ scene, selectedLayerId: selectedId }}
              durationInFrames={Math.max(1, scene.durationInFrames)}
              fps={scene.fps}
              compositionWidth={scene.width}
              compositionHeight={scene.height}
              style={{ width: '100%', height: '100%' }}
              controls={false}
              autoPlay={false}
              loop={false}
            />
            <div className="scan-line" style={{ zIndex: 20, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }} />
            <div className="absolute select-none pointer-events-none"
              style={{
                bottom: '11%', left: '50%', transform: 'translateX(-50%)', zIndex: 30,
                fontFamily: 'var(--font-mono,monospace)', fontSize: 9, letterSpacing: 2,
                color: 'rgba(255,255,255,0.18)',
              }}>
              {fmtTimecode(frame, FPS)}
            </div>
          </div>
        </div>

        {/* Transport */}
        <div className="flex-shrink-0 flex items-center gap-2.5 px-4"
          style={{ height: 56, borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a', background: '#0a0a0a' }}>

          {/* Playback buttons */}
          {[
            { icon: <SkipBack size={12} />,    title: 'Skip to start', fn: () => seekTo(0) },
            { icon: <ChevronLeft size={13} />, title: 'Prev frame',    fn: () => seekTo(Math.max(0, frame - 1)) },
          ].map((b, i) => (
            <button key={i} title={b.title} onClick={b.fn}
              className="flex items-center justify-center rounded-full text-[#666] hover:text-white hover:bg-white/[0.06] transition-all duration-150 cursor-pointer flex-shrink-0"
              style={{ width: 28, height: 28, border: '1px solid #1e1e1e', background: 'rgba(255,255,255,0.03)' }}>
              {b.icon}
            </button>
          ))}

          <button title={isPlaying ? 'Pause' : 'Play'} onClick={togglePlay}
            className="flex items-center justify-center rounded-full text-[#3b82f6] transition-all duration-150 cursor-pointer flex-shrink-0"
            style={{
              width: 36, height: 36,
              background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.28)',
              boxShadow: isPlaying ? '0 0 12px rgba(59,130,246,0.3)' : 'none',
            }}>
            {isPlaying ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: 1 }} />}
          </button>

          {[
            { icon: <ChevronRight size={13} />, title: 'Next frame',  fn: () => seekTo(Math.min(TOTAL_FRAMES - 1, frame + 1)) },
            { icon: <SkipForward size={12} />,  title: 'Skip to end', fn: () => seekTo(TOTAL_FRAMES - 1) },
          ].map((b, i) => (
            <button key={i} title={b.title} onClick={b.fn}
              className="flex items-center justify-center rounded-full text-[#666] hover:text-white hover:bg-white/[0.06] transition-all duration-150 cursor-pointer flex-shrink-0"
              style={{ width: 28, height: 28, border: '1px solid #1e1e1e', background: 'rgba(255,255,255,0.03)' }}>
              {b.icon}
            </button>
          ))}

          <div className="flex-shrink-0" style={{ width: 1, height: 18, background: '#222', margin: '0 2px' }} />

          {/* Scrubber */}
          <div className="flex flex-1 items-center min-w-0">
            <input type="range" className="editor-scrubber"
              min={0} max={TOTAL_FRAMES - 1} value={frame}
              onChange={e => seekTo(Number(e.target.value))}
              style={{ '--sp': scrubberPct } as React.CSSProperties} />
          </div>

          <div className="flex-shrink-0" style={{ width: 1, height: 18, background: '#222', margin: '0 2px' }} />

          {/* Timecode */}
          <span className="flex-shrink-0 tabular-nums select-none"
            style={{
              fontFamily: 'var(--font-mono,monospace)', fontSize: 12,
              letterSpacing: 0.5, color: '#bbb', minWidth: 76, textAlign: 'right',
            }}>
            {fmtTimecode(frame, FPS)}
          </span>
        </div>

        {/* ── Timeline ─────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 flex overflow-y-auto"
          style={{ minHeight: 168, maxHeight: 260 }}>

          {/* Label column */}
          <div className="flex-shrink-0 flex flex-col"
            style={{ width: 96, borderRight: '1px solid #1a1a1a' }}>
            <div style={{ height: RULER_H, flexShrink: 0, borderBottom: '1px solid #1a1a1a', background: '#090909' }} />
            {scene.layers.map(c => (
              <div key={c.id}
                className="flex items-center gap-2 flex-shrink-0 cursor-pointer transition-colors duration-100"
                style={{
                  height: TRACK_H, paddingLeft: 12, borderBottom: '1px solid #111',
                  background: c.id === selectedId ? 'rgba(59,130,246,0.06)' : 'transparent',
                }}
                onClick={() => setSelectedId(c.id === selectedId ? null : c.id)}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                  background: c.type === 'audio' ? '#22c55e' : c.trackColor,
                  boxShadow: `0 0 4px ${c.type === 'audio' ? '#22c55e' : c.trackColor}99`,
                }} />
                <span className="truncate" style={{ fontSize: 11, color: c.id === selectedId ? '#aaa' : '#555', userSelect: 'none', maxWidth: 62 }}>
                  {c.label}
                </span>
              </div>
            ))}
          </div>

          {/* Scrollable clip area */}
          <div ref={clipAreaRef}
            className="flex-1 overflow-x-auto"
            style={{ position: 'relative', cursor: 'default' }}
            onMouseDown={onTimelineMouseDown}>
            <div style={{ width: TOTAL_PX, minWidth: '100%', position: 'relative' }}>

              {/* Ruler */}
              <div style={{
                height: RULER_H, position: 'relative', overflow: 'hidden',
                borderBottom: '1px solid #1a1a1a', background: '#090909',
              }}>
                {Array.from({ length: SECS + 1 }).map((_, s) => (
                  <div key={s} className="absolute flex flex-col items-center pointer-events-none select-none"
                    style={{ left: s * FPS * PX_PER_FRAME, top: 0, bottom: 0 }}>
                    <div style={{ width: 1, height: 8, background: '#2a2a2a', marginTop: 3, flexShrink: 0 }} />
                    <span style={{ fontSize: 9, color: '#484848', fontFamily: 'var(--font-mono,monospace)', marginTop: 2 }}>{s}s</span>
                  </div>
                ))}
                {Array.from({ length: SECS }).map((_, s) => (
                  <div key={s} className="absolute pointer-events-none"
                    style={{ left: (s + 0.5) * FPS * PX_PER_FRAME, top: 4, width: 1, height: 5, background: '#1e1e1e' }} />
                ))}
                {/* Playhead in ruler */}
                <div className="absolute pointer-events-none"
                  style={{ left: playheadPx, top: 0, bottom: 0, width: 1, background: 'rgba(239,68,68,0.45)', zIndex: 10 }}>
                  <div style={{
                    position: 'absolute', top: 2, left: '50%', transform: 'translateX(-50%)',
                    width: 0, height: 0,
                    borderLeft: '4px solid transparent', borderRight: '4px solid transparent',
                    borderTop: '6px solid #ef4444',
                  }} />
                </div>
              </div>

              {/* Tracks */}
              <div style={{ position: 'relative' }}>
                {scene.layers.map((c, idx) => {
                  const isSelected = c.id === selectedId;

                  if (c.type === 'audio') {
                    return (
                      <div key={c.id} style={{
                        height: TRACK_H, position: 'relative', borderBottom: '1px solid #111',
                        background: isSelected ? 'rgba(34,197,94,0.04)' : idx % 2 === 0 ? 'rgba(255,255,255,0.012)' : 'transparent',
                      }}>
                        <AudioTrackRow layer={c as AudioLayer} isSelected={isSelected} onMove={startMove} />
                      </div>
                    );
                  }

                  return (
                    <div key={c.id} style={{
                      height: TRACK_H, position: 'relative', borderBottom: '1px solid #111',
                      background: isSelected
                        ? 'rgba(59,130,246,0.04)'
                        : idx % 2 === 0 ? 'rgba(255,255,255,0.012)' : 'transparent',
                    }}>
                      <div
                        className={`tl-clip absolute${isSelected ? ' selected' : ''}`}
                        style={{
                          top: 6, height: TRACK_H - 12,
                          left:  c.from * PX_PER_FRAME,
                          width: c.durationInFrames * PX_PER_FRAME,
                          background: isSelected ? `${c.trackColor}35` : `${c.trackColor}22`,
                          border: `1px solid ${isSelected ? c.trackColor + 'aa' : c.trackColor + '55'}`,
                          borderRadius: 5, cursor: 'grab', minWidth: 8, userSelect: 'none',
                        }}
                        onMouseDown={e => startMove(e, c.id)}>
                        <span className="absolute pointer-events-none truncate select-none"
                          style={{
                            left: 10, right: 10, top: '50%', transform: 'translateY(-50%)',
                            fontSize: 10, color: c.trackColor, fontWeight: 600,
                          }}>
                          {c.label}
                        </span>
                        <div className="clip-handle absolute top-0 bottom-0 left-0 flex items-center justify-center"
                          style={{ width: 8, cursor: 'ew-resize', background: `${c.trackColor}44`, borderRadius: '4px 0 0 4px' }}
                          onMouseDown={e => startResizeLeft(e, c.id)}>
                          <div style={{ width: 1, height: 14, background: c.trackColor, borderRadius: 1 }} />
                        </div>
                        <div className="clip-handle absolute top-0 bottom-0 right-0 flex items-center justify-center"
                          style={{ width: 8, cursor: 'ew-resize', background: `${c.trackColor}44`, borderRadius: '0 4px 4px 0' }}
                          onMouseDown={e => startResizeRight(e, c.id)}>
                          <div style={{ width: 1, height: 14, background: c.trackColor, borderRadius: 1 }} />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Playhead across tracks */}
                <div className="absolute top-0 bottom-0 pointer-events-none"
                  style={{ left: playheadPx, width: 1, background: '#ef4444', boxShadow: '0 0 4px rgba(239,68,68,0.55)', zIndex: 20 }}>
                  <div style={{
                    position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                    width: 7, height: 7, borderRadius: '50%',
                    background: '#ef4444', boxShadow: '0 0 6px rgba(239,68,68,0.8)',
                  }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── AI CHAT ─────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex flex-col overflow-hidden"
        style={{ width: 300, borderLeft: '1px solid #1a1a1a', background: '#0a0a0a' }}>

        <div className="flex-shrink-0 flex items-center gap-3 px-4"
          style={{ height: 56, borderBottom: '1px solid #1a1a1a' }}>
          <div className="flex-shrink-0 flex items-center justify-center rounded-lg"
            style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#a855f7,#3b82f6)', boxShadow: '0 0 14px rgba(168,85,247,0.3)' }}>
            <Sparkles size={14} className="text-white" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-white leading-none">AI Editor</p>
            <p className="text-[10px] mt-1" style={{ color: '#555' }}>Powered by Claude</p>
          </div>
        </div>

        {/* Brand context */}
        <div className="flex-shrink-0" style={{ borderBottom: '1px solid #111' }}>
          <button
            onClick={() => setBrandContextOpen(o => !o)}
            className="w-full flex items-center justify-between px-3 py-2 cursor-pointer transition-colors hover:bg-white/[0.03]"
            style={{ background: 'none', border: 'none', color: '#555' }}
          >
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Brand Context
            </span>
            <span style={{ fontSize: 11, transform: brandContextOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms', display: 'inline-block' }}>▾</span>
          </button>
          {brandContextOpen && (
            <div className="px-3 pb-3">
              <textarea
                rows={3}
                value={brandContext}
                onChange={e => setBrandContext(e.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder="Describe your product, audience & tone — e.g. 'Morphix, AI video tool for B2B marketers. Bold, dark, modern.'"
                className="w-full text-[12px] text-white placeholder:text-[#383838] rounded-lg px-3 py-2 outline-none resize-none transition-all duration-150"
                style={{
                  background: '#0d0d0d',
                  border: '1px solid #1e1e1e',
                  color: '#bbb',
                  lineHeight: 1.5,
                }}
              />
            </div>
          )}
        </div>

        <div className="flex-shrink-0 px-3 py-2.5" style={{ borderBottom: '1px solid #111' }}>
          <div className="rounded-xl px-3 py-2.5"
            style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.15)' }}>
            <p className="text-[12px] leading-relaxed" style={{ color: '#666' }}>
              Describe edits in natural language — trim a clip, add a title card, change music, or adjust timing.
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 px-3 py-3" style={{ minHeight: 0 }}>
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="text-[13px] leading-relaxed" style={{
                maxWidth: '87%', padding: '8px 12px',
                borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                background: msg.role === 'user' ? 'rgba(168,85,247,0.12)' : '#111',
                border: `1px solid ${msg.role === 'user' ? 'rgba(168,85,247,0.22)' : '#1e1e1e'}`,
                color: msg.role === 'user' ? '#c4b5fd' : '#888',
                whiteSpace: 'pre-wrap',
              }}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex-shrink-0" style={{ borderTop: '1px solid #1a1a1a' }}>
          {/* Attached files chips */}
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-3 pt-2.5 pb-1">
              {attachedFiles.map((name, i) => (
                <div key={i} className="flex items-center gap-1.5 rounded-md text-[11px]"
                  style={{
                    padding: '3px 8px',
                    background: 'rgba(168,85,247,0.1)',
                    border: '1px solid rgba(168,85,247,0.2)',
                    color: '#c4b5fd',
                  }}>
                  <span>📎 {name}</span>
                  <button onClick={() => removeAttachment(i)}
                    className="flex items-center justify-center cursor-pointer rounded-full transition-colors hover:bg-white/10"
                    style={{ width: 14, height: 14, border: 'none', background: 'none', color: '#888', fontSize: 11, lineHeight: 1 }}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2 items-center px-3 py-3">
            <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,audio/*,.pdf,.txt"
              className="hidden" onChange={handleFileChange} />
            <button title="Add media or file" onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0 flex items-center justify-center rounded-lg transition-all duration-150 cursor-pointer hover:bg-white/[0.06]"
              style={{
                width: 34, height: 34,
                border: '1px solid #1e1e1e',
                background: 'rgba(255,255,255,0.03)',
                color: '#555',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#aaa'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#555'; }}>
              <Plus size={15} />
            </button>
            <input value={input} onChange={e => setInput(e.target.value)}
              onFocus={() => setInputFocused(true)} onBlur={() => setInputFocused(false)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              disabled={isAiLoading}
              placeholder={isAiLoading ? 'AI is thinking…' : attachedFiles.length > 0 ? 'Add context or press Send…' : 'Describe an edit…'}
              className="flex-1 text-[13px] text-white placeholder:text-[#444] rounded-lg px-3 py-2 outline-none transition-all duration-150"
              style={{
                background: '#0d0d0d',
                border: `1px solid ${inputFocused ? 'rgba(59,130,246,0.4)' : '#1e1e1e'}`,
                boxShadow: inputFocused ? '0 0 0 3px rgba(59,130,246,0.08)' : 'none',
                opacity: isAiLoading ? 0.5 : 1,
              }} />
            <button onClick={handleSend} disabled={isAiLoading || (!input.trim() && attachedFiles.length === 0)}
              className="flex-shrink-0 flex items-center justify-center rounded-lg transition-all duration-150"
              style={{
                width: 34, height: 34,
                background: (input.trim() || attachedFiles.length > 0) ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${(input.trim() || attachedFiles.length > 0) ? 'rgba(168,85,247,0.3)' : '#1e1e1e'}`,
                color: (input.trim() || attachedFiles.length > 0) ? '#a855f7' : '#333',
                cursor: (input.trim() || attachedFiles.length > 0) && !isAiLoading ? 'pointer' : 'default',
              }}>
              {isAiLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
