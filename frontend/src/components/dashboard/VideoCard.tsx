import { MoreVertical, Download, Play } from 'lucide-react';

interface VideoCardProps {
  title: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  date: string;
}

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  processing: { label: 'Processing', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  done: { label: 'Completed', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  failed: { label: 'Failed', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

export function VideoCard({ title, status, date }: VideoCardProps) {
  const statusInfo = statusConfig[status];

  return (
    <div className="group rounded-xl border border-[#222222] bg-[#161616] overflow-hidden transition-all hover:border-[#2a2a2a] hover:shadow-lg hover:shadow-black/20">
      {/* Thumbnail */}
      <div className="aspect-video bg-[#111111] relative flex items-center justify-center">
        <div className="size-12 rounded-full bg-white/[0.05] flex items-center justify-center border border-white/[0.08] group-hover:bg-white/[0.08] transition-colors">
          <Play className="h-5 w-5 text-gray-500 group-hover:text-gray-300 transition-colors ml-0.5" />
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-white truncate">{title}</h3>
            <p className="text-xs text-gray-500 mt-1">{date}</p>
          </div>
          <button className="text-gray-600 hover:text-gray-300 transition-colors shrink-0 p-1 rounded-md hover:bg-white/[0.05]">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-3">
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
          <button
            disabled={status !== 'done'}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="h-3 w-3" />
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
