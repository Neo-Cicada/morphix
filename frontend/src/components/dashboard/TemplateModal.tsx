'use client';

import React, { useState, useEffect } from 'react';
import { X, Trash2, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface Template {
  id: string;
  name: string;
  scene_json: unknown;
  is_preset: boolean;
  user_id: string | null;
}

interface TemplateModalProps {
  open: boolean;
  currentCode: string;
  onClose: () => void;
  onLoad: (code: string) => void;
}

export function TemplateModal({ open, currentCode, onClose, onLoad }: TemplateModalProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api.get<{ templates: Template[] }>('/templates')
      .then(data => setTemplates(data.templates))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  const handleSave = async () => {
    if (!saveName.trim()) return;
    setSaving(true);
    try {
      const data = await api.post<{ template: Template }>('/templates', {
        name: saveName.trim(),
        scene_json: currentCode,
      });
      setTemplates(prev => [...prev, data.template]);
      setSaveName('');
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/templates/${id}`);
      setTemplates(prev => prev.filter(t => t.id !== id));
      if (selectedId === id) setSelectedId(null);
    } catch {}
  };

  const handleLoad = () => {
    const tpl = templates.find(t => t.id === selectedId);
    if (!tpl) return;
    onLoad(tpl.scene_json as string);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="flex flex-col rounded-xl overflow-hidden"
        style={{
          width: 640, maxHeight: '80vh',
          background: '#0d0d0d', border: '1px solid #1e1e1e',
          boxShadow: '0 0 60px rgba(0,0,0,0.8)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 flex-shrink-0"
          style={{ height: 52, borderBottom: '1px solid #1a1a1a' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#ccc' }}>Scene Templates</span>
          <button onClick={onClose} className="cursor-pointer rounded transition-colors hover:bg-white/10 flex items-center justify-center"
            style={{ width: 28, height: 28, border: 'none', background: 'none', color: '#666' }}>
            <X size={14} />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Left pane — template list */}
          <div className="flex flex-col overflow-hidden" style={{ width: 280, borderRight: '1px solid #1a1a1a' }}>
            <div className="flex-1 overflow-y-auto" style={{ padding: '8px 0' }}>
              {loading ? (
                <div className="flex items-center justify-center" style={{ padding: 40 }}>
                  <Loader2 size={18} className="animate-spin" style={{ color: '#444' }} />
                </div>
              ) : templates.length === 0 ? (
                <p style={{ fontSize: 12, color: '#444', textAlign: 'center', padding: '40px 20px' }}>No templates yet</p>
              ) : (
                templates.map(tpl => (
                  <div key={tpl.id}
                    className="flex items-center gap-2 cursor-pointer transition-colors"
                    style={{
                      padding: '8px 14px',
                      background: selectedId === tpl.id ? 'rgba(59,130,246,0.1)' : 'transparent',
                      borderLeft: selectedId === tpl.id ? '2px solid #3b82f6' : '2px solid transparent',
                    }}
                    onClick={() => setSelectedId(tpl.id)}
                  >
                    <span className="flex-1 truncate" style={{ fontSize: 12, color: selectedId === tpl.id ? '#ccc' : '#666' }}>
                      {tpl.name}
                    </span>
                    {tpl.is_preset && (
                      <span style={{
                        fontSize: 9, padding: '2px 6px', borderRadius: 4,
                        background: 'rgba(168,85,247,0.15)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.25)',
                        fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase',
                      }}>Preset</span>
                    )}
                    {!tpl.is_preset && (
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(tpl.id); }}
                        className="flex items-center justify-center cursor-pointer rounded transition-colors hover:bg-white/10"
                        style={{ width: 20, height: 20, border: 'none', background: 'none', color: '#444', flexShrink: 0 }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#444'; }}
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Load button */}
            <div className="flex-shrink-0 p-3" style={{ borderTop: '1px solid #1a1a1a' }}>
              <button
                onClick={handleLoad}
                disabled={!selectedId}
                className="w-full rounded-lg text-[12px] font-semibold transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  padding: '7px 0',
                  background: selectedId ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${selectedId ? 'rgba(59,130,246,0.35)' : '#1e1e1e'}`,
                  color: selectedId ? '#60a5fa' : '#555',
                }}
              >
                Load Template
              </button>
            </div>
          </div>

          {/* Right pane — save current scene */}
          <div className="flex flex-col p-5 gap-4" style={{ flex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Save Current Scene
            </p>
            <div className="flex flex-col gap-2">
              <label style={{ fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: 0.5 }}>Template Name</label>
              <input
                type="text"
                placeholder="My template..."
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
                className="text-[12px] text-white placeholder:text-[#333] rounded-lg px-3 py-2 outline-none"
                style={{
                  background: '#111', border: '1px solid #1e1e1e',
                  fontFamily: 'inherit',
                }}
              />
            </div>
            <button
              onClick={handleSave}
              disabled={!saveName.trim() || saving}
              className="rounded-lg text-[12px] font-semibold transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                padding: '8px 16px',
                background: 'rgba(168,85,247,0.12)',
                border: '1px solid rgba(168,85,247,0.25)',
                color: '#a855f7',
              }}
            >
              {saving && <Loader2 size={12} className="animate-spin" />}
              Save Template
            </button>

            <p style={{ fontSize: 11, color: '#2a2a2a', lineHeight: 1.6, marginTop: 'auto' }}>
              Saved templates appear in the list and can be loaded into any session.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
