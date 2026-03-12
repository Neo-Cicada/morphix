import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

const templates = [
  {
    name: 'Product Demo Showcase',
    description: 'A sleek animated product reveal with headline, tagline, and a glowing CTA button.',
    category: 'Product Demo',
    is_preset: true,
    scene_json: {},
    variables: [
      { key: 'COMPANY_NAME', label: 'Company Name', type: 'text', default: 'Acme Corp' },
      { key: 'TAGLINE', label: 'Tagline', type: 'text', default: 'The future, delivered.' },
      { key: 'PRIMARY_COLOR', label: 'Primary Color', type: 'color', default: '#C17B4F' },
      { key: 'CTA_TEXT', label: 'CTA Button Text', type: 'text', default: 'Get Started' },
    ],
    animation_code: `
const fps = 30;
const durationInFrames = 150;

function MyAnimation() {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const titleY = interpolate(frame, [0, 25], [40, 0], { extrapolateRight: 'clamp' });
  const taglineOpacity = interpolate(frame, [20, 45], [0, 1], { extrapolateRight: 'clamp' });
  const taglineY = interpolate(frame, [20, 45], [30, 0], { extrapolateRight: 'clamp' });
  const ctaOpacity = interpolate(frame, [50, 75], [0, 1], { extrapolateRight: 'clamp' });
  const ctaScale = spring({ frame: frame - 50, fps, config: { damping: 14, stiffness: 180 } });
  const bgGlow = interpolate(frame, [0, 60, 150], [0, 0.18, 0.12], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: '#0d0d0c', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Background glow */}
      <div style={{ position: 'absolute', inset: 0, background: \`radial-gradient(ellipse 60% 40% at 50% 50%, {{PRIMARY_COLOR}}\${Math.round(bgGlow * 255).toString(16).padStart(2,'0')}, transparent)\`, pointerEvents: 'none' }} />

      {/* Grid dots */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />

      {/* Company name */}
      <div style={{ opacity: titleOpacity, transform: \`translateY(\${titleY}px)\`, textAlign: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 56, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1 }}>
          {{COMPANY_NAME}}
        </span>
      </div>

      {/* Tagline */}
      <div style={{ opacity: taglineOpacity, transform: \`translateY(\${taglineY}px)\`, textAlign: 'center', marginBottom: 48 }}>
        <span style={{ fontSize: 22, fontWeight: 400, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.01em' }}>
          {{TAGLINE}}
        </span>
      </div>

      {/* CTA */}
      <div style={{ opacity: ctaOpacity, transform: \`scale(\${ctaScale})\` }}>
        <div style={{ background: '{{PRIMARY_COLOR}}', color: '#fff', fontSize: 16, fontWeight: 700, padding: '14px 36px', borderRadius: 50, letterSpacing: '0.02em', boxShadow: \`0 0 40px {{PRIMARY_COLOR}}55\` }}>
          {{CTA_TEXT}}
        </div>
      </div>
    </AbsoluteFill>
  );
}
`.trim(),
  },
  {
    name: 'Brand Intro',
    description: 'Bold logo-reveal animation with animated text lines and a color sweep.',
    category: 'Brand Intro',
    is_preset: true,
    scene_json: {},
    variables: [
      { key: 'COMPANY_NAME', label: 'Company Name', type: 'text', default: 'Brandly' },
      { key: 'TAGLINE', label: 'Tagline', type: 'text', default: 'Where ideas become reality.' },
      { key: 'PRIMARY_COLOR', label: 'Brand Color', type: 'color', default: '#6366f1' },
      { key: 'ACCENT_COLOR', label: 'Accent Color', type: 'color', default: '#a78bfa' },
    ],
    animation_code: `
function MyAnimation() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sweep = interpolate(frame, [0, 40], [0, 1], { extrapolateRight: 'clamp' });
  const nameScale = spring({ frame: frame - 30, fps, config: { damping: 18, stiffness: 200 } });
  const nameOpacity = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: 'clamp' });
  const taglineOpacity = interpolate(frame, [60, 85], [0, 1], { extrapolateRight: 'clamp' });
  const lineWidth = interpolate(frame, [55, 90], [0, 200], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: '#09090b', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' }}>
      {/* Sweep bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: \`\${sweep * 100}%\`, background: \`linear-gradient(135deg, {{PRIMARY_COLOR}}22, {{ACCENT_COLOR}}11)\`, pointerEvents: 'none', transition: 'none' }} />

      {/* Logo circle */}
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: \`linear-gradient(135deg, {{PRIMARY_COLOR}}, {{ACCENT_COLOR}})\`, marginBottom: 28, boxShadow: \`0 0 60px {{PRIMARY_COLOR}}66\`, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: nameOpacity, transform: \`scale(\${nameScale})\` }}>
        <span style={{ fontSize: 32, fontWeight: 900, color: '#fff' }}>
          {('{{COMPANY_NAME}}').charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Company name */}
      <div style={{ opacity: nameOpacity, transform: \`scale(\${nameScale})\`, textAlign: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 48, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em' }}>
          {{COMPANY_NAME}}
        </span>
      </div>

      {/* Divider line */}
      <div style={{ width: lineWidth, height: 2, background: \`linear-gradient(90deg, {{PRIMARY_COLOR}}, {{ACCENT_COLOR}})\`, marginBottom: 16, borderRadius: 2 }} />

      {/* Tagline */}
      <div style={{ opacity: taglineOpacity }}>
        <span style={{ fontSize: 16, fontWeight: 400, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {{TAGLINE}}
        </span>
      </div>
    </AbsoluteFill>
  );
}
`.trim(),
  },
  {
    name: 'SaaS Promo',
    description: 'Feature-highlight carousel with stats counter and a modern dark-glass aesthetic.',
    category: 'SaaS Promo',
    is_preset: true,
    scene_json: {},
    variables: [
      { key: 'COMPANY_NAME', label: 'Product Name', type: 'text', default: 'LaunchKit' },
      { key: 'TAGLINE', label: 'Value Proposition', type: 'text', default: 'Ship faster than ever.' },
      { key: 'PRIMARY_COLOR', label: 'Primary Color', type: 'color', default: '#10b981' },
      { key: 'STAT_NUMBER', label: 'Key Metric', type: 'text', default: '10x' },
      { key: 'STAT_LABEL', label: 'Metric Label', type: 'text', default: 'faster deployment' },
    ],
    animation_code: `
function MyAnimation() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const headerY = interpolate(frame, [0, 20], [-30, 0], { extrapolateRight: 'clamp' });
  const cardScale = spring({ frame: frame - 25, fps, config: { damping: 15, stiffness: 160 } });
  const cardOpacity = interpolate(frame, [25, 50], [0, 1], { extrapolateRight: 'clamp' });
  const statScale = spring({ frame: frame - 60, fps, config: { damping: 12, stiffness: 200 } });
  const taglineOpacity = interpolate(frame, [80, 105], [0, 1], { extrapolateRight: 'clamp' });
  const pulse = interpolate(frame % 60, [0, 30, 60], [1, 1.04, 1], { extrapolateRight: 'clamp' });

  const features = ['Zero config setup', 'Auto-scaling infra', 'Real-time analytics'];

  return (
    <AbsoluteFill style={{ background: '#020617', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif', gap: 0 }}>
      {/* Bg gradient */}
      <div style={{ position: 'absolute', inset: 0, background: \`radial-gradient(ellipse 70% 50% at 50% 50%, {{PRIMARY_COLOR}}18, transparent)\`, pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ opacity: headerOpacity, transform: \`translateY(\${headerY}px)\`, textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: '{{PRIMARY_COLOR}}', marginBottom: 10 }}>
          {{COMPANY_NAME}}
        </div>
        <div style={{ fontSize: 44, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
          {{TAGLINE}}
        </div>
      </div>

      {/* Feature cards */}
      <div style={{ opacity: cardOpacity, transform: \`scale(\${cardScale})\`, display: 'flex', gap: 16, marginBottom: 40 }}>
        {features.map((f, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 18px', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>
            <span style={{ color: '{{PRIMARY_COLOR}}', marginRight: 6 }}>✓</span>{f}
          </div>
        ))}
      </div>

      {/* Stat */}
      <div style={{ transform: \`scale(\${statScale}) scale(\${pulse})\`, textAlign: 'center' }}>
        <span style={{ fontSize: 72, fontWeight: 900, color: '{{PRIMARY_COLOR}}', letterSpacing: '-0.05em', lineHeight: 1 }}>
          {{STAT_NUMBER}}
        </span>
        <div style={{ opacity: taglineOpacity, fontSize: 16, fontWeight: 400, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>
          {{STAT_LABEL}}
        </div>
      </div>
    </AbsoluteFill>
  );
}
`.trim(),
  },
];

async function main() {
  console.log('Seeding marketplace templates...');
  for (const t of templates) {
    const existing = await prisma.template.findFirst({ where: { name: t.name, is_preset: true } });
    if (existing) {
      await prisma.template.update({ where: { id: existing.id }, data: t as never });
      console.log(`  Updated: ${t.name}`);
    } else {
      await prisma.template.create({ data: t as never });
      console.log(`  Created: ${t.name}`);
    }
  }
  console.log('Done.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
