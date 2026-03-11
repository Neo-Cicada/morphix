'use client';

import { VideoFormData } from '@/types/video';
import { Zap, PlayCircle, Film, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface Step3FormProps {
  formData: VideoFormData;
  onChange: (field: keyof VideoFormData, value: any) => void;
  onBack: () => void;
}

type GenerationPhase = 'idle' | 'generating' | 'saving';

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix, keep only base64
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function buildPrompt(formData: VideoFormData): string {
  const durationFrames = formData.videoLength * 30;
  const lines = [
    `Create a ${formData.videoLength}-second product demo video animation for "${formData.appName}".`,
    ``,
    `Product: ${formData.description}`,
    `Target audience: ${formData.audience.join(', ')}`,
    `Call to action: ${formData.ctaGoal}`,
  ];

  if (formData.features.trim()) {
    lines.push(`Key features to highlight: ${formData.features}`);
  }

  lines.push(
    ``,
    `Style: ${formData.tone}`,
    `Music vibe: ${formData.musicVibe}`,
    ``,
    `Technical requirements:`,
    `- Duration: exactly ${durationFrames} frames (set DURATION_IN_FRAMES = ${durationFrames})`,
    `- Resolution: 1920x1080`,
    `- Show the product name "${formData.appName}" prominently`,
    `- End with the call-to-action: "${formData.ctaGoal}"`,
    `- Make it feel cinematic and polished`,
  );

  if (formData.screenshots.length > 0) {
    lines.push(`- I've attached ${formData.screenshots.length} screenshot(s) of the product — use them as visual reference for colors, UI style, and branding`);
  }

  if (formData.websiteUrl) {
    lines.push(`- Website: ${formData.websiteUrl}`);
  }

  return lines.join('\n');
}

export function Step3Form({ formData, onChange, onBack }: Step3FormProps) {
  const [phase, setPhase] = useState<GenerationPhase>('idle');
  const [streamedLines, setStreamedLines] = useState(0);
  const [error, setError] = useState('');
  const router = useRouter();

  const loading = phase !== 'idle';

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
    setError('');
    setPhase('generating');
    setStreamedLines(0);

    try {
      // Convert screenshots to base64 if any
      let frameImages: string[] = [];
      if (formData.screenshots.length > 0) {
        frameImages = await Promise.all(formData.screenshots.map(fileToBase64));
      }

      const prompt = buildPrompt(formData);

      // Stream animation code from /api/generate
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          frameImages: frameImages.length > 0 ? frameImages : undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `Generation failed (${res.status})`);
      }

      // Collect streamed response
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let code = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        code += chunk;
        // Count newlines to show progress
        setStreamedLines(code.split('\n').length);
      }

      if (!code.trim()) {
        throw new Error('No animation code was generated');
      }

      // Save as draft
      setPhase('saving');
      const draft = await api.post<{ id: string }>('/videos/draft', {
        title: formData.appName,
        animation_code: code,
        production_doc: {
          tone: formData.tone,
          music_vibe: formData.musicVibe,
          video_length: formData.videoLength,
        },
      });

      router.push(`/dashboard/editor?videoId=${draft.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setPhase('idle');
    }
  };

  // Generation overlay
  if (phase === 'generating' || phase === 'saving') {
    return (
      <div className="morphix-card rounded-2xl border border-[#222222] bg-[#161616] flex flex-col w-full">
        <div className="flex flex-col items-center justify-center py-24 px-8 text-center space-y-6">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-2 border-[#3b82f6]/30 flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-[#3b82f6]" />
            </div>
            <Loader2 className="absolute inset-0 m-auto h-16 w-16 animate-spin text-[#3b82f6]/20" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white">
              {phase === 'saving' ? 'Saving your animation…' : 'Generating your animation…'}
            </h2>
            <p className="text-[#666666] text-sm max-w-sm">
              {phase === 'saving'
                ? 'Almost there, saving your video.'
                : `Claude is crafting a ${formData.videoLength}s "${formData.tone}" animation for ${formData.appName}.`}
            </p>
          </div>

          {phase === 'generating' && streamedLines > 0 && (
            <div className="bg-[#0a0a0a] border border-[#222222] rounded-xl px-5 py-3 font-mono text-xs text-[#3b82f6] tabular-nums">
              {streamedLines} lines generated…
            </div>
          )}
        </div>
      </div>
    );
  }

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
          disabled={loading}
          className="text-[#888888] hover:text-white px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
          Generate Video
        </button>
      </div>
    </div>
  );
}
