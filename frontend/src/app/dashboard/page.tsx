import { Sparkles, Zap, Calendar, PlaySquare, PlusCircle, Play } from 'lucide-react';
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
        <h1 className="page-title text-white">
          {getGreeting()}, Neo
        </h1>
        <p className="text-sm text-[#666666] mt-1">Here&apos;s your dashboard overview.</p>
      </div>

      {/* Hero CTA Card */}
      <div 
        className="hero-shimmer morphix-card relative rounded-xl p-6 sm:p-8 mb-8 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0d1829 0%, #1a0a2e 100%)',
          border: '1px solid #2a3a5c',
        }}
      >
        {/* Subtle gradient glow */}
        <div className="absolute top-0 right-0 w-[300px] h-[200px] bg-purple-500/[0.08] blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[200px] h-[150px] bg-blue-500/[0.06] blur-[60px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">Create your first video</h2>
            <p className="text-sm text-gray-400 max-w-md">
              Transform your product screenshots into cinematic marketing videos with AI.
            </p>
          </div>
          <Link
            href="/dashboard/new"
            className="btn-gradient inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white shrink-0"
          >
            <Sparkles className="h-4 w-4" />
            New Video
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatsCard icon={PlaySquare} title="Total Videos" value={0} color="blue" />
        <StatsCard icon={Zap} title="Credits Left" value={3} subtitle="of 5 total" color="purple" />
        <StatsCard icon={Calendar} title="This Month" value={0} subtitle="videos generated" color="green" />
      </div>

      {/* Recent Videos */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-4">Recent Videos</h3>
        <div className="morphix-card rounded-xl border border-[#222222] bg-[#161616] p-8 sm:p-12 flex flex-col items-center justify-center text-center">
          <div className="relative z-10 flex flex-col items-center">
            {/* Mock Video Thumbnail */}
            <div className="relative w-full max-w-md aspect-video rounded-xl overflow-hidden mb-6" style={{ background: 'linear-gradient(135deg, #0d1829 0%, #1a0a2e 100%)' }}>
              {/* Glow effect */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute w-[200px] h-[200px] bg-blue-500/20 blur-[60px] rounded-full" />
                <div className="absolute w-[150px] h-[150px] bg-purple-500/15 blur-[50px] rounded-full translate-x-8" />
              </div>
              {/* Grid lines on thumbnail */}
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              {/* Play button */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="play-button-pulse size-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                  <Play className="h-7 w-7 text-white ml-1" fill="white" />
                </div>
              </div>
              {/* Bottom bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-transparent" />
            </div>

            <h4 className="text-base font-semibold text-white mb-1.5">Your first cinematic video is one click away</h4>
            <p className="text-sm text-[#666666] mb-6 max-w-sm">
              Upload screenshots. We handle the rest.
            </p>
            <Link
              href="/dashboard/new"
              className="btn-gradient inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
            >
              <PlusCircle className="h-4 w-4" />
              Create video
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
