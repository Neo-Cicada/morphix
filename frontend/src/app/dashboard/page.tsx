import { Video, Sparkles, Zap, Calendar, PlaySquare, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { StatsCard } from '@/components/dashboard/StatsCard';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          {getGreeting()}, Neo
        </h1>
        <p className="text-sm text-gray-500 mt-1">Here&apos;s your dashboard overview.</p>
      </div>

      {/* Hero CTA Card */}
      <div className="relative rounded-xl border border-[#222222] bg-[#161616] p-6 sm:p-8 mb-8 overflow-hidden">
        {/* Subtle gradient glow */}
        <div className="absolute top-0 right-0 w-[300px] h-[200px] bg-blue-500/[0.06] blur-[80px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">Create your first video</h2>
            <p className="text-sm text-gray-500 max-w-md">
              Transform your product screenshots into cinematic marketing videos with AI.
            </p>
          </div>
          <Link
            href="/dashboard/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-blue-600 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 shrink-0"
          >
            <Sparkles className="h-4 w-4" />
            New Video
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatsCard icon={PlaySquare} title="Total Videos" value={0} />
        <StatsCard icon={Zap} title="Credits Left" value={3} subtitle="of 5 total" />
        <StatsCard icon={Calendar} title="This Month" value={0} subtitle="videos generated" />
      </div>

      {/* Recent Videos */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-4">Recent Videos</h3>
        <div className="rounded-xl border border-[#222222] bg-[#161616] p-12 flex flex-col items-center justify-center text-center">
          <div className="size-14 rounded-full bg-white/[0.04] flex items-center justify-center mb-4 border border-[#222222]">
            <Video className="h-6 w-6 text-gray-600" />
          </div>
          <h4 className="text-sm font-medium text-gray-300 mb-1">No videos yet</h4>
          <p className="text-xs text-gray-600 mb-5 max-w-xs">
            Create your first one to see it here.
          </p>
          <Link
            href="/dashboard/new"
            className="inline-flex items-center gap-2 rounded-lg border border-[#222222] bg-white/[0.03] px-4 py-2 text-xs font-medium text-gray-300 transition-all hover:bg-white/[0.06] hover:border-[#333333] hover:text-white"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Create video
          </Link>
        </div>
      </div>
    </div>
  );
}
