'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight,
  Send, Sparkles, Film, Type, Square, Trash2, Plus,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const FPS          = 30;
const TOTAL_FRAMES = 300;
const PX_PER_FRAME = 3;
const TOTAL_PX     = TOTAL_FRAMES * PX_PER_FRAME;
const SECS         = TOTAL_FRAMES / FPS;
const MIN_CLIP_F   = 10;
const TRACK_H      = 44;
const RULER_H      = 24;

const TRACK_COLORS = [
  '#3b82f6', '#a855f7', '#22c55e', '#f59e0b',
  '#ef4444', '#06b6d4', '#ec4899', '#8b5cf6',
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface Keyframe {
  frame: number;
  prop: 'x' | 'y' | 'scale' | 'rotation' | 'opacity';
  value: number;
}

interface CompositionBase {
  id: number;
  label: string;
  trackColor: string;
  startFrame: number;
  durationFrames: number;
  x: number;        // 0–100 % of preview width  (center anchor)
  y: number;        // 0–100 % of preview height (center anchor)
  scale: number;
  rotation: number;
  opacity: number;
  keyframes: Keyframe[];
}

interface TextComposition extends CompositionBase {
  type: 'text';
  content: string;
  fontSize: number;
  color: string;
  fontWeight?: number;
  letterSpacing?: number;
}

interface ShapeComposition extends CompositionBase {
  type: 'shape';
  shape: 'circle' | 'rect';
  /** % of preview width */
  width: number;
  /** % of preview width — height in the same unit system as width */
  height: number;
  color: string;
  blur?: number;
}

type Composition = TextComposition | ShapeComposition;

type DragOp =
  | { kind: 'move';  id: number; ox: number; os: number; ok: Keyframe[] }
  | { kind: 'left';  id: number; ox: number; os: number; od: number }
  | { kind: 'right'; id: number; ox: number; od: number };

// ─── Demo compositions ────────────────────────────────────────────────────────
// 4 preloaded animations: title fade-in/out · subtitle scale-up · rotating rect · sliding circle

const INITIAL_COMPS: Composition[] = [
  // 1 ── Title — fades in with upward slide, fades out at end ───────────────
  {
    id: 1, label: 'Title', trackColor: '#ffffff',
    type: 'text',
    startFrame: 0, durationFrames: 270,
    x: 50, y: 44, scale: 1, rotation: 0, opacity: 0,
    content: 'MORPHIX STUDIO', fontSize: 26, color: '#ffffff',
    fontWeight: 800, letterSpacing: 8,
    keyframes: [
      { frame: 0,   prop: 'opacity', value: 0 },
      { frame: 30,  prop: 'opacity', value: 1 },
      { frame: 240, prop: 'opacity', value: 1 },
      { frame: 270, prop: 'opacity', value: 0 },
      // slide up on enter
      { frame: 0,  prop: 'y', value: 56 },
      { frame: 30, prop: 'y', value: 44 },
    ],
  },

  // 2 ── Subtitle — scales up from 0, fades out ────────────────────────────
  {
    id: 2, label: 'Subtitle', trackColor: '#666666',
    type: 'text',
    startFrame: 45, durationFrames: 210,
    x: 50, y: 62, scale: 0, rotation: 0, opacity: 0,
    content: 'AI-Powered Video Creation', fontSize: 12, color: '#888888',
    fontWeight: 400, letterSpacing: 3,
    keyframes: [
      { frame: 45, prop: 'scale',   value: 0 },
      { frame: 80, prop: 'scale',   value: 1 },
      { frame: 45, prop: 'opacity', value: 0 },
      { frame: 80, prop: 'opacity', value: 1 },
      { frame: 225, prop: 'opacity', value: 1 },
      { frame: 255, prop: 'opacity', value: 0 },
    ],
  },

  // 3 ── Rotating rectangle — spins continuously ────────────────────────────
  {
    id: 3, label: 'Spin Rect', trackColor: '#a855f7',
    type: 'shape', shape: 'rect',
    startFrame: 60, durationFrames: 180,
    x: 50, y: 50, scale: 1, rotation: 0, opacity: 0,
    width: 22, height: 5, color: '#a855f7',
    keyframes: [
      { frame: 60,  prop: 'opacity',  value: 0   },
      { frame: 90,  prop: 'opacity',  value: 0.8 },
      { frame: 210, prop: 'opacity',  value: 0.8 },
      { frame: 240, prop: 'opacity',  value: 0   },
      // 4 equidistant keyframes → roughly linear rotation via smoothstep
      { frame: 60,  prop: 'rotation', value: 0   },
      { frame: 120, prop: 'rotation', value: 120 },
      { frame: 180, prop: 'rotation', value: 240 },
      { frame: 240, prop: 'rotation', value: 360 },
    ],
  },

  // 4 ── Glow circle — slides in from left ──────────────────────────────────
  {
    id: 4, label: 'Glow Circle', trackColor: '#3b82f6',
    type: 'shape', shape: 'circle',
    startFrame: 30, durationFrames: 240,
    x: 15, y: 50, scale: 0.5, rotation: 0, opacity: 0,
    width: 42, height: 42, color: '#3b82f6', blur: 44,
    keyframes: [
      { frame: 30, prop: 'opacity', value: 0    },
      { frame: 60, prop: 'opacity', value: 0.3  },
      { frame: 240, prop: 'opacity', value: 0.25 },
      { frame: 270, prop: 'opacity', value: 0   },
      { frame: 30, prop: 'x',       value: 15  },
      { frame: 90, prop: 'x',       value: 50  },
      { frame: 30, prop: 'scale',   value: 0.5 },
      { frame: 90, prop: 'scale',   value: 1   },
    ],
  },
];

// ─── Keyframe engine ──────────────────────────────────────────────────────────

function smoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

function interpolateKfs(kfs: Keyframe[], prop: Keyframe['prop'], frame: number): number | undefined {
  const sorted = kfs.filter(k => k.prop === prop).sort((a, b) => a.frame - b.frame);
  if (!sorted.length) return undefined;
  if (frame <= sorted[0].frame) return sorted[0].value;
  if (frame >= sorted[sorted.length - 1].frame) return sorted[sorted.length - 1].value;
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i], b = sorted[i + 1];
    if (frame >= a.frame && frame <= b.frame) {
      const t = (frame - a.frame) / (b.frame - a.frame);
      return a.value + (b.value - a.value) * smoothstep(t);
    }
  }
}

