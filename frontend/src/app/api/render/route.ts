import { createClient } from '@/utils/supabase/server';
import { NextRequest } from 'next/server';
import { renderMediaOnLambda, getRenderProgress } from '@remotion/lambda/client';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';

// 5 renders per hour per user (renders are expensive Lambda invocations)
const RENDER_LIMIT = 5
const RENDER_WINDOW_MS = 60 * 60 * 1000

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const rl = checkRateLimit(`render:${session.user.id}`, RENDER_LIMIT, RENDER_WINDOW_MS)
  if (!rl.allowed) return rateLimitResponse(rl.resetAt)

  const { code, durationInFrames, fps, audioUrl } = await req.json();

  if (!code || !durationInFrames || !fps) {
    return Response.json({ error: 'Missing required fields: code, durationInFrames, fps' }, { status: 400 });
  }

  const region = process.env.REMOTION_REGION as 'us-east-1' | 'us-west-2' | 'eu-west-1' || 'us-east-1';
  const functionName = process.env.REMOTION_FUNCTION_NAME;
  const serveUrl = process.env.REMOTION_SERVE_URL;

  if (!functionName || !serveUrl) {
    return Response.json(
      { error: 'Lambda not configured. Set REMOTION_FUNCTION_NAME and REMOTION_SERVE_URL in .env.local' },
      { status: 503 }
    );
  }

  // Write generated code to a temp file so Lambda can reference it via inputProps
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'morphix-'));
  const codePath = path.join(tmpDir, 'animation.tsx');
  await fs.writeFile(codePath, code, 'utf-8');

  try {
    const { renderId, bucketName } = await renderMediaOnLambda({
      region,
      functionName,
      serveUrl,
      composition: 'MorphixVideo',
      inputProps: {
        code,
        durationInFrames,
        fps,
        ...(audioUrl ? { audioUrl } : {}),
      },
      codec: 'h264',
      framesPerLambda: 60,
      downloadBehavior: {
        type: 'download',
        fileName: 'animation.mp4',
      },
    });

    // Poll for completion (max 5 minutes)
    const maxWait = 300_000;
    const interval = 3_000;
    const start = Date.now();

    while (Date.now() - start < maxWait) {
      await new Promise((resolve) => setTimeout(resolve, interval));

      const progress = await getRenderProgress({
        renderId,
        bucketName,
        functionName,
        region,
      });

      if (progress.fatalErrorEncountered) {
        return Response.json({ error: progress.errors[0]?.message || 'Render failed' }, { status: 500 });
      }

      if (progress.done) {
        return Response.json({ url: progress.outputFile });
      }
    }

    return Response.json({ error: 'Render timed out after 5 minutes' }, { status: 504 });
  } finally {
    await fs.rm(tmpDir, { recursive: true }).catch(() => {});
  }
}
