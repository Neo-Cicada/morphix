'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Download, Play, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface VideoCardProps {
  id: string;
  title: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  source: 'form' | 'editor';
  date: string;
  thumbnail?: string | null;
  onDelete?: (id: string) => void;
}

const statusConfig = {
  pending: { label: 'Pending', bg: 'rgba(193,123,79,0.08)', color: '#C17B4F', border: 'rgba(193,123,79,0.2)' },
  processing: { label: 'Processing', bg: 'rgba(193,123,79,0.08)', color: '#C17B4F', border: 'rgba(193,123,79,0.2)' },
  done: { label: 'Completed', bg: 'rgba(193,123,79,0.08)', color: '#D4A574', border: 'rgba(193,123,79,0.2)' },
  failed: { label: 'Failed', bg: 'rgba(239,68,68,0.08)', color: '#f87171', border: 'rgba(239,68,68,0.2)' },
};

const draftBadge = { bg: 'rgba(245,158,11,0.08)', color: '#f59e0b', border: 'rgba(245,158,11,0.2)' };

export function VideoCard({ id, title, status, source, date, thumbnail, onDelete }: VideoCardProps) {
  const isDraft = source === 'editor' && status === 'pending';
  const s = statusConfig[status];
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const Wrapper = isDraft
    ? ({ children }: { children: React.ReactNode }) => (
        <Link href={`/dashboard/editor?videoId=${id}`} className="block group rounded-2xl overflow-hidden transition-all duration-200 hover:border-[#3a3a38]" style={{ background: '#1a1a18', border: '1px solid #2e2e2c' }}>
          {children}
        </Link>
      )
    : ({ children }: { children: React.ReactNode }) => (
        <div className="group rounded-2xl overflow-hidden transition-all duration-200 hover:border-[#2a2a2a]" style={{ background: '#1a1a18', border: '1px solid #2e2e2c' }}>
          {children}
        </div>
      );

  return (
    <>
      <Wrapper>
        {/* Thumbnail */}
        <div
          className="aspect-video relative flex items-center justify-center overflow-hidden"
          style={{ background: 'rgba(193,123,79,0.07)' }}
        >
          {thumbnail ? (
            <>
              <img
                src={thumbnail}
                alt={title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <div
                  className="size-12 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(193,123,79,0.8)', boxShadow: '0 0 20px rgba(193,123,79,0.4)' }}
                >
                  <Play className="h-5 w-5 ml-0.5 text-white" />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="absolute inset-0" style={{ background: 'rgba(193,123,79,0.06)' }} />
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,1) 1px, transparent 1px)',
                  backgroundSize: '28px 28px',
                }}
              />
              <div
                className="relative z-10 size-12 rounded-full flex items-center justify-center transition-all duration-200"
                style={{
                  background: 'rgba(193,123,79,0.12)',
                  border: '1px solid rgba(193,123,79,0.25)',
                  boxShadow: '0 0 20px rgba(193,123,79,0.1)',
                }}
              >
                <Play className="h-5 w-5 ml-0.5 text-[#C17B4F] group-hover:text-[#D4A574] transition-colors" />
              </div>
            </>
          )}
          <div
            className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
            style={{ background: 'rgba(193, 123, 79, 0.25)' }}
          />
        </div>

        {/* Info */}
        <div className="p-4" style={{ borderTop: '1px solid #2e2e2c' }}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-zinc-300 truncate">{title}</h3>
              <p className="text-[11px] mt-0.5" style={{ color: '#555555' }}>{date}</p>
            </div>

            {/* More menu */}
            <div className="relative shrink-0" ref={menuRef} onClick={(e) => e.preventDefault()}>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(v => !v); }}
                className="text-zinc-700 hover:text-zinc-400 transition-colors p-1 rounded-md hover:bg-white/[0.04] cursor-pointer"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 top-full mt-1 rounded-xl overflow-hidden z-50"
                  style={{
                    background: '#1e1e1c',
                    border: '1px solid #2e2e2c',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                    minWidth: 140,
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setMenuOpen(false);
                      setConfirmDelete(true);
                    }}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 text-xs font-medium transition-colors cursor-pointer hover:bg-red-500/10 text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-3">
            {isDraft ? (
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                style={{ background: draftBadge.bg, color: draftBadge.color, border: `1px solid ${draftBadge.border}` }}
              >
                Draft
              </span>
            ) : (
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
              >
                {s.label}
              </span>
            )}

            {isDraft ? (
              <Link
                href={`/dashboard/editor?videoId=${id}`}
                className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer"
                style={{ color: '#f59e0b' }}
              >
                Resume
              </Link>
            ) : (
              <button
                disabled={status !== 'done'}
                className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                style={{ color: '#555555' }}
              >
                <Download className="h-3 w-3" />
                Download
              </button>
            )}
          </div>
        </div>
      </Wrapper>

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.8)' }}
            onClick={() => setConfirmDelete(false)}
          />
          <div
            className="relative w-full max-w-sm rounded-2xl p-6 shadow-2xl mx-4"
            style={{
              background: '#1a1a18',
              border: '1px solid rgba(239,68,68,0.2)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.9)',
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="size-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <Trash2 className="h-4 w-4 text-red-400" />
              </div>
              <h3 className="text-sm font-bold tracking-tight text-white">Delete video?</h3>
            </div>
            <p className="text-sm text-[#666666] mb-5 leading-relaxed">
              <span className="text-zinc-400 font-medium">{title}</span> will be permanently deleted. This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #2e2e2c', color: '#888888' }}
              >
                Cancel
              </button>
              <button
                onClick={() => { setConfirmDelete(false); onDelete?.(id); }}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all duration-200 cursor-pointer hover:brightness-110"
                style={{ background: '#dc2626' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