const ANIMATABLE: ReadonlyArray<Keyframe['prop']> = ['x', 'y', 'scale', 'rotation', 'opacity'];

interface ResolvedTransform { x: number; y: number; scale: number; rotation: number; opacity: number; }

function resolveProps(comp: Composition, frame: number): ResolvedTransform {
  const out: ResolvedTransform = {
    x: comp.x, y: comp.y, scale: comp.scale, rotation: comp.rotation, opacity: comp.opacity,
  };
  for (const prop of ANIMATABLE) {
    const v = interpolateKfs(comp.keyframes, prop, frame);
    if (v !== undefined) out[prop] = v;
  }
  return out;
}

// ─── Composition renderer ─────────────────────────────────────────────────────

function CompositionRenderer({
  compositions, frame, selectedId,
}: {
  compositions: Composition[];
  frame: number;
  selectedId: number | null;
}) {
  const active = compositions.filter(c => frame >= c.startFrame && frame < c.startFrame + c.durationFrames);
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 5 }}>
      {active.map(comp => {
        const { x, y, scale, rotation, opacity } = resolveProps(comp, frame);
        const transform = `translate(-50%,-50%) scale(${scale}) rotate(${rotation}deg)`;
        const isSelected = comp.id === selectedId;

        if (comp.type === 'text') {
          return (
            <div key={comp.id} className="absolute select-none pointer-events-none whitespace-nowrap"
              style={{
                left: `${x}%`, top: `${y}%`, transform, opacity,
                fontSize: comp.fontSize, color: comp.color,
                fontWeight: comp.fontWeight ?? 400, letterSpacing: comp.letterSpacing ?? 0,
                textShadow: isSelected
                  ? '0 0 0 1px rgba(59,130,246,0.8), 0 2px 16px rgba(0,0,0,0.7)'
                  : '0 2px 16px rgba(0,0,0,0.7)',
                transformOrigin: 'center center',
                fontFamily: 'var(--font-sans, system-ui)',
                outline: isSelected ? '1px dashed rgba(59,130,246,0.5)' : undefined,
              }}
            >
              {comp.content}
            </div>
          );
        }

        if (comp.type === 'shape') {
          // height as % of preview-container height:
          // comp.height is in "% of preview width" units
          // preview h = preview_w * 9/16, so comp.height% of w = comp.height * 16/9 % of h
          const cssH = `${(comp.height * 16) / 9}%`;
          return (
            <div key={comp.id} className="absolute pointer-events-none"
              style={{
                left: `${x}%`, top: `${y}%`,
                width: `${comp.width}%`, height: cssH,
                transform, opacity, background: comp.color,
                borderRadius: comp.shape === 'circle' ? '50%' : '4px',
                filter: comp.blur ? `blur(${comp.blur}px)` : undefined,
                transformOrigin: 'center center',
                outline: isSelected ? '1px dashed rgba(59,130,246,0.5)' : undefined,
              }}
            />
          );
        }
        return null;
      })}
    </div>
  );
}

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
  comp, frame, onUpdate, onAdd, onDelete, onDeleteKeyframe,
}: {
  comp: Composition | null;
  frame: number;
  onUpdate: (id: number, patch: Record<string, unknown>) => void;
  onAdd: (type: 'text' | 'shape') => void;
  onDelete: (id: number) => void;
  onDeleteKeyframe: (compId: number, index: number) => void;
}) {
  const Section = ({ label }: { label: string }) => (
    <p style={{
      fontSize: 9, color: '#383838', textTransform: 'uppercase', letterSpacing: 1.5,
      borderBottom: '1px solid #161616', paddingBottom: 5, marginTop: 14, marginBottom: 8,
    }}>
      {label}
    </p>
  );

  const Field = ({ label, children, half }: { label: string; children: React.ReactNode; half?: boolean }) => (
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

  const num = (prop: keyof CompositionBase, step = 1) => (
    <input
      type="number" step={step} style={P_IN}
      value={r(comp![prop] as number, step < 1 ? 2 : 0)}
      onChange={e => onUpdate(comp!.id, { [prop]: parseFloat(e.target.value) || 0 })}
    />
  );

  // sorted keyframes for display, keeping original index for deletion
  const sortedKfs = comp
    ? comp.keyframes
        .map((kf, i) => ({ kf, i }))
        .sort((a, b) => a.kf.frame - b.kf.frame)
    : [];

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
          <button onClick={() => onAdd('text')} title="Add Text composition"
            className="flex items-center gap-1 rounded-md transition-colors duration-150 cursor-pointer hover:bg-white/[0.06]"
            style={{ padding: '3px 7px', border: '1px solid #1e1e1e', background: 'rgba(255,255,255,0.03)', color: '#666' }}>
            <Type size={10} />
            <span style={{ fontSize: 10 }}>Text</span>
          </button>
          <button onClick={() => onAdd('shape')} title="Add Shape composition"
            className="flex items-center gap-1 rounded-md transition-colors duration-150 cursor-pointer hover:bg-white/[0.06]"
            style={{ padding: '3px 7px', border: '1px solid #1e1e1e', background: 'rgba(255,255,255,0.03)', color: '#666' }}>
            <Square size={10} />
            <span style={{ fontSize: 10 }}>Shape</span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0, padding: '8px 12px 20px' }}>
        {!comp ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full gap-3"
            style={{ opacity: 0.4, paddingTop: 48 }}>
            <div style={{ fontSize: 28, lineHeight: 1 }}>↖</div>
            <p style={{ fontSize: 11, color: '#555', textAlign: 'center', lineHeight: 1.6 }}>
              Click a clip<br />to inspect
            </p>
          </div>
        ) : (
          <>
            {/* Comp name + delete */}
            <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
              <input
                type="text" style={{ ...P_IN, flex: 1, marginRight: 6 }}
                value={comp.label}
                onChange={e => onUpdate(comp.id, { label: e.target.value })}
              />
              <button onClick={() => onDelete(comp.id)} title="Delete composition"
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
                  value={comp.startFrame}
                  onChange={e => onUpdate(comp.id, { startFrame: Math.max(0, parseInt(e.target.value) || 0) })} />
              </Field>
              <Field label="Duration f">
                <input type="number" step={1} style={P_IN}
                  value={comp.durationFrames}
                  onChange={e => onUpdate(comp.id, { durationFrames: Math.max(MIN_CLIP_F, parseInt(e.target.value) || MIN_CLIP_F) })} />
              </Field>
            </G2>

            {/* ── Transform ───────────────────────────────────── */}
            <Section label="Transform" />
            <G2>
              <Field label="X %">{num('x')}</Field>
              <Field label="Y %">{num('y')}</Field>
              <Field label="Scale">{num('scale', 0.01)}</Field>
              <Field label="Rotation °">{num('rotation')}</Field>
            </G2>
            <Field label="Opacity">
              <input type="number" step={0.01} min={0} max={1} style={P_IN}
                value={r(comp.opacity, 2)}
                onChange={e => onUpdate(comp.id, { opacity: Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)) })} />
            </Field>

            {/* ── Appearance ──────────────────────────────────── */}
            <Section label="Appearance" />
            <Field label="Color">
              <div className="flex gap-2 items-center">
                <input type="color" value={comp.color}
                  onChange={e => onUpdate(comp.id, { color: e.target.value })}
                  style={{
                    width: 28, height: 24, borderRadius: 4, border: '1px solid #1a1a1a',
                    background: 'none', padding: '1px 2px', cursor: 'pointer', flexShrink: 0,
                  }} />
                <input type="text" style={{ ...P_IN, flex: 1 }} value={comp.color}
                  onChange={e => onUpdate(comp.id, { color: e.target.value })} />
              </div>
            </Field>

            {/* ── Text fields ──────────────────────────────────── */}
            {comp.type === 'text' && (
              <>
                <Section label="Text" />
                <Field label="Content">
                  <input type="text" style={P_IN} value={comp.content}
                    onChange={e => onUpdate(comp.id, { content: e.target.value })} />
                </Field>
                <G2>
                  <Field label="Font size">
                    <input type="number" step={1} style={P_IN} value={comp.fontSize}
                      onChange={e => onUpdate(comp.id, { fontSize: parseInt(e.target.value) || 12 })} />
                  </Field>
                  <Field label="Weight">
                    <select style={P_SELECT} value={comp.fontWeight ?? 400}
                      onChange={e => onUpdate(comp.id, { fontWeight: parseInt(e.target.value) })}>
                      {[300, 400, 500, 600, 700, 800].map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </Field>
                  <Field label="Spacing">
                    <input type="number" step={0.5} style={P_IN} value={comp.letterSpacing ?? 0}
                      onChange={e => onUpdate(comp.id, { letterSpacing: parseFloat(e.target.value) || 0 })} />
                  </Field>
                </G2>
              </>
            )}

            {/* ── Shape fields ─────────────────────────────────── */}
            {comp.type === 'shape' && (
              <>
                <Section label="Shape" />
                <G2>
                  <Field label="Width %">
                    <input type="number" step={0.5} style={P_IN} value={r(comp.width)}
                      onChange={e => onUpdate(comp.id, { width: parseFloat(e.target.value) || 1 })} />
                  </Field>
                  <Field label="Height %">
                    <input type="number" step={0.5} style={P_IN} value={r(comp.height)}
                      onChange={e => onUpdate(comp.id, { height: parseFloat(e.target.value) || 1 })} />
                  </Field>
                  <Field label="Type">
                    <select style={P_SELECT} value={comp.shape}
                      onChange={e => onUpdate(comp.id, { shape: e.target.value })}>
                      <option value="rect">Rect</option>
                      <option value="circle">Circle</option>
                    </select>
                  </Field>
                  <Field label="Blur px">
                    <input type="number" step={1} min={0} style={P_IN} value={comp.blur ?? 0}
                      onChange={e => onUpdate(comp.id, { blur: parseInt(e.target.value) || 0 })} />
                  </Field>
                </G2>
              </>
            )}

            {/* ── Keyframes ────────────────────────────────────── */}
            <Section label={`Keyframes (${comp.keyframes.length})`} />
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
                <button onClick={() => onDeleteKeyframe(comp.id, i)}
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
      </div>
    </div>
  );
}

