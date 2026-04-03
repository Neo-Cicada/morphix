'use client';

import { VideoFormData } from '@/types/video';
import { MUSIC_PRESETS } from '@/lib/musicPresets';
import { Zap, PlayCircle, Film, Sparkles, AlertCircle, Loader2, Music, Mic, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { api } from '@/lib/api';
import { createCodeThumbnail, createScreenshotThumbnail } from '@/lib/thumbnail';
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
    reader.onload = () => { resolve((reader.result as string).split(',')[1]); };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getScenePlan(durationSec: number, formData: VideoFormData): string {
  const { appName, primaryBenefit, features, ctaGoal } = formData;
  const benefit = primaryBenefit || appName;
  const featureList = features.trim() ? features.split(/[,\n]/).map((f) => f.trim()).filter(Boolean) : [];
  const f1 = featureList[0] ?? 'core feature';
  const f2 = featureList[1] ?? 'key benefit';
  const f3 = featureList[2] ?? 'workflow integration';

  if (durationSec <= 30) {
    return `**Scene 1 — Hook (0–6s, frames 0–180)**
- Open with "${appName}" name reveal, hero message: "${benefit}"
- Bold typography, product logo if available

**Scene 2 — Demo (6–22s, frames 180–660)**
- Show ${f1} in action with UI callouts
- Highlight ${f2} with animated annotations
- Keep energy high, text minimal

**Scene 3 — CTA (22–30s, frames 660–900)**
- Brand sign-off with product name large
- End card: "${ctaGoal}"`;
  }

  if (durationSec <= 60) {
    return `**Scene 1 — Hook (0–8s, frames 0–240)**
- Product name reveal, tagline, hook question for target audience
- Establish visual identity immediately

**Scene 2 — Problem (8–16s, frames 240–480)**
- Animate the pain point relevant to "${formData.audience.join(' / ')}"
- Build empathy before showing solution

**Scene 3 — Solution / Demo (16–40s, frames 480–1200)**
- Show ${f1} in action
- Highlight ${f2} with UI callouts
- Reinforce: "${benefit}"

**Scene 4 — Social Proof (40–48s, frames 1200–1440)**
- Numbers, logos, or stats callout
- Visual credibility beat

**Scene 5 — CTA (48–60s, frames 1440–1800)**
- Full brand close, product name prominent
- End card: "${ctaGoal}"`;
  }

  // 90s
  return `**Scene 1 — Hook (0–10s, frames 0–300)**
- "${appName}" reveal, hero message: "${benefit}"
- Establish visual identity and tone

**Scene 2 — Problem (10–20s, frames 300–600)**
- Animate pain point for "${formData.audience.join(' / ')}"
- Build tension before the solution reveal

**Scene 3 — Feature 1 (20–35s, frames 600–1050)**
- Deep dive: ${f1}
- UI walkthrough with animated callouts

**Scene 4 — Feature 2 (35–50s, frames 1050–1500)**
- Deep dive: ${f2}
- Show the workflow transformation

**Scene 5 — Feature 3 (50–65s, frames 1500–1950)**
- Showcase: ${f3}
- Reinforce the hero benefit: "${benefit}"

**Scene 6 — CTA / Wrap (65–90s, frames 1950–2700)**
- Social proof beat (numbers/logos)
- Full brand close, product name large
- End card: "${ctaGoal}"`;
}

function getVisualLanguage(formData: VideoFormData): string {
  const { tone, colorStyle, industry } = formData;

  // Base palette from tone × colorStyle
  let palette = '';
  if (tone === 'Clean & Premium' && colorStyle === 'Dark & Sleek') {
    palette = 'Dark charcoal background (#0d0d0d–#1a1a1a), white typography, subtle glassmorphism panels, cool neutral accents';
  } else if (tone === 'Clean & Premium' && colorStyle === 'Light & Clean') {
    palette = 'Off-white background (#f8f7f4), dark charcoal text, clean sans-serif, generous whitespace, minimal shadows';
  } else if (tone === 'Energetic & Bold' && colorStyle === 'Vibrant & Colorful') {
    palette = 'Bold saturated gradients, kinetic motion, high contrast colors, fast-cut visual rhythm';
  } else if (tone === 'Energetic & Bold' && colorStyle === 'Dark & Sleek') {
    palette = 'Deep dark background with electric neon accent pops, fast motion, bold weight typography';
  } else if (tone === 'Friendly & Approachable' && colorStyle === 'Light & Clean') {
    palette = 'Warm off-white (#fafaf8), rounded elements, soft drop shadows, playful but professional typography';
  } else if (tone === 'Friendly & Approachable' && colorStyle === 'Vibrant & Colorful') {
    palette = 'Warm pastels with bright accent pops, rounded shapes, soft gradients, inviting visual language';
  } else {
    palette = `${colorStyle} aesthetic with ${tone.toLowerCase()} energy`;
  }

  // Industry accent
  const accentMap: Record<string, string> = {
    'Developer Tools': 'Accent: green/cyan (#00d4aa / #06b6d4), monospace code font for UI elements',
    'Fintech': 'Accent: electric blue / emerald (#3b82f6 / #10b981), trust-building visual weight',
    'Health / Medical': 'Accent: soft teal / mint (#14b8a6 / #a7f3d0), clean clinical feel',
    'Creative / Design': 'Accent: purple → pink → orange gradient (#8b5cf6 → #ec4899 → #f97316)',
    'E-commerce': 'Accent: warm brand-dependent tones, product-forward composition',
    'SaaS / B2B': 'Accent: warm amber (#C17B4F / #f59e0b), professional authority',
    'Education': 'Accent: indigo / sky blue (#6366f1 / #0ea5e9), approachable and focused',
    'Other': 'Accent: brand-derived colors from screenshots if available',
  };
  const accent = accentMap[industry] ?? 'Accent: derive from provided screenshots or brand materials';

  // Motion style from tone
  let motion = '';
  if (tone === 'Energetic & Bold') {
    motion = 'Fast cuts (1–3s per beat), kinetic typography, scale/rotate transitions, high frame energy';
  } else if (tone === 'Clean & Premium') {
    motion = 'Smooth cubic easing, generous whitespace, fade-and-slide transitions, deliberate pacing';
  } else {
    motion = 'Bouncy spring motion (stiffness ~80, damping ~12), warm transitions, playful entry animations';
  }

  return `- Palette: ${palette}
- ${accent}
- Motion: ${motion}
- Typography: strong hierarchy — hero headline large (80–120px), subtext 24–32px, labels 14–16px`;
}

function getNarrativeGuidance(formData: VideoFormData): string {
  const { audience, ctaGoal, platform, videoLength } = formData;
  const audienceStr = audience.join(', ');

  // Audience × CTA → narrative focus
  let narrativeFocus = '';
  if (audience.includes('Developers')) {
    narrativeFocus = 'Lead with code/API demos; technical specifics earn credibility; show the "aha" moment fast';
  } else if (audience.includes('Enterprise Teams')) {
    narrativeFocus = 'ROI framing; security and scale callouts; professional pacing; avoid hype language';
  } else if (audience.includes('Consumers')) {
    narrativeFocus = 'Desire/lifestyle framing; emotion over features; FOMO close; aspirational visuals';
  } else if (audience.includes('Startups')) {
    narrativeFocus = 'Speed and growth framing; founder energy; social proof via logos; bias-to-action';
  } else {
    narrativeFocus = `Speak directly to "${audienceStr}"; lead with their core problem, close with the solution`;
  }

  if (ctaGoal === 'Book a Demo') {
    narrativeFocus += '. End with urgency: "See it live" framing.';
  } else if (ctaGoal === 'Sign Up Free') {
    narrativeFocus += '. End with low-friction invite: "Start free today".';
  } else if (ctaGoal === 'Join Waitlist') {
    narrativeFocus += '. End with exclusivity/FOMO: "Get early access".';
  }

  // Platform overrides
  const platformOverrides: Record<string, string> = {
    'Twitter / X': `PLATFORM OVERRIDE (Twitter/X): Ultra-punchy — hook must land in first 2 seconds. Prefer text-heavy kinetic design. 30s max recommended. No long intros.`,
    'LinkedIn': `PLATFORM OVERRIDE (LinkedIn): Professional tone, text must be readable at 50% video size. No more than 3 features. Avoid flashy effects.`,
    'Product Hunt': `PLATFORM OVERRIDE (Product Hunt): Playful energy, show product name large throughout, end with "we're live!" energy. Celebrate the launch.`,
    'YouTube Ads': `PLATFORM OVERRIDE (YouTube Ads): 5-second hook MUST land before skip button. Direct address language ("You've been wasting time on..."). Value prop in first 5s.`,
    'App Store': `PLATFORM OVERRIDE (App Store): Feature the UI prominently. Vertical composition preferred. Show the core loop quickly.`,
    'Landing Page': `PLATFORM NOTE (Landing Page): Can be more deliberate — viewers chose to watch. Full story arc works well. ${videoLength}s is appropriate.`,
  };
  const override = platformOverrides[platform] ?? '';

  return `- Audience: ${audienceStr}
- Narrative focus: ${narrativeFocus}
${override ? `- ${override}` : ''}`.trim();
}

function buildPrompt(formData: VideoFormData): string {
  const durationFrames = formData.videoLength * 30;
  const musicPreset = MUSIC_PRESETS.find((p) => p.id === formData.musicPresetId);
  const musicLabel = musicPreset?.label ?? formData.musicVibe;

  const scenePlan = getScenePlan(formData.videoLength, formData);
  const visualLanguage = getVisualLanguage(formData);
  const narrativeGuidance = getNarrativeGuidance(formData);

  const lines: string[] = [
    `## CREATIVE BRIEF: ${formData.appName} — ${formData.videoLength}s Video`,
    ``,
    `### Product`,
    `- Name: ${formData.appName}`,
    `- Description: ${formData.description}`,
    `- Primary benefit (hero message): ${formData.primaryBenefit || formData.description}`,
    `- Industry: ${formData.industry || 'Not specified'}`,
    `- Key features: ${formData.features.trim() || 'Derive from screenshots/description'}`,
    ``,
    `### Target & Platform`,
    `- Audience: ${formData.audience.join(', ')}`,
    `- Platform: ${formData.platform || 'Not specified'}`,
    `- CTA: ${formData.ctaGoal}`,
    ``,
    `### Visual Identity`,
    visualLanguage,
    ``,
    `### Narrative Direction`,
    narrativeGuidance,
    ``,
    `### Scene-by-Scene Blueprint`,
    scenePlan,
    ``,
    `### Technical Requirements`,
    `- DURATION_IN_FRAMES = ${durationFrames}`,
    `- Resolution: 1920×1080`,
    `- Show "${formData.appName}" prominently in opening`,
    `- End with CTA: "${formData.ctaGoal}"`,
    `- Music vibe: ${musicLabel}`,
  ];

  if (formData.screenshots.length > 0 || formData.websiteUrl) {
    lines.push(``, `### Reference Materials`);
    if (formData.screenshots.length > 0) {
      lines.push(`- ${formData.screenshots.length} screenshot(s) attached — extract colors, UI style, and branding`);
    }
    if (formData.websiteUrl) {
      lines.push(`- Website: ${formData.websiteUrl}`);
    }
  }

  return lines.join('\n');
}

function ToggleSwitch({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        enabled ? 'bg-[#C17B4F]' : 'bg-[#333333]'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
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

  const handleGenerate = async () => {
    setError('');
    setPhase('generating');
    setStreamedLines(0);

    try {
      let frameImages: string[] = [];
      let thumbnail: string | undefined;
      if (formData.screenshots.length > 0) {
        [frameImages, thumbnail] = await Promise.all([
          Promise.all(formData.screenshots.map(fileToBase64)),
          createScreenshotThumbnail(formData.screenshots[0]),
        ]);
      }

      const prompt = buildPrompt(formData);

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

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let code = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        code += chunk;
        setStreamedLines(code.split('\n').length);
      }

      if (!code.trim()) {
        throw new Error('No animation code was generated');
      }

      if (!thumbnail) {
        const generated = createCodeThumbnail(code, formData.appName);
        if (generated) thumbnail = generated;
      }

      // Build voice/music state to pre-populate editor
      const musicPreset = MUSIC_PRESETS.find((p) => p.id === formData.musicPresetId);
      const voiceState = formData.voiceEnabled
        ? { enabled: true, selectedVoiceId: '', script: formData.voiceScript, audioUrl: null, audioDurationSeconds: null }
        : undefined;
      const musicState = formData.musicEnabled
        ? {
            enabled: true,
            selectedPresetId: formData.musicPresetId,
            customPrompt: formData.musicPresetId === 'custom' ? formData.musicCustomPrompt : (musicPreset?.prompt ?? ''),
            audioUrl: null,
            volume: 0.4,
          }
        : undefined;

      setPhase('saving');
      const draft = await api.post<{ id: string }>('/videos/draft', {
        title: formData.appName,
        animation_code: code,
        production_doc: {
          tone: formData.tone,
          music_vibe: formData.musicVibe,
          video_length: formData.videoLength,
          ...(thumbnail ? { thumbnail } : {}),
          ...(voiceState ? { voiceState } : {}),
          ...(musicState ? { musicState } : {}),
        },
      });

      router.push(`/dashboard/editor?videoId=${draft.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setPhase('idle');
    }
  };

  if (phase === 'generating' || phase === 'saving') {
    return (
      <div className="morphix-card rounded-2xl border border-[#222222] bg-[#161616] flex flex-col w-full">
        <div className="flex flex-col items-center justify-center py-24 px-8 text-center space-y-6">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-2 border-[#C17B4F]/30 flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-[#C17B4F]" />
            </div>
            <Loader2 className="absolute inset-0 m-auto h-16 w-16 animate-spin text-[#C17B4F]/20" />
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
            <div className="bg-[#0a0a0a] border border-[#222222] rounded-xl px-5 py-3 font-mono text-xs text-[#C17B4F] tabular-nums">
              {streamedLines} lines generated…
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="morphix-card rounded-2xl border border-[#222222] bg-[#161616] flex flex-col w-full relative">
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
                      ? 'border-[#C17B4F] bg-[#0d1829]'
                      : 'border-[#222222] bg-[#161616] hover:border-[#444444]'
                  }`}
                  style={isSelected ? { boxShadow: '0 0 20px rgba(193, 123, 79, 0.15), inset 0 0 15px rgba(193, 123, 79, 0.05)' } : undefined}
                >
                  {opt.badge && (
                    <span className="absolute -top-3 right-4 text-white text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full" style={{ background: '#C17B4F' }}>
                      {opt.badge}
                    </span>
                  )}
                  {isSelected && (
                    <div className="absolute top-3 right-3 h-5 w-5 rounded-full flex flex-col items-center justify-center" style={{ background: '#C17B4F' }}>
                      <div className="w-1.5 h-2.5 border-b-2 border-r-2 border-white transform rotate-45 -translate-y-[2px]" />
                    </div>
                  )}
                  <Icon className={`h-8 w-8 mb-4 ${isSelected ? 'text-[#C17B4F]' : 'text-gray-400'}`} />
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
                      ? 'border-[#C17B4F] bg-[#0d1829]'
                      : 'border-[#222222] bg-[#161616] hover:border-[#444444]'
                  }`}
                  style={isSelected ? { boxShadow: '0 0 20px rgba(193, 123, 79, 0.15), inset 0 0 15px rgba(193, 123, 79, 0.05)' } : undefined}
                >
                  <div className="text-3xl mb-3">{opt.emoji}</div>
                  <h4 className="text-white font-medium mb-1">{opt.value}</h4>
                  <p className="text-sm text-[#666666] leading-snug">{opt.subtitle}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 3 - Background Music */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="h-5 w-5 text-[#C17B4F]" />
              <h3 className="text-lg font-semibold gradient-text">Background Music</h3>
            </div>
            <ToggleSwitch
              enabled={formData.musicEnabled}
              onToggle={() => onChange('musicEnabled', !formData.musicEnabled)}
            />
          </div>

          {formData.musicEnabled && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {MUSIC_PRESETS.map((preset) => {
                  const isSelected = formData.musicPresetId === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => onChange('musicPresetId', preset.id)}
                      className={`relative p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#C17B4F] bg-[#0d1829]'
                          : 'border-[#222222] bg-[#111111] hover:border-[#444444]'
                      }`}
                      style={isSelected ? { boxShadow: '0 0 16px rgba(193, 123, 79, 0.12)' } : undefined}
                    >
                      <div className="text-2xl mb-2">{preset.emoji}</div>
                      <h4 className="text-white text-sm font-medium leading-tight mb-1">{preset.label}</h4>
                      <p className="text-[10px] text-[#666666] leading-snug">{preset.description}</p>
                    </div>
                  );
                })}
              </div>

              {formData.musicPresetId === 'custom' && (
                <div className="space-y-2">
                  <label className="text-xs text-[#888888] font-medium uppercase tracking-wider">Music prompt</label>
                  <textarea
                    value={formData.musicCustomPrompt}
                    onChange={(e) => onChange('musicCustomPrompt', e.target.value)}
                    placeholder="Describe the music you want, e.g. 'Chill lo-fi hip-hop with jazzy chords and soft drums…'"
                    maxLength={1000}
                    rows={3}
                    className="w-full bg-[#111111] border border-[#333333] rounded-xl px-4 py-3 text-sm text-white placeholder-[#555555] focus:outline-none focus:border-[#C17B4F]/60 resize-none"
                  />
                  <p className="text-right text-[10px] text-[#555555]">{formData.musicCustomPrompt.length}/1000</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SECTION 4 - Voice Narration */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-[#C17B4F]" />
              <h3 className="text-lg font-semibold gradient-text">Voice Narration</h3>
            </div>
            <ToggleSwitch
              enabled={formData.voiceEnabled}
              onToggle={() => onChange('voiceEnabled', !formData.voiceEnabled)}
            />
          </div>

          {formData.voiceEnabled && (
            <div className="space-y-3">
              <div className="bg-[#111111] border border-[#222222] rounded-xl px-4 py-3 flex items-center gap-2">
                <ChevronDown className="h-4 w-4 text-[#555555] shrink-0" />
                <span className="text-sm text-[#888888]">Voice will be selected in the editor</span>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-[#888888] font-medium uppercase tracking-wider">
                  Narration script <span className="text-[#555555] normal-case">(optional — AI can write it for you in the editor)</span>
                </label>
                <textarea
                  value={formData.voiceScript}
                  onChange={(e) => onChange('voiceScript', e.target.value)}
                  placeholder={`Write the narration for your ${formData.videoLength}-second video…`}
                  maxLength={5000}
                  rows={4}
                  className="w-full bg-[#111111] border border-[#333333] rounded-xl px-4 py-3 text-sm text-white placeholder-[#555555] focus:outline-none focus:border-[#C17B4F]/60 resize-none"
                />
                <p className="text-right text-[10px] text-[#555555]">{formData.voiceScript.length}/5000</p>
              </div>
            </div>
          )}
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
