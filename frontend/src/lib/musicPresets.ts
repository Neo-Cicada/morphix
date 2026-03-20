export interface MusicPreset {
  id: string;
  label: string;
  description: string;
  prompt: string;
  emoji: string;
}

export const MUSIC_PRESETS: MusicPreset[] = [
  {
    id: 'saas',
    label: 'SaaS / Tech',
    description: 'Modern, digital, product-demo ready',
    emoji: '⚡',
    prompt:
      'Upbeat modern electronic background music with a clean digital feel. Subtle synth pads, light percussion, and a forward-moving groove. Perfect for SaaS product demos and tech presentations. Instrumental only.',
  },
  {
    id: 'business',
    label: 'Business',
    description: 'Professional, inspiring, boardroom-ready',
    emoji: '💼',
    prompt:
      'Professional corporate background music. Inspiring piano melody with soft strings and a steady rhythm. Motivational and polished, suitable for business presentations and pitch decks. Instrumental only.',
  },
  {
    id: 'startup',
    label: 'Startup / Venture',
    description: 'Optimistic, bold, investor-pitch energy',
    emoji: '🚀',
    prompt:
      'Optimistic and energetic startup background music. Building momentum with light acoustic guitar, modern synths, and a hopeful melody. Ideal for investor pitches and startup demos. Instrumental only.',
  },
  {
    id: 'cinematic',
    label: 'Cinematic',
    description: 'Epic, dramatic, storytelling atmosphere',
    emoji: '🎬',
    prompt:
      'Epic cinematic orchestral music. Dramatic strings, brass accents, and a sweeping melody that builds tension and emotion. Perfect for product reveals and brand storytelling. Instrumental only.',
  },
  {
    id: 'energetic',
    label: 'Energetic',
    description: 'High-energy, exciting, launch-ready',
    emoji: '🔥',
    prompt:
      'High-energy upbeat music with driving electronic drums, punchy bass, and an exciting synth lead. Great for product launches, highlight reels, and dynamic promotional content. Instrumental only.',
  },
  {
    id: 'ambient',
    label: 'Ambient / Minimal',
    description: 'Calm, focused, subtle background',
    emoji: '🌊',
    prompt:
      'Calm ambient background music with soft pads, gentle arpeggios, and minimal percussion. Creates a focused, thoughtful atmosphere. Perfect for explainer videos and subtle background scoring. Instrumental only.',
  },
  {
    id: 'luxury',
    label: 'Luxury / Premium',
    description: 'Elegant, sophisticated, high-end feel',
    emoji: '✨',
    prompt:
      'Elegant and sophisticated background music with a grand piano, soft strings, and subtle jazz influences. Premium and refined, suitable for luxury brands and high-end product presentations. Instrumental only.',
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'Write your own music prompt',
    emoji: '🎵',
    prompt: '',
  },
];
