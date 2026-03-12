'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import { Template, TemplateVariable } from './TemplateCard';

interface QuickEditModalProps {
  template: Template;
  onClose: () => void;
}

export function QuickEditModal({ template, onClose }: QuickEditModalProps) {
  const router = useRouter();
  const variables: TemplateVariable[] = (template.variables as TemplateVariable[] | null) ?? [];

  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(variables.map((v) => [v.key, v.default]))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleOpen() {
    if (!template.animation_code) return;
    setLoading(true);
    setError(null);
    try {
      let code = template.animation_code;
      for (const [key, value] of Object.entries(values)) {
        code = code.split(`{{${key}}}`).join(value);
      }

      const title = values['COMPANY_NAME'] ?? template.name;
      const { id } = await api.post<{ id: string }>('/videos/draft', {
        title,
        animation_code: code,
      });

      router.push(`/dashboard/editor?videoId=${id}`);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: 'rgba(0,0,0,0.75)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{
          background: '#1a1a18',
          border: '1px solid #2e2e2c',
          boxShadow: '0 30px 80px rgba(0,0,0,0.8)',
          maxHeight: 'calc(100vh - 48px)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid #2e2e2c' }}
        >
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-white truncate">{template.name}</h2>
            {template.category && (
              <p className="text-[11px] mt-0.5" style={{ color: '#666' }}>{template.category}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="size-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.06]"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Fields */}
        <div className="flex-1 overflow-y-auto px-5 py-5" style={{ gap: 18, display: 'flex', flexDirection: 'column' }}>
          {variables.length === 0 && (
            <p className="text-sm text-center py-4" style={{ color: '#555' }}>
              No customizable fields for this template.
            </p>
          )}

          {variables.map((variable) => (
            <div key={variable.key}>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#aaa' }}>
                {variable.label}
              </label>

              {variable.type === 'color' ? (
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={values[variable.key] ?? variable.default}
                    onChange={(e) => set(variable.key, e.target.value)}
                    className="rounded-lg cursor-pointer"
                    style={{
                      width: 40, height: 36, border: '1px solid #3a3a38',
                      background: 'transparent', padding: 2,
                    }}
                  />
                  <input
                    type="text"
                    value={values[variable.key] ?? variable.default}
                    onChange={(e) => set(variable.key, e.target.value)}
                    className="flex-1 rounded-xl text-sm font-mono transition-colors outline-none"
                    style={{
                      background: '#111110', border: '1px solid #2e2e2c', color: '#ccc',
                      padding: '8px 12px',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#C17B4F'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#2e2e2c'; }}
                  />
                </div>
              ) : (
                <input
                  type={variable.type === 'url' ? 'url' : 'text'}
                  value={values[variable.key] ?? variable.default}
                  onChange={(e) => set(variable.key, e.target.value)}
                  placeholder={variable.default}
                  className="w-full rounded-xl text-sm transition-colors outline-none"
                  style={{
                    background: '#111110', border: '1px solid #2e2e2c', color: '#ccc',
                    padding: '9px 12px',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#C17B4F'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#2e2e2c'; }}
                />
              )}
            </div>
          ))}

          {error && (
            <p className="text-xs rounded-xl px-3 py-2.5" style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-4 shrink-0 flex items-center justify-end gap-2"
          style={{ borderTop: '1px solid #2e2e2c' }}
        >
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium transition-all cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #2e2e2c', color: '#888' }}
          >
            Cancel
          </button>
          <button
            onClick={handleOpen}
            disabled={loading || !template.animation_code}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold text-white transition-all cursor-pointer hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: '#C17B4F' }}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ExternalLink className="size-4" />
            )}
            Open in Editor
          </button>
        </div>
      </div>
    </div>
  );
}
