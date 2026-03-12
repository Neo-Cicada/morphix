'use client';

import { Layers } from 'lucide-react';

export interface TemplateVariable {
  key: string;
  label: string;
  type: 'text' | 'color' | 'url';
  default: string;
}

export interface Template {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  thumbnail?: string | null;
  animation_code?: string | null;
  variables?: TemplateVariable[] | null;
  use_count: number;
  is_preset: boolean;
}

interface TemplateCardProps {
  template: Template;
  onUse: (template: Template) => void;
}

const categoryColors: Record<string, { bg: string; color: string; border: string }> = {
  'Product Demo': { bg: 'rgba(193,123,79,0.1)', color: '#C17B4F', border: 'rgba(193,123,79,0.25)' },
  'Brand Intro':  { bg: 'rgba(99,102,241,0.1)', color: '#818cf8', border: 'rgba(99,102,241,0.25)' },
  'SaaS Promo':   { bg: 'rgba(16,185,129,0.1)', color: '#34d399', border: 'rgba(16,185,129,0.25)' },
  'Social':       { bg: 'rgba(236,72,153,0.1)', color: '#f472b6', border: 'rgba(236,72,153,0.25)' },
};

function getCategoryStyle(category?: string | null) {
  if (!category) return { bg: 'rgba(255,255,255,0.06)', color: '#888', border: 'rgba(255,255,255,0.1)' };
  return categoryColors[category] ?? { bg: 'rgba(255,255,255,0.06)', color: '#888', border: 'rgba(255,255,255,0.1)' };
}

export function TemplateCard({ template, onUse }: TemplateCardProps) {
  const catStyle = getCategoryStyle(template.category);

  return (
    <div
      className="group rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:border-[#3a3a38]"
      style={{ background: '#1a1a18', border: '1px solid #2e2e2c' }}
    >
      {/* Thumbnail */}
      <div
        className="aspect-video relative flex items-center justify-center overflow-hidden"
        style={{ background: '#111110' }}
      >
        {template.thumbnail ? (
          <img
            src={template.thumbnail}
            alt={template.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <>
            <div
              className="absolute inset-0"
              style={{ background: `radial-gradient(ellipse 60% 50% at 50% 60%, ${catStyle.color}18, transparent)` }}
            />
            <div
              className="absolute inset-0 opacity-[0.025]"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,1) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            />
            <div
              className="relative z-10 size-14 rounded-2xl flex items-center justify-center transition-all duration-200 group-hover:scale-105"
              style={{ background: `${catStyle.color}18`, border: `1px solid ${catStyle.color}30` }}
            >
              <Layers className="size-6" style={{ color: catStyle.color }} />
            </div>
          </>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200" />
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1" style={{ borderTop: '1px solid #2e2e2c' }}>
        <div className="flex items-start gap-2 mb-2">
          <h3 className="text-sm font-semibold text-zinc-200 flex-1 leading-snug">{template.name}</h3>
          {template.category && (
            <span
              className="shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{ background: catStyle.bg, color: catStyle.color, border: `1px solid ${catStyle.border}` }}
            >
              {template.category}
            </span>
          )}
        </div>

        {template.description && (
          <p
            className="text-xs leading-relaxed mb-3 flex-1"
            style={{
              color: '#666',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {template.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto pt-3" style={{ borderTop: '1px solid #252522' }}>
          <span className="text-[11px]" style={{ color: '#444' }}>
            Used {template.use_count.toLocaleString()} {template.use_count === 1 ? 'time' : 'times'}
          </span>
          <button
            onClick={() => onUse(template)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 cursor-pointer hover:brightness-110"
            style={{ background: '#C17B4F', color: '#fff' }}
          >
            Use Template
          </button>
        </div>
      </div>
    </div>
  );
}