// ─── Chat types + helpers ─────────────────────────────────────────────────────

interface ChatMessage { id: number; role: 'user' | 'assistant'; text: string; }

const INITIAL_MESSAGES: ChatMessage[] = [{
  id: 0, role: 'assistant',
  text: 'Hi! I can help you edit your video. Try "trim the last 2 seconds" or "add a fade-in transition".',
}];

function fmtTimecode(frame: number): string {
  const totalSec = Math.floor(frame / FPS);
  const mm = Math.floor(totalSec / 60);
  const ss = totalSec % 60;
  const ff = frame % FPS;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}:${String(ff).padStart(2, '0')}`;
}

// ─── EditorPage ───────────────────────────────────────────────────────────────

export function EditorPage() {
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [frame,        setFrame]        = useState(0);
  const [comps,        setComps]        = useState<Composition[]>(INITIAL_COMPS);
  const [selectedId,   setSelectedId]   = useState<number | null>(null);
  const [messages,     setMessages]     = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input,        setInput]        = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);

  const intervalRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const clipAreaRef    = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dragRef        = useRef<DragOp | null>(null);
  const nextId         = useRef(INITIAL_COMPS.length + 1);
  const fileInputRef   = useRef<HTMLInputElement>(null);

  /* ── Playback ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setFrame(f => { if (f >= TOTAL_FRAMES - 1) { setIsPlaying(false); return 0; } return f + 1; });
      }, 1000 / FPS);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying]);

  /* ── Chat scroll ──────────────────────────────────────────────────────── */
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  /* ── Global drag ──────────────────────────────────────────────────────── */
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const delta = Math.round((e.clientX - drag.ox) / PX_PER_FRAME);
      setComps(prev => prev.map(c => {
        if (c.id !== drag.id) return c;
        if (drag.kind === 'move') {
          const newStart   = Math.max(0, Math.min(TOTAL_FRAMES - c.durationFrames, drag.os + delta));
          const frameDelta = newStart - drag.os;
          return { ...c, startFrame: newStart, keyframes: drag.ok.map(kf => ({ ...kf, frame: kf.frame + frameDelta })) };
        }
        if (drag.kind === 'left') {
          const newStart    = Math.max(0, Math.min(drag.os + drag.od - MIN_CLIP_F, drag.os + delta));
          const newDuration = drag.od - (newStart - drag.os);
          return { ...c, startFrame: newStart, durationFrames: newDuration };
        }
        if (drag.kind === 'right') {
          const newDuration = Math.max(MIN_CLIP_F, Math.min(TOTAL_FRAMES - c.startFrame, drag.od + delta));
          return { ...c, durationFrames: newDuration };
        }
        return c;
      }));
    };
    const onUp = () => { dragRef.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',  onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  /* ── Composition mutations ────────────────────────────────────────────── */
  const updateComp = useCallback((id: number, patch: Record<string, unknown>) => {
    setComps(prev => prev.map(c => c.id === id ? { ...c, ...patch } as Composition : c));
  }, []);

  const addComp = useCallback((type: 'text' | 'shape') => {
    const id    = nextId.current++;
    const color = TRACK_COLORS[id % TRACK_COLORS.length];
    const base: CompositionBase = {
      id, label: type === 'text' ? `Text ${id}` : `Shape ${id}`,
      trackColor: color,
      startFrame: frame, durationFrames: 90,
      x: 50, y: 50, scale: 1, rotation: 0, opacity: 1,
      keyframes: [],
    };
    const newComp: Composition = type === 'text'
      ? { ...base, type: 'text', content: 'New Text', fontSize: 20, color: '#ffffff', fontWeight: 600 }
      : { ...base, type: 'shape', shape: 'rect', width: 20, height: 10, color };
    setComps(prev => [...prev, newComp]);
    setSelectedId(id);
  }, [frame]);

  const deleteComp = useCallback((id: number) => {
    setComps(prev => prev.filter(c => c.id !== id));
    setSelectedId(s => s === id ? null : s);
  }, []);

  const deleteKeyframe = useCallback((compId: number, index: number) => {
    setComps(prev => prev.map(c =>
      c.id === compId ? { ...c, keyframes: c.keyframes.filter((_, i) => i !== index) } : c,
    ));
  }, []);

  /* ── Timeline interaction ─────────────────────────────────────────────── */
  const xToFrame = useCallback((clientX: number): number => {
    if (!clipAreaRef.current) return 0;
    const rect   = clipAreaRef.current.getBoundingClientRect();
    const scroll = clipAreaRef.current.scrollLeft;
    return Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round((clientX - rect.left + scroll) / PX_PER_FRAME)));
  }, []);

  const onTimelineMouseDown = useCallback((e: React.MouseEvent) => {
    setFrame(xToFrame(e.clientX));
  }, [xToFrame]);

  const startMove = useCallback((e: React.MouseEvent, id: number) => {
    e.stopPropagation(); e.preventDefault();
    setSelectedId(id);
    const c = comps.find(x => x.id === id)!;
    dragRef.current = { kind: 'move', id, ox: e.clientX, os: c.startFrame, ok: c.keyframes };
  }, [comps]);

  const startResizeLeft = useCallback((e: React.MouseEvent, id: number) => {
    e.stopPropagation(); e.preventDefault();
    setSelectedId(id);
    const c = comps.find(x => x.id === id)!;
    dragRef.current = { kind: 'left', id, ox: e.clientX, os: c.startFrame, od: c.durationFrames };
  }, [comps]);

  const startResizeRight = useCallback((e: React.MouseEvent, id: number) => {
    e.stopPropagation(); e.preventDefault();
    setSelectedId(id);
    const c = comps.find(x => x.id === id)!;
    dragRef.current = { kind: 'right', id, ox: e.clientX, od: c.durationFrames };
  }, [comps]);

  /* ── Chat ─────────────────────────────────────────────────────────────── */
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

  const handleSend = () => {
    const text = input.trim();
    const hasFiles = attachedFiles.length > 0;
    if (!text && !hasFiles) return;
    const uid = Date.now();
    const parts: string[] = [];
    if (hasFiles) parts.push(`📎 ${attachedFiles.join(', ')}`);
    if (text) parts.push(text);
    const fullText = parts.join('\n');
    setMessages(m => [...m, { id: uid, role: 'user', text: fullText }]);
    setInput('');
    setAttachedFiles([]);
    const fileCount = attachedFiles.length;
    setTimeout(() => setMessages(m => [...m, {
      id: uid + 1, role: 'assistant',
      text: hasFiles
        ? `Got it! I've received ${fileCount === 1 ? `"${attachedFiles[0]}"` : `${fileCount} files`}${text ? ' along with your instructions' : ''}. (Full AI integration coming soon.)`
        : "Got it! I'll apply that edit to your composition. (Full AI integration coming soon.)",
    }]), 700);
  };

  const selectedComp = comps.find(c => c.id === selectedId) ?? null;
  const playheadPx   = frame * PX_PER_FRAME;
  const scrubberPct  = `${(frame / (TOTAL_FRAMES - 1)) * 100}%`;

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

      {/* ─── PROPERTIES PANEL ────────────────────────────────────────────── */}
      <PropertiesPanel
        comp={selectedComp}
        frame={frame}
        onUpdate={updateComp}
        onAdd={addComp}
        onDelete={deleteComp}
        onDeleteKeyframe={deleteKeyframe}
      />

      {/* ─── CENTER — toolbar + preview + transport + timeline ───────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Toolbar */}
        <div className="flex items-center flex-shrink-0 px-4 gap-0"
          style={{ height: 44, borderBottom: '1px solid #1a1a1a', background: '#0a0a0a' }}>
          <div className="flex items-center gap-2 mr-5 select-none">
            <Film className="size-[15px] text-[#3b82f6]" />
            <span className="font-bold text-[14px] tracking-tight text-white">Morphix</span>
          </div>
          <div className="flex-1" />
          <button className="btn-gradient px-4 py-1.5 text-[13px] font-semibold text-white rounded-lg cursor-pointer border-0">
            Render
          </button>
        </div>

        {/* Preview */}
        <div className="flex-1 flex items-center justify-center overflow-hidden morphix-dot-grid"
          style={{ background: '#0d0d0d', padding: 24, minHeight: 0 }}>
          <div className="morphix-card noise-overlay relative rounded-lg overflow-hidden"
            style={{
              width: '100%', maxWidth: 700, aspectRatio: '16/9', background: '#000',
              border: '1px solid #1e1e1e',
              boxShadow: '0 0 60px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.03)',
            }}>
            <div className="absolute inset-0" style={{ background: '#000' }} />
            <CompositionRenderer compositions={comps} frame={frame} selectedId={selectedId} />
            <div className="absolute top-0 inset-x-0 z-10" style={{ height: '9%', background: '#000' }} />
            <div className="absolute bottom-0 inset-x-0 z-10" style={{ height: '9%', background: '#000' }} />
            <div className="scan-line" style={{ zIndex: 20 }} />
            <div className="absolute select-none pointer-events-none"
              style={{
                bottom: '11%', left: '50%', transform: 'translateX(-50%)', zIndex: 30,
                fontFamily: 'var(--font-mono,monospace)', fontSize: 9, letterSpacing: 2,
                color: 'rgba(255,255,255,0.18)',
              }}>
              {fmtTimecode(frame)}
            </div>
          </div>
        </div>

        {/* Transport */}
        <div className="flex-shrink-0 flex items-center gap-2.5 px-4"
          style={{ height: 56, borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a', background: '#0a0a0a' }}>

          {/* Playback buttons */}
          {[
            { icon: <SkipBack size={12} />,    title: 'Skip to start', fn: () => { setIsPlaying(false); setFrame(0); } },
            { icon: <ChevronLeft size={13} />, title: 'Prev frame',    fn: () => setFrame(f => Math.max(0, f - 1)) },
          ].map((b, i) => (
            <button key={i} title={b.title} onClick={b.fn}
              className="flex items-center justify-center rounded-full text-[#666] hover:text-white hover:bg-white/[0.06] transition-all duration-150 cursor-pointer flex-shrink-0"
              style={{ width: 28, height: 28, border: '1px solid #1e1e1e', background: 'rgba(255,255,255,0.03)' }}>
              {b.icon}
            </button>
          ))}

          <button title={isPlaying ? 'Pause' : 'Play'} onClick={() => setIsPlaying(p => !p)}
            className="flex items-center justify-center rounded-full text-[#3b82f6] transition-all duration-150 cursor-pointer flex-shrink-0"
            style={{
              width: 36, height: 36,
              background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.28)',
              boxShadow: isPlaying ? '0 0 12px rgba(59,130,246,0.3)' : 'none',
            }}>
            {isPlaying ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: 1 }} />}
          </button>

          {[
            { icon: <ChevronRight size={13} />, title: 'Next frame',  fn: () => setFrame(f => Math.min(TOTAL_FRAMES - 1, f + 1)) },
            { icon: <SkipForward size={12} />,  title: 'Skip to end', fn: () => { setIsPlaying(false); setFrame(TOTAL_FRAMES - 1); } },
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
              onChange={e => { setIsPlaying(false); setFrame(Number(e.target.value)); }}
              style={{ '--sp': scrubberPct } as React.CSSProperties} />
          </div>

          <div className="flex-shrink-0" style={{ width: 1, height: 18, background: '#222', margin: '0 2px' }} />

          {/* Timecode */}
          <span className="flex-shrink-0 tabular-nums select-none"
            style={{
              fontFamily: 'var(--font-mono,monospace)', fontSize: 12,
              letterSpacing: 0.5, color: '#bbb', minWidth: 76, textAlign: 'right',
            }}>
            {fmtTimecode(frame)}
          </span>
        </div>

        {/* ── Timeline ─────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 flex overflow-hidden"
          style={{ height: RULER_H + TRACK_H * comps.length, minHeight: 168, maxHeight: 260 }}>

          {/* Label column */}
          <div className="flex-shrink-0 flex flex-col"
            style={{ width: 96, borderRight: '1px solid #1a1a1a' }}>
            <div style={{ height: RULER_H, flexShrink: 0, borderBottom: '1px solid #1a1a1a', background: '#090909' }} />
            {comps.map(c => (
              <div key={c.id}
                className="flex items-center gap-2 flex-shrink-0 cursor-pointer transition-colors duration-100"
                style={{
                  height: TRACK_H, paddingLeft: 12, borderBottom: '1px solid #111',
                  background: c.id === selectedId ? 'rgba(59,130,246,0.06)' : 'transparent',
                }}
                onClick={() => setSelectedId(c.id === selectedId ? null : c.id)}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                  background: c.trackColor, boxShadow: `0 0 4px ${c.trackColor}99`,
                }} />
                <span className="truncate" style={{ fontSize: 11, color: c.id === selectedId ? '#aaa' : '#555', userSelect: 'none', maxWidth: 62 }}>
                  {c.label}
                </span>
              </div>
            ))}
          </div>

          {/* Scrollable clip area */}
          <div ref={clipAreaRef}
            className="flex-1 overflow-x-auto overflow-y-hidden"
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
                {comps.map(c => {
                  const isSelected = c.id === selectedId;
                  return (
                    <div key={c.id} style={{
                      height: TRACK_H, position: 'relative', borderBottom: '1px solid #111',
                      background: isSelected
                        ? 'rgba(59,130,246,0.04)'
                        : c.id % 2 === 0 ? 'rgba(255,255,255,0.012)' : 'transparent',
                    }}>
                      <div
                        className={`tl-clip absolute${isSelected ? ' selected' : ''}`}
                        style={{
                          top: 6, height: TRACK_H - 12,
                          left:  c.startFrame * PX_PER_FRAME,
                          width: c.durationFrames * PX_PER_FRAME,
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
              placeholder={attachedFiles.length > 0 ? 'Add context or press Send…' : 'Describe an edit…'}
              className="flex-1 text-[13px] text-white placeholder:text-[#444] rounded-lg px-3 py-2 outline-none transition-all duration-150"
              style={{
                background: '#0d0d0d',
                border: `1px solid ${inputFocused ? 'rgba(59,130,246,0.4)' : '#1e1e1e'}`,
                boxShadow: inputFocused ? '0 0 0 3px rgba(59,130,246,0.08)' : 'none',
              }} />
            <button onClick={handleSend} disabled={!input.trim() && attachedFiles.length === 0}
              className="flex-shrink-0 flex items-center justify-center rounded-lg transition-all duration-150"
              style={{
                width: 34, height: 34,
                background: (input.trim() || attachedFiles.length > 0) ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${(input.trim() || attachedFiles.length > 0) ? 'rgba(168,85,247,0.3)' : '#1e1e1e'}`,
                color: (input.trim() || attachedFiles.length > 0) ? '#a855f7' : '#333',
                cursor: (input.trim() || attachedFiles.length > 0) ? 'pointer' : 'default',
              }}>
              <Send size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
