'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Store, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Template, TemplateCard } from './TemplateCard';
import { QuickEditModal } from './QuickEditModal';

interface TemplatesResponse {
  templates: Template[];
}

function fetcher(path: string) {
  return api.get<TemplatesResponse>(path);
}

export function MarketplacePage() {
  const { data, error, isLoading } = useSWR('/templates', fetcher);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const presets = data?.templates.filter((t) => t.is_preset) ?? [];

  const categories = ['All', ...Array.from(new Set(presets.map((t) => t.category).filter(Boolean) as string[]))];

  const filtered =
    activeCategory === 'All' ? presets : presets.filter((t) => t.category === activeCategory);

  return (
    <div className="flex flex-col min-h-0 h-full" style={{ color: '#ccc' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-5 shrink-0"
        style={{ borderBottom: '1px solid #1e1e1c' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="size-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(193,123,79,0.1)', border: '1px solid rgba(193,123,79,0.2)' }}
          >
            <Store className="size-4 text-[#C17B4F]" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">Template Marketplace</h1>
            <p className="text-xs" style={{ color: '#555' }}>
              Ready-made animations — customize and open in the editor
            </p>
          </div>
        </div>
      </div>

      {/* Category tabs */}
      {!isLoading && !error && categories.length > 1 && (
        <div
          className="flex items-center gap-1.5 px-6 py-3 shrink-0 overflow-x-auto"
          style={{ borderBottom: '1px solid #1e1e1c' }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 cursor-pointer"
              style={
                activeCategory === cat
                  ? { background: '#C17B4F', color: '#fff' }
                  : { background: 'rgba(255,255,255,0.04)', color: '#666', border: '1px solid #2e2e2c' }
              }
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-6 animate-spin text-[#C17B4F]" />
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm" style={{ color: '#666' }}>Failed to load templates.</p>
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Store className="size-8" style={{ color: '#333' }} />
            <p className="text-sm" style={{ color: '#555' }}>No templates found.</p>
          </div>
        )}

        {!isLoading && !error && filtered.length > 0 && (
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {filtered.map((template) => (
              <TemplateCard key={template.id} template={template} onUse={setSelectedTemplate} />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedTemplate && (
        <QuickEditModal template={selectedTemplate} onClose={() => setSelectedTemplate(null)} />
      )}
    </div>
  );
}
