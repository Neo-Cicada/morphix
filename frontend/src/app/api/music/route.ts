import { createClient } from '@/utils/supabase/server';
import { NextRequest } from 'next/server';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_BASE = 'https://api.elevenlabs.io/v1';

async function elevenLabsError(res: Response) {
  const text = await res.text();
  let message = text;
  try {
    const json = JSON.parse(text);
    message = json?.detail?.message ?? json?.message ?? json?.error ?? text;
  } catch {
    // plain text — use as-is
  }
  const status = res.status === 401 || res.status === 403 ? 503 : res.status;
  return Response.json({ error: message }, { status });
}

// POST /api/music — generate background music via ElevenLabs
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });

  if (!ELEVENLABS_API_KEY) {
    return Response.json({ error: 'ElevenLabs API key not configured' }, { status: 503 });
  }

  const { prompt, durationMs = 30000 } = await req.json();

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return Response.json({ error: 'prompt is required' }, { status: 400 });
  }

  // Clamp duration to ElevenLabs limits (3s–600s)
  const clampedMs = Math.min(Math.max(durationMs, 3000), 600000);

  const res = await fetch(`${ELEVENLABS_BASE}/music/stream?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: prompt.trim(),
      model_id: 'music_v1',
      music_length_ms: clampedMs,
      force_instrumental: true,
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
