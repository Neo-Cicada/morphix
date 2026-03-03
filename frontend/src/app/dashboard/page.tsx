import { Video, Plus, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      {/* Header section */}
      <div className="mb-8 md:mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Welcome back, Neo</h1>
          <p className="text-sm text-gray-400">Here's what's happening with your video campaign.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard/new" 
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white shadow hover:bg-blue-600/90 h-10 py-2 px-4 shadow-[0_0_15px_rgba(59,130,246,0.5)] border border-blue-500/50"
          >
            <Sparkles className="h-4 w-4" />
            Create Video
          </Link>
        </div>
      </div>
      
      {/* Empty State / Placeholder Main Content */}
      <div className="rounded-xl border border-white/5 bg-[#111111]/50 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
        <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center mb-6 ring-1 ring-white/10 shadow-inner">
          <Video className="h-8 w-8 text-gray-500" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No videos yet</h3>
        <p className="text-gray-400 max-w-sm mb-8 text-sm leading-relaxed">
          You haven't generated any videos yet. Create your first high-converting AI video marketing campaign now.
        </p>
        <Link 
            href="/dashboard/new" 
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-white text-black hover:bg-gray-200 h-10 py-2 px-6"
          >
            <Plus className="h-4 w-4" />
            Start generating
        </Link>
      </div>
    </div>
  );
}
