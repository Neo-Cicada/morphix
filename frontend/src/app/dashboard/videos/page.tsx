import { PlusCircle, Play } from 'lucide-react';
import Link from 'next/link';
import { VideoCard } from '@/components/dashboard/VideoCard';

export default function MyVideosPage() {
  // Sample cards to show the card design (will be replaced with real data later)
  const sampleVideos: { title: string; status: 'pending' | 'processing' | 'done' | 'failed'; date: string }[] = [];

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title text-white">My Videos</h1>
          <p className="text-sm text-[#888888] mt-1">All your generated marketing videos.</p>
        </div>
        <Link
          href="/dashboard/new"
          className="btn-gradient inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
        >
          <PlusCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Create New Video</span>
          <span className="sm:hidden">New</span>
        </Link>
      </div>

      {sampleVideos.length > 0 ? (
        /* Video Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sampleVideos.map((video, i) => (
            <VideoCard key={i} {...video} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="morphix-card rounded-xl border border-[#222222] bg-[#161616] p-8 sm:p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
          <div className="relative z-10 flex flex-col items-center">
            {/* Mock Video Thumbnail */}
            <div className="relative w-full max-w-lg aspect-video rounded-xl overflow-hidden mb-8" style={{ background: 'linear-gradient(135deg, #0d1829 0%, #1a0a2e 100%)' }}>
              {/* Glow effect */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute w-[250px] h-[200px] bg-blue-500/20 blur-[70px] rounded-full" />
                <div className="absolute w-[180px] h-[160px] bg-purple-500/15 blur-[60px] rounded-full translate-x-10" />
              </div>
              {/* Grid lines */}
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              {/* Play button */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="play-button-pulse size-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                  <Play className="h-7 w-7 text-white ml-1" fill="white" />
                </div>
              </div>
              {/* Bottom gradient bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-transparent" />
            </div>

            <h3 className="text-lg font-semibold text-white mb-2">Your first cinematic video is one click away</h3>
            <p className="text-sm text-[#888888] mb-6 max-w-sm">
              Upload screenshots. We handle the rest.
            </p>
            <Link
              href="/dashboard/new"
              className="btn-gradient inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white"
            >
              <PlusCircle className="h-4 w-4" />
              Create New Video
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
