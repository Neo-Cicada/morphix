'use client';

import { useEffect, useState } from 'react';
import { PlusCircle, Play } from 'lucide-react';
import Link from 'next/link';
import { VideoCard } from '@/components/dashboard/VideoCard';
import { api } from '@/lib/api';

interface VideoSummary {
  id: string;
  app_name: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  created_at: string;
}

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'processing', label: 'Processing' },
  { id: 'done', label: 'Completed' },
  { id: 'failed', label: 'Failed' },
] as const;

export default function MyVideosPage() {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [videos, setVideos] = useState<VideoSummary[]>([]);

  useEffect(() => {
    api.get<VideoSummary[]>('/videos').then(setVideos).catch(() => {});
  }, []);

  const filtered = activeFilter === 'all' ? videos : videos.filter((v) => v.status === activeFilter);

  return (
    <div className="px-6 py-10 lg:px-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#3b82f6] block mb-2">
            Library
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white leading-tight">My Videos</h1>
          <p className="text-sm text-[#888888] mt-1.5">All your generated marketing videos.</p>
        </div>
        <Link
          href="/dashboard/new"
          className="btn-gradient inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white cursor-pointer shrink-0"
        >
          <PlusCircle className="h-4 w-4" />
          <span className="hidden sm:inline">New Video</span>
          <span className="sm:hidden">New</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <div
        className="inline-flex items-center gap-1 rounded-xl p-1 mb-8"
        style={{ background: '#0A0A10', border: '1px solid #111122' }}
      >
        {FILTERS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer"
            style={{
              background: activeFilter === tab.id ? 'rgba(59,130,246,0.1)' : 'transparent',
              color: activeFilter === tab.id ? '#3b82f6' : '#555555',
              border: activeFilter === tab.id ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((v) => (
            <VideoCard
              key={v.id}
              title={v.app_name}
              status={v.status}
              date={new Date(v.created_at).toLocaleDateString()}
            />
          ))}
        </div>
      ) : (
        <div
          className="rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center text-center"
          style={{ background: '#0A0A10', border: '1px solid #111122' }}
        >
          <div
            className="relative w-full max-w-lg aspect-video rounded-2xl overflow-hidden mb-8"
            style={{ background: '#05050A', border: '1px solid #111122' }}
          >
            <div
              className="absolute inset-0"
              style={{ background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.1) 0%, rgba(0,243,255,0.05) 50%, transparent 70%)' }}
            />
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.025) 1px,transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div
                className="play-button-pulse size-16 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(59,130,246,0.12)',
                  border: '1px solid rgba(59,130,246,0.25)',
                  boxShadow: '0 0 30px rgba(59,130,246,0.15)',
                }}
              >
                <Play className="h-7 w-7 text-[#3b82f6] ml-0.5" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 px-4 py-2" style={{ background: 'rgba(0,0,0,0.4)' }}>
              <div className="h-[1px] bg-[#111122] rounded-full overflow-hidden">
                <div className="h-full w-[0%] rounded-full" style={{ background: 'linear-gradient(90deg, #3b82f6, #00f3ff)' }} />
              </div>
            </div>
          </div>

          <h3 className="text-lg font-bold tracking-tight text-white mb-2">
            Your first cinematic video is one click away
          </h3>
          <p className="text-sm text-[#666666] mb-6 max-w-sm">
            Upload screenshots. We handle the rest — script, voiceover, cinematic render.
          </p>
          <Link
            href="/dashboard/new"
            className="btn-gradient inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            Create New Video
          </Link>
        </div>
      )}
    </div>
  );
}
