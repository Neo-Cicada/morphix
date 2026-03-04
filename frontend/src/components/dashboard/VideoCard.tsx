import { MoreVertical, Download, Play } from 'lucide-react';

interface VideoCardProps {
  title: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  date: string;
}

const statusConfig = {
  pending: { label: 'Pending', bg: 'rgba(234,179,8,0.08)', color: '#facc15', border: 'rgba(234,179,8,0.2)' },
  processing: { label: 'Processing', bg: 'rgba(59,130,246,0.08)', color: '#3b82f6', border: 'rgba(59,130,246,0.2)' },
  done: { label: 'Completed', bg: 'rgba(34,197,94,0.08)', color: '#22c55e', border: 'rgba(34,197,94,0.2)' },
  failed: { label: 'Failed', bg: 'rgba(239,68,68,0.08)', color: '#f87171', border: 'rgba(239,68,68,0.2)' },
};

export function VideoCard({ title, status, date }: VideoCardProps) {
  const s = statusConfig[status];

  return (
    <div
      className="group rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer hover:border-[#2a2a2a]"
      style={{ background: '#0d0d0d', border: '1px solid #1e1e1e' }}
    >
      {/* Thumbnail — matches landing page card style */}
      <div
        className="aspect-video relative flex items-center justify-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #3b82f6/10 0%, transparent 50%, rgba(168,85,247,0.06) 100%)' }}
      >
        {/* Radial gradient bg */}
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.08) 0%, rgba(168,85,247,0.04) 40%, transparent 70%)' }}
        />
        {/* Grid lines */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Play button — matches landing page */}
        <div
          className="relative z-10 size-12 rounded-full flex items-center justify-center transition-all duration-200"
          style={{
            background: 'rgba(59,130,246,0.12)',
            border: '1px solid rgba(59,130,246,0.25)',
            boxShadow: '0 0 20px rgba(59,130,246,0.1)',
          }}
        >
          <Play
            className="h-5 w-5 ml-0.5 text-[#3b82f6] group-hover:text-[#60a5fa] transition-colors"
          />
        </div>
        {/* Bottom progress bar — matches landing video player */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ background: 'linear-gradient(90deg, #3b82f6, #a855f7, transparent)' }}
        />
      </div>

      {/* Info */}
      <div className="p-4" style={{ borderTop: '1px solid #1a1a1a' }}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-zinc-300 truncate">{title}</h3>
            <p className="text-[11px] mt-0.5" style={{ color: '#555555' }}>{date}</p>
          </div>
          <button
            className="text-zinc-700 hover:text-zinc-400 transition-colors shrink-0 p-1 rounded-md hover:bg-white/[0.04] cursor-pointer"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-3">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
            style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
          >
            {s.label}
          </span>
          <button
            disabled={status !== 'done'}
            className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
            style={{ color: '#555555' }}
          >
            <Download className="h-3 w-3" />
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
