'use client';

import { VideoFormData } from '@/types/video';
import { Zap, PlayCircle, Film, Sparkles, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface Step3FormProps {
  formData: VideoFormData;
  onChange: (field: keyof VideoFormData, value: any) => void;
  onBack: () => void;
}

export function Step3Form({ formData, onChange, onBack }: Step3FormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const videoLengthOptions = [
    { value: 30, title: '30 seconds', subtitle: 'Perfect for Twitter/X and ads', icon: Zap },
    { value: 60, title: '60 seconds', subtitle: 'Ideal for Product Hunt & LinkedIn', icon: PlayCircle, badge: 'Most Popular' },
    { value: 90, title: '90 seconds', subtitle: 'Best for landing pages', icon: Film },
  ];

  const toneOptions = [
    { value: 'Energetic & Bold', emoji: '🚀', subtitle: 'High energy, fast paced, makes people excited' },
    { value: 'Clean & Premium', emoji: '✨', subtitle: 'Minimal, sophisticated, builds trust' },
    { value: 'Friendly & Approachable', emoji: '😊', subtitle: 'Warm, conversational, relatable' },
  ];

  const musicOptions = [
    { value: 'Cinematic', emoji: '🎬', subtitle: 'Epic, emotional, powerful' },
    { value: 'Upbeat Tech', emoji: '⚡', subtitle: 'Modern, energetic, forward-moving' },
    { value: 'Minimal & Ambient', emoji: '🌊', subtitle: 'Calm, focused, understated' },
  ];

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/videos', {
        app_name: formData.appName,
        description: formData.description,
        audience: formData.audience,
        cta_goal: formData.ctaGoal,
        features: formData.features,
        video_length: formData.videoLength,
        tone: formData.tone,
        music_vibe: formData.musicVibe,
      });
      router.push('/dashboard/videos');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="morphix-card rounded-2xl border border-[#222222] bg-[#161616] flex flex-col w-full relative">
      {/* Error notification */}
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#1a0a0a] border border-red-500/40 text-white px-6 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
          <span className="font-semibold text-sm text-red-300">{error}</span>
        </div>
      )}

      <div className="relative z-10 p-6 sm:p-10 space-y-12">
        {/* SECTION 1 - Video Length */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold gradient-text">How long should your video be?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {videoLengthOptions.map((opt) => {
              const isSelected = formData.videoLength === opt.value;
              const Icon = opt.icon;
              return (
                <div
                  key={opt.value}
                  onClick={() => onChange('videoLength', opt.value)}
                  className={`relative p-5 rounded-xl border transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-[#3b82f6] bg-[#0d1829]' 
                      : 'border-[#222222] bg-[#161616] hover:border-[#444444]'
                  }`}
                  style={isSelected ? { boxShadow: '0 0 20px rgba(59, 130, 246, 0.15), inset 0 0 15px rgba(59, 130, 246, 0.05)' } : undefined}
                >
                  {opt.badge && (
                    <span className="absolute -top-3 right-4 text-white text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full" style={{ background: 'linear-gradient(135deg, #3b82f6, #7c3aed)' }}>
                      {opt.badge}
                    </span>
                  )}
                  {isSelected && (
                    <div className="absolute top-3 right-3 h-5 w-5 rounded-full flex flex-col items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #7c3aed)' }}>
                      <div className="w-1.5 h-2.5 border-b-2 border-r-2 border-white transform rotate-45 -translate-y-[2px]" />
                    </div>
                  )}
                  <Icon className={`h-8 w-8 mb-4 ${isSelected ? 'text-[#3b82f6]' : 'text-gray-400'}`} />
                  <h4 className="text-white font-medium mb-1">{opt.title}</h4>
                  <p className="text-sm text-[#666666] leading-snug">{opt.subtitle}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2 - Tone */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold gradient-text">What&apos;s the vibe?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {toneOptions.map((opt) => {
              const isSelected = formData.tone === opt.value;
              return (
                <div
                  key={opt.value}
                  onClick={() => onChange('tone', opt.value)}
                  className={`relative p-5 rounded-xl border transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-[#3b82f6] bg-[#0d1829]' 
                      : 'border-[#222222] bg-[#161616] hover:border-[#444444]'
                  }`}
                  style={isSelected ? { boxShadow: '0 0 20px rgba(59, 130, 246, 0.15), inset 0 0 15px rgba(59, 130, 246, 0.05)' } : undefined}
                >
                  <div className="text-3xl mb-3">{opt.emoji}</div>
                  <h4 className="text-white font-medium mb-1">{opt.value}</h4>
                  <p className="text-sm text-[#666666] leading-snug">{opt.subtitle}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 3 - Music */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold gradient-text">Background music style</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {musicOptions.map((opt) => {
              const isSelected = formData.musicVibe === opt.value;
              return (
                <div
                  key={opt.value}
                  onClick={() => onChange('musicVibe', opt.value)}
                  className={`relative p-5 rounded-xl border transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-[#3b82f6] bg-[#0d1829]' 
                      : 'border-[#222222] bg-[#161616] hover:border-[#444444]'
                  }`}
                  style={isSelected ? { boxShadow: '0 0 20px rgba(59, 130, 246, 0.15), inset 0 0 15px rgba(59, 130, 246, 0.05)' } : undefined}
                >
                  <div className="text-3xl mb-3">{opt.emoji}</div>
                  <h4 className="text-white font-medium mb-1">{opt.value}</h4>
                  <p className="text-sm text-[#666666] leading-snug">{opt.subtitle}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 p-6 sm:px-10 sm:py-6 border-t border-[#222222] flex items-center justify-between bg-white/[0.01] rounded-b-2xl">
        <button
          onClick={onBack}
          className="text-[#888888] hover:text-white px-4 py-2 text-sm font-medium transition-colors"
        >
          Back
        </button>
        <span className="text-[#666666] font-medium text-sm">Step 3 of 3</span>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="btn-gradient-pulse text-white px-8 py-3 rounded-xl font-semibold flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Sparkles className="h-5 w-5" />
          {loading ? 'Submitting…' : 'Generate Video'}
        </button>
      </div>
    </div>
  );
}
