'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight,
  Send, Sparkles,
} from 'lucide-react';

const FPS = 30;
const TOTAL_FRAMES = 300; // 10 s

const TRACKS = [
  { id: 1, label: 'Video 1',  color: '#3b82f6', clips: [{ start: 0.0, end: 0.62 }] },
  { id: 2, label: 'Audio',    color: '#22c55e', clips: [{ start: 0.08, end: 0.82 }] },
  { id: 3, label: 'Text',     color: '#a855f7', clips: [{ start: 0.28, end: 0.56 }] },
  { id: 4, label: 'Effects',  color: '#f59e0b', clips: [{ start: 0.48, end: 0.76 }] },
];

const RULER_TICKS = 11; // 0 s … 10 s

function fmt(frame: number) {
  const s = Math.floor(frame / FPS);
  const f = frame % FPS;
  return `${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
}

const ICON_BTN: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  border: '1px solid #1e1e1e', borderRadius: '50%', cursor: 'pointer',
  background: 'rgba(255,255,255,0.05)', color: '#888',
  width: 28, height: 28, flexShrink: 0,
};

const ICON_BTN_PRIMARY: React.CSSProperties = {
  ...ICON_BTN,
  width: 36, height: 36,
  background: 'rgba(59,130,246,0.15)',
  border: '1px solid rgba(59,130,246,0.3)',
  color: '#3b82f6',
};

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 0,
    role: 'assistant',
    text: "Hi! I can help you edit your video. Try describing a change — like \"trim the last 2 seconds\" or \"add a fade-in transition\".",
  },
];

export function EditorPage() {
  const [isPlaying, setIsPlaying]     = useState(false);
  const [frame, setFrame]             = useState(0);
  const [messages, setMessages]       = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput]             = useState('');
  const intervalRef                   = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrubRef                      = useRef<HTMLDivElement>(null);
  const messagesEndRef                = useRef<HTMLDivElement>(null);

  /* Playback loop */
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setFrame(f => {
          if (f >= TOTAL_FRAMES - 1) { setIsPlaying(false); return 0; }
          return f + 1;
        });
      }, 1000 / FPS);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying]);

  /* Auto-scroll chat */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* Timeline scrub */
  const handleScrub = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrubRef.current) return;
    const rect = scrubRef.current.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setFrame(Math.round(pct * (TOTAL_FRAMES - 1)));
  }, []);

  /* Send chat */
  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    const uid = Date.now();
    setMessages(m => [...m, { id: uid, role: 'user', text }]);
    setInput('');
    setTimeout(() => {
      setMessages(m => [...m, {
        id: uid + 1,
        role: 'assistant',
        text: "Got it! I'll apply that edit to your composition. (Full AI integration coming soon.)",
      }]);
    }, 700);
  };

  const playheadPct = (frame / (TOTAL_FRAMES - 1)) * 100;

  return (
    <div style={{
      display: 'flex', height: '100%', overflow: 'hidden',
      background: '#080808', fontFamily: 'inherit',
    }}>

      {/* ─── LEFT PANEL ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* Top bar */}
        <div style={{
          height: 48, flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: 0,
          borderBottom: '1px solid #1a1a1a', background: '#0a0a0a',
          paddingLeft: 16, paddingRight: 16,
        }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#fff', marginRight: 24, letterSpacing: '-0.02em' }}>
            Morphix
          </span>
          {(['File', 'Edit', 'View', 'Export'] as const).map(label => (
            <button
              key={label}
              style={{
                padding: '4px 10px', fontSize: 12, color: '#777',
                background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6,
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = '#777')}
            >
              {label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button style={{
            padding: '6px 18px', fontSize: 12, fontWeight: 600, color: '#fff',
            background: 'linear-gradient(135deg, #3b82f6, #a855f7)',
            border: 'none', borderRadius: 8, cursor: 'pointer',
            boxShadow: '0 0 16px rgba(59,130,246,0.25)',
          }}>
            Render
          </button>
        </div>

        {/* Preview */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#0c0c0c', padding: 24, overflow: 'hidden', minHeight: 0,
        }}>
          <div style={{
            position: 'relative', width: '100%', maxWidth: 720, aspectRatio: '16/9',
            background: '#000', borderRadius: 8, overflow: 'hidden',
            border: '1px solid #222', boxShadow: '0 0 80px rgba(0,0,0,0.9)',
          }}>
            {/* Letterbox bars */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '10%', background: '#000', zIndex: 2 }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '10%', background: '#000', zIndex: 2 }} />
            {/* Gradient bg */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse at 28% 38%, rgba(59,130,246,0.18) 0%, transparent 55%), radial-gradient(ellipse at 72% 62%, rgba(168,85,247,0.13) 0%, transparent 55%)',
            }} />
            {/* Watermark */}
            <div style={{
              position: 'absolute', top: '13%', left: '50%', transform: 'translateX(-50%)',
              color: 'rgba(255,255,255,0.05)', fontSize: 26, fontWeight: 800,
              letterSpacing: 10, userSelect: 'none', zIndex: 3,
            }}>
              MORPHIX
            </div>
            {/* Frame counter */}
            <div style={{
              position: 'absolute', bottom: '12%', left: '50%', transform: 'translateX(-50%)',
              color: 'rgba(255,255,255,0.22)', fontSize: 10, fontFamily: 'monospace',
              letterSpacing: 2, zIndex: 3,
            }}>
              {fmt(frame)} · f{frame}
            </div>
          </div>
        </div>

        {/* Transport controls */}
        <div style={{
          height: 52, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a',
          background: '#0a0a0a', position: 'relative',
        }}>
          <button style={ICON_BTN} title="Skip to start" onClick={() => setFrame(0)}>
            <SkipBack size={13} />
          </button>
          <button style={ICON_BTN} title="Step back" onClick={() => setFrame(f => Math.max(0, f - 1))}>
            <ChevronLeft size={14} />
          </button>
          <button style={ICON_BTN_PRIMARY} title="Play / Pause" onClick={() => setIsPlaying(p => !p)}>
            {isPlaying ? <Pause size={15} /> : <Play size={15} style={{ marginLeft: 1 }} />}
          </button>
          <button style={ICON_BTN} title="Step forward" onClick={() => setFrame(f => Math.min(TOTAL_FRAMES - 1, f + 1))}>
            <ChevronRight size={14} />
          </button>
          <button style={ICON_BTN} title="Skip to end" onClick={() => setFrame(TOTAL_FRAMES - 1)}>
            <SkipForward size={13} />
          </button>

          <div style={{
            position: 'absolute', right: 16,
            fontSize: 10, color: '#444', fontFamily: 'monospace', letterSpacing: 1,
          }}>
            {fmt(frame)} &nbsp;·&nbsp; {FPS} fps
          </div>
        </div>

        {/* Timeline */}
        <div style={{ height: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Ruler row */}
          <div style={{
            height: 22, flexShrink: 0,
            display: 'flex', alignItems: 'center',
            borderBottom: '1px solid #1a1a1a', background: '#090909',
          }}>
            {/* Label gutter */}
            <div style={{ width: 90, flexShrink: 0, borderRight: '1px solid #1a1a1a' }} />
            {/* Tick marks */}
            <div style={{ flex: 1, position: 'relative', height: '100%' }}>
              {Array.from({ length: RULER_TICKS }).map((_, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  left: `${(i / (RULER_TICKS - 1)) * 100}%`,
                  top: '50%', transform: 'translate(-50%, -50%)',
                  fontSize: 9, color: '#3a3a3a', fontFamily: 'monospace',
                }}>
                  {Math.round((i / (RULER_TICKS - 1)) * (TOTAL_FRAMES / FPS))}s
                </div>
              ))}
            </div>
          </div>

          {/* Track rows */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Labels column */}
            <div style={{ width: 90, flexShrink: 0, borderRight: '1px solid #1a1a1a' }}>
              {TRACKS.map(track => (
                <div key={track.id} style={{
                  height: 36, display: 'flex', alignItems: 'center', gap: 6,
                  paddingLeft: 12, borderBottom: '1px solid #111',
                }}>
                  <div style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: track.color, flexShrink: 0,
                    boxShadow: `0 0 5px ${track.color}88`,
                  }} />
                  <span style={{ fontSize: 10, color: '#555' }}>{track.label}</span>
                </div>
              ))}
            </div>

            {/* Clip + playhead column */}
            <div
              ref={scrubRef}
              onClick={handleScrub}
              style={{ flex: 1, position: 'relative', cursor: 'col-resize', overflow: 'hidden' }}
            >
              {TRACKS.map(track => (
                <div key={track.id} style={{
                  height: 36, position: 'relative', borderBottom: '1px solid #111',
                  background: track.id % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                }}>
                  {track.clips.map((clip, ci) => (
                    <div key={ci} style={{
                      position: 'absolute',
                      top: 6, height: 24,
                      left: `${clip.start * 100}%`,
                      width: `${(clip.end - clip.start) * 100}%`,
                      borderRadius: 4,
                      background: `${track.color}28`,
                      border: `1px solid ${track.color}55`,
                      cursor: 'pointer',
                    }} />
                  ))}
                </div>
              ))}

              {/* Playhead */}
              <div style={{
                position: 'absolute', top: 0, bottom: 0,
                left: `${playheadPct}%`,
                width: 1, background: '#ef4444',
                pointerEvents: 'none', zIndex: 10,
                boxShadow: '0 0 4px rgba(239,68,68,0.6)',
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: '50%',
                  transform: 'translateX(-50%)',
                  width: 7, height: 7, borderRadius: '50%',
                  background: '#ef4444',
                  boxShadow: '0 0 6px rgba(239,68,68,0.8)',
                }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── RIGHT PANEL — AI Chat ───────────────────────────────────── */}
      <div style={{
        width: 340, flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        borderLeft: '1px solid #1a1a1a', background: '#0a0a0a', overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          padding: '14px 18px', flexShrink: 0,
          borderBottom: '1px solid #1a1a1a',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={15} style={{ color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>AI Editor</div>
            <div style={{ fontSize: 10, color: '#444', marginTop: 1 }}>Claude</div>
          </div>
        </div>

        {/* Hint card */}
        <div style={{ padding: '10px 14px', flexShrink: 0, borderBottom: '1px solid #111' }}>
          <div style={{
            padding: '9px 11px',
            background: 'rgba(168,85,247,0.05)',
            border: '1px solid rgba(168,85,247,0.14)',
            borderRadius: 9, fontSize: 11, color: '#666', lineHeight: 1.65,
          }}>
            Describe edits in natural language — trim a clip, add a title card, change music, or adjust timing.
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '12px 14px',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          {messages.map(msg => (
            <div key={msg.id} style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}>
              <div style={{
                maxWidth: '86%',
                padding: '8px 11px',
                borderRadius: msg.role === 'user'
                  ? '12px 12px 3px 12px'
                  : '12px 12px 12px 3px',
                background: msg.role === 'user'
                  ? 'rgba(168,85,247,0.14)'
                  : '#131313',
                border: `1px solid ${msg.role === 'user'
                  ? 'rgba(168,85,247,0.24)'
                  : '#1c1c1c'}`,
                fontSize: 12, lineHeight: 1.65,
                color: msg.role === 'user' ? '#c4b5fd' : '#888',
              }}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: '10px 14px', flexShrink: 0,
          borderTop: '1px solid #1a1a1a',
          display: 'flex', gap: 8, alignItems: 'center',
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Describe an edit…"
            style={{
              flex: 1, padding: '8px 11px',
              background: '#0f0f0f', border: '1px solid #1e1e1e',
              borderRadius: 8, color: '#ddd', fontSize: 12,
              outline: 'none',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            style={{
              width: 34, height: 34, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: input.trim() ? 'rgba(168,85,247,0.18)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${input.trim() ? 'rgba(168,85,247,0.32)' : '#1e1e1e'}`,
              borderRadius: 8,
              color: input.trim() ? '#a855f7' : '#333',
              cursor: input.trim() ? 'pointer' : 'default',
              transition: 'all 0.15s',
            }}
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
