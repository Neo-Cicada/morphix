'use client';

import { useEffect, useState } from 'react';
import { Sparkles, PlaySquare, Zap, Calendar } from 'lucide-react';
import Link from 'next/link';
import { StatsCard } from './StatsCard';
import { VideoCard } from './VideoCard';
import { useUser } from '@/contexts/UserContext';
import { api } from '@/lib/api';

interface Stats {
    total_videos: number;
    this_month: number;
    credit_balance: number;
}

interface VideoSummary {
    id: string;
    app_name: string;
    status: 'pending' | 'processing' | 'done' | 'failed';
    created_at: string;
}

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}

export function DashboardHome() {
    const { user } = useUser();
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentVideos, setRecentVideos] = useState<VideoSummary[]>([]);

    useEffect(() => {
        api.get<Stats>('/videos/stats').then(setStats).catch(() => {});
        api.get<VideoSummary[]>('/videos').then((v) => setRecentVideos(v.slice(0, 3))).catch(() => {});
    }, []);

    const displayName = user?.full_name || user?.email?.split('@')[0] || 'there';

    return (
        <div className="px-6 py-10 lg:px-8">
            {/* Welcome Header */}
            <div className="mb-10">
                <span className="text-xs font-semibold uppercase tracking-widest text-[#3b82f6] block mb-2">
                    {getGreeting()}
                </span>
                <h1 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
                    Welcome back, {displayName}
                </h1>
                <p className="text-[#888888] mt-1.5 text-sm">
                    Your studio is ready. Let&apos;s make something cinematic.
                </p>
            </div>

            {/* Hero CTA */}
            <div
                className="relative rounded-2xl p-7 sm:p-9 mb-10 overflow-hidden cursor-pointer group hero-shimmer morphix-card"
                style={{ background: '#0A0A10', border: '1px solid #111122' }}
            >
                <div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse 80% 60% at 70% -10%, rgba(59,130,246,0.1) 0%, rgba(0,243,255,0.05) 40%, transparent 70%)' }}
                />
                <div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{
                        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)',
                        backgroundSize: '28px 28px',
                    }}
                />
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="size-1.5 rounded-full bg-[#3b82f6] block" />
                            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">AI Video Studio</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2 leading-tight">
                            Transform screenshots into{' '}
                            <span className="neon-text-cyan">
                                cinematic marketing videos.
                            </span>
                        </h2>
                        <p className="text-sm text-[#666666] max-w-sm">
                            Upload your screenshots. Describe your vision. Walk away with a video that makes investors stop scrolling.
                        </p>
                    </div>
                    <Link
                        href="/dashboard/new"
                        className="btn-gradient inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shrink-0 cursor-pointer"
                    >
                        <Sparkles className="h-4 w-4" />
                        Create New Video
                    </Link>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                <StatsCard icon={PlaySquare} title="Total Videos" value={stats?.total_videos ?? 0} color="blue" />
                <StatsCard icon={Zap} title="Credits Left" value={stats?.credit_balance ?? 0} color="purple" />
                <StatsCard icon={Calendar} title="This Month" value={stats?.this_month ?? 0} subtitle="videos generated" color="green" />
            </div>

            {/* Recent Videos */}
            <div>
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-[#555555] block mb-1">Library</span>
                        <h3 className="text-base font-bold tracking-tight text-white">Recent Videos</h3>
                    </div>
                    <Link
                        href="/dashboard/videos"
                        className="text-xs font-medium text-[#3b82f6] hover:text-[#60a5fa] transition-colors cursor-pointer flex items-center gap-1"
                    >
                        View all →
                    </Link>
                </div>

                {recentVideos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recentVideos.map((v) => (
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
                        className="rounded-2xl p-10 flex flex-col items-center justify-center text-center"
                        style={{ background: '#0A0A10', border: '1px solid #111122' }}
                    >
                        <div
                            className="size-12 rounded-xl flex items-center justify-center mb-4"
                            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}
                        >
                            <PlaySquare className="h-5 w-5 text-[#3b82f6]" />
                        </div>
                        <p className="text-sm font-semibold text-white mb-1">No videos yet</p>
                        <p className="text-xs text-[#555555] mb-5 max-w-xs">
                            Your cinematic renders will appear here once you&apos;ve created your first video.
                        </p>
                        <Link
                            href="/dashboard/new"
                            className="inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-semibold text-white transition-all duration-200 cursor-pointer btn-gradient"
                        >
                            <Sparkles className="h-3 w-3" />
                            Create your first video
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
