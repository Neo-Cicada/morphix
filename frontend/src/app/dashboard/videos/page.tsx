import { PlaySquare, PlusCircle } from 'lucide-react';
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
          <h1 className="text-2xl font-bold tracking-tight text-white">My Videos</h1>
          <p className="text-sm text-gray-500 mt-1">All your generated marketing videos.</p>
        </div>
        <Link
          href="/dashboard/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-600 shadow-lg shadow-blue-500/20"
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
        <div className="rounded-xl border border-[#222222] bg-[#161616] p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
          <div className="size-16 rounded-full bg-white/[0.04] flex items-center justify-center mb-5 border border-[#222222]">
            <PlaySquare className="h-7 w-7 text-gray-600" />
          </div>
          <h3 className="text-base font-medium text-gray-300 mb-1.5">No videos generated yet</h3>
          <p className="text-sm text-gray-600 mb-6 max-w-sm">
            Create your first AI marketing video to see it appear here.
          </p>
          <Link
            href="/dashboard/new"
            className="inline-flex items-center gap-2 rounded-lg bg-white text-black px-5 py-2.5 text-sm font-medium transition-all hover:bg-gray-200"
          >
            <PlusCircle className="h-4 w-4" />
            Create New Video
          </Link>
        </div>
      )}
    </div>
  );
}
