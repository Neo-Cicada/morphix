import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

const TITLE_CARD_SCENE = {
  fps: 30,
  width: 1920,
  height: 1080,
  durationInFrames: 150,
  layers: [
    {
      id: 'layer-1',
      type: 'shape',
      label: 'Background',
      trackColor: '#3b82f6',
      from: 0,
      durationInFrames: 150,
      x: 960, y: 540,
      scale: 1, rotation: 0, opacity: 1,
      shape: 'rect',
      width: 1920, height: 1080,
      color: '#0f172a',
      blur: 0,
      keyframes: [],
    },
    {
      id: 'layer-2',
      type: 'text',
      label: 'Title',
      trackColor: '#ffffff',
      from: 15,
      durationInFrames: 120,
      x: 960, y: 540,
      scale: 1, rotation: 0, opacity: 0,
      content: 'YOUR TITLE',
      fontSize: 80,
      color: '#ffffff',
      fontWeight: 800,
      fontFamily: 'system-ui',
      letterSpacing: 8,
      keyframes: [
        { frame: 0, prop: 'opacity', value: 0 },
        { frame: 20, prop: 'opacity', value: 1 },
        { frame: 100, prop: 'opacity', value: 1 },
        { frame: 120, prop: 'opacity', value: 0 },
      ],
    },
  ],
};

const PRODUCT_SHOWCASE_SCENE = {
  fps: 30,
  width: 1920,
  height: 1080,
  durationInFrames: 240,
  layers: [
    {
      id: 'layer-1',
      type: 'shape',
      label: 'Backdrop',
      trackColor: '#a855f7',
      from: 0,
      durationInFrames: 240,
      x: 960, y: 540,
      scale: 1, rotation: 0, opacity: 1,
      shape: 'rect',
      width: 1920, height: 1080,
      color: '#09090b',
      blur: 0,
      keyframes: [],
    },
    {
      id: 'layer-2',
      type: 'shape',
      label: 'Glow',
      trackColor: '#a855f7',
      from: 0,
      durationInFrames: 240,
      x: 960, y: 540,
      scale: 1, rotation: 0, opacity: 0,
      shape: 'circle',
      width: 900, height: 900,
      color: '#a855f7',
      blur: 80,
      keyframes: [
        { frame: 0, prop: 'opacity', value: 0 },
        { frame: 30, prop: 'opacity', value: 0.3 },
      ],
    },
    {
      id: 'layer-3',
      type: 'text',
      label: 'Product Name',
      trackColor: '#ffffff',
      from: 30,
      durationInFrames: 180,
      x: 960, y: 440,
      scale: 0, rotation: 0, opacity: 0,
      content: 'PRODUCT NAME',
      fontSize: 64,
      color: '#ffffff',
      fontWeight: 800,
      fontFamily: 'system-ui',
      letterSpacing: 6,
      keyframes: [
        { frame: 0, prop: 'scale', value: 0 },
        { frame: 25, prop: 'scale', value: 1 },
        { frame: 0, prop: 'opacity', value: 0 },
        { frame: 25, prop: 'opacity', value: 1 },
      ],
    },
    {
      id: 'layer-4',
      type: 'text',
      label: 'Tagline',
      trackColor: '#888888',
      from: 60,
      durationInFrames: 150,
      x: 960, y: 590,
      scale: 1, rotation: 0, opacity: 0,
      content: 'Your compelling tagline here',
      fontSize: 28,
      color: '#888888',
      fontWeight: 400,
      fontFamily: 'system-ui',
      letterSpacing: 2,
      keyframes: [
        { frame: 0, prop: 'opacity', value: 0 },
        { frame: 20, prop: 'opacity', value: 1 },
      ],
    },
  ],
};

async function main() {
  console.log('Seeding templates...');

  const TITLE_CARD_ID      = '00000000-0000-0000-0000-000000000001';
  const PRODUCT_SHOWCASE_ID = '00000000-0000-0000-0000-000000000002';

  await prisma.template.upsert({
    where: { id: TITLE_CARD_ID },
    update: { name: 'Title Card', scene_json: TITLE_CARD_SCENE as object },
    create: {
      id: TITLE_CARD_ID,
      name: 'Title Card',
      scene_json: TITLE_CARD_SCENE as object,
      is_preset: true,
      user_id: null,
    },
  });

  await prisma.template.upsert({
    where: { id: PRODUCT_SHOWCASE_ID },
    update: { name: 'Product Showcase', scene_json: PRODUCT_SHOWCASE_SCENE as object },
    create: {
      id: PRODUCT_SHOWCASE_ID,
      name: 'Product Showcase',
      scene_json: PRODUCT_SHOWCASE_SCENE as object,
      is_preset: true,
      user_id: null,
    },
  });

  console.log('Done. 2 presets seeded.');
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
