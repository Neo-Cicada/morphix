import { createClient } from '@/utils/supabase/server';
import { NextRequest } from 'next/server';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_BASE = 'https://api.elevenlabs.io/v1';

function missingKey() {
  return Response.json({ error: 'ElevenLabs API key not configured' }, { status: 503 });
}

async function elevenLabsError(res: Response) {
  const text = await res.text();
  let message = text;
  try {
    const json = JSON.parse(text);
    message = json?.detail?.message ?? json?.message ?? json?.error ?? text;
  } catch {
    // plain text — use as-is
  }
  // Map auth failures to 503 so the client treats them as a config problem
  const status = res.status === 401 || res.status === 403 ? 503 : res.status;
  return Response.json({ error: message }, { status });
}

async function requireSession() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// GET /api/voice — list available voices
export async function GET() {
  const session = await requireSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  if (!ELEVENLABS_API_KEY) return missingKey();

  const res = await fetch(`${ELEVENLABS_BASE}/voices`, {
    headers: { 'xi-api-key': ELEVENLABS_API_KEY },
    next: { revalidate: 300 }, // cache for 5 min
  });

  if (!res.ok) {
    return elevenLabsError(res);
  }

  const data = await res.json();

  // Return simplified voice list
  const voices = (data.voices as Array<{
    voice_id: string;
    name: string;
    labels?: Record<string, string>;
    preview_url?: string;
  }>).map((v) => ({
    id: v.voice_id,
    name: v.name,
    accent: v.labels?.accent,
    description: v.labels?.description,
    age: v.labels?.age,
    gender: v.labels?.gender,
    useCase: v.labels?.use_case,
    previewUrl: v.preview_url,
  }));

  return Response.json({ voices });
}

// POST /api/voice — generate TTS audio
export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  if (!ELEVENLABS_API_KEY) return missingKey();

  const { text, voiceId, modelId = 'eleven_turbo_v2_5' } = await req.json();

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return Response.json({ error: 'text is required' }, { status: 400 });
  }
  if (!voiceId || typeof voiceId !== 'string') {
    return Response.json({ error: 'voiceId is required' }, { status: 400 });
  }
  if (text.length > 5000) {
    return Response.json({ error: 'text exceeds 5000 character limit' }, { status: 400 });
  }

  const res = await fetch(`${ELEVENLABS_BASE}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text: text.trim(),
      model_id: modelId,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!res.ok) {
    return elevenLabsError(res);
  }

  const audioBuffer = await res.arrayBuffer();

  return new Response(audioBuffer, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'no-store',
    },
  });
}
