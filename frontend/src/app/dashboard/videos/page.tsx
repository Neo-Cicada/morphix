'use client';

import { useState } from 'react';
import { PlusCircle, Play, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import { VideoCard } from '@/components/dashboard/VideoCard';
import { useVideos } from '@/hooks/useVideos';

export default function MyVideosPage() {
  const [order, setOrder] = useState<'desc' | 'asc'>('desc');
  const { videos, hasMore, isLoading, isLoadingMore, loadMore } = useVideos(order);

  return (
    <div className="px-6 py-10 lg:px-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#C17B4F] block mb-2">
            Library
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white leading-tight">My Videos</h1>
          <p className="text-sm text-[#888888] mt-1.5">All your generated marketing videos.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all duration-200 cursor-pointer"
            style={{ background: '#1a1a18', border: '1px solid #2e2e2c', color: '#888888' }}
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            {order === 'desc' ? 'Newest first' : 'Oldest first'}
          </button>
          <Link
            href="/dashboard/new"
            className="btn-gradient inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white cursor-pointer shrink-0"
          >
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">New Video</span>
            <span className="sm:hidden">New</span>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl aspect-video animate-pulse" style={{ background: '#1a1a18', border: '1px solid #2e2e2c' }} />
          ))}
        </div>
      ) : videos.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((v) => (
              <VideoCard
                key={v.id}
                id={v.id}
                title={v.app_name}
                status={v.status}
                source={v.source}
                date={new Date(v.created_at).toLocaleDateString()}
                thumbnail={v.thumbnail}
              />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50"
                style={{ background: '#1a1a18', border: '1px solid #2e2e2c', color: '#888888' }}
              >
                {isLoadingMore ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </>
      ) : (
        <div
          className="rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center text-center"
          style={{ background: '#1a1a18', border: '1px solid #2e2e2c' }}
        >
          <div
            className="relative w-full max-w-lg aspect-video rounded-2xl overflow-hidden mb-8"
            style={{ background: '#111110', border: '1px solid #2e2e2c' }}
          >
            <div className="absolute inset-0" style={{ background: 'rgba(193,123,79,0.06)' }} />
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
                  background: 'rgba(193,123,79,0.12)',
                  border: '1px solid rgba(193,123,79,0.25)',
                  boxShadow: '0 0 30px rgba(193,123,79,0.15)',
                }}
              >
                <Play className="h-7 w-7 text-[#C17B4F] ml-0.5" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 px-4 py-2" style={{ background: 'rgba(0,0,0,0.4)' }}>
              <div className="h-[1px] bg-[#2e2e2c] rounded-full overflow-hidden">
                <div className="h-full w-[0%] rounded-full" style={{ background: '#C17B4F' }} />
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
