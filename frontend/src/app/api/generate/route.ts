import { createClient } from '@/utils/supabase/server';
import { streamText, generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { NextRequest } from 'next/server';

const SYSTEM_PROMPT = `You are an expert Remotion animation developer. Generate beautiful, production-quality animations using React and Remotion.

RULES:
- Export your component as: export const MyAnimation = () => { ... }
- ALL Remotion APIs are available as globals — do NOT write any import statements
- Available globals: React, AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, spring, interpolate, interpolateColors, Audio, Video, Img, Series, Loop, Freeze, OffthreadVideo, staticFile, RemotionShapes, RemotionTransitions
- Composition is 1920×1080 at 30fps. Use useVideoConfig() to get width/height/fps/durationInFrames
- Always declare a top-level constant: const DURATION_IN_FRAMES = <number> (e.g. 180 for 6s, 300 for 10s). Set it to a duration that fits the animation — never hardcode 150 unless the animation is very short
- Use spring() for physics-based animations, interpolate() for linear mappings
- Always set backgroundColor on the root AbsoluteFill
- Use fontFamily: 'Inter, sans-serif' for all text
- Define constants in UPPER_SNAKE_CASE inside the component body
- Keep animations smooth, professional, and visually compelling
- Use absolute positioning with percentage-based or fixed pixel values
- Add subtle micro-animations to make it feel alive

BANNED: Do not shadow these global names — spring, interpolate, useCurrentFrame, useVideoConfig, AbsoluteFill, Sequence

OUTPUT: Only output the raw TSX code with no markdown fences, no imports, no explanations.`;

const EditSchema = z.object({
  type: z.enum(['edit', 'full']),
  summary: z.string(),
  edits: z
    .array(
      z.object({
        description: z.string(),
        old_string: z.string(),
        new_string: z.string(),
      })
    )
    .optional(),
  code: z.string().optional(),
});

function applyEdits(
  currentCode: string,
  edits: { description: string; old_string: string; new_string: string }[]
): { code: string; error: string | null } {
  let code = currentCode;

  for (const edit of edits) {
    const occurrences = code.split(edit.old_string).length - 1;

    if (occurrences === 0) {
      return {
        code,
        error: `Edit "${edit.description}" failed: old_string not found in current code`,
      };
    }

    if (occurrences > 1) {
      return {
        code,
        error: `Edit "${edit.description}" failed: old_string matches ${occurrences} times (must be unique)`,
      };
    }

    code = code.replace(edit.old_string, edit.new_string);
  }

  return { code, error: null };
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = await req.json();
  const { prompt, conversationHistory = [], currentCode, isFollowUp = false, errorCorrection, frameImages } = body;

  // Follow-up edit mode (non-streaming)
  if (isFollowUp && currentCode) {
    const errorCtx = errorCorrection
      ? `\n\nPREVIOUS ERROR (attempt ${errorCorrection.attemptNumber}/${errorCorrection.maxAttempts}):\n${errorCorrection.error}`
      : '';

    const editPrompt = `Current code:\n\`\`\`tsx\n${currentCode}\n\`\`\`\n\nUser request: ${prompt}${errorCtx}

Apply the minimal set of edits needed. Prefer targeted string replacements (type: "edit"). Only use type: "full" if the changes are so extensive that diffs would be unclear.

For each edit, old_string MUST appear exactly once in the current code.`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const historyMessages: any[] = conversationHistory.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    }));

    const result = await generateObject({
      model: anthropic('claude-sonnet-4-6'),
      schema: EditSchema,
      system: SYSTEM_PROMPT,
      messages: [...historyMessages, { role: 'user', content: editPrompt }],
    });

    const editResult = result.object;

    if (editResult.type === 'full' && editResult.code) {
      return Response.json({ type: 'full', code: editResult.code, summary: editResult.summary });
    }

    if (editResult.type === 'edit' && editResult.edits) {
      const { code: patchedCode, error } = applyEdits(currentCode, editResult.edits);

      if (error) {
        return Response.json({ type: 'error', error }, { status: 422 });
      }

      return Response.json({ type: 'edit', code: patchedCode, summary: editResult.summary });
    }

    return Response.json({ type: 'error', error: 'Invalid edit response' }, { status: 422 });
  }

  // Initial generation (streaming)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messages: any[] = [
    ...conversationHistory.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    })),
  ];

  // Build user message with optional frame images
  if (frameImages && frameImages.length > 0) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        ...frameImages.map((img: string) => ({
          type: 'image',
          image: img,
          mimeType: 'image/jpeg',
        })),
      ],
    });
  } else {
    messages.push({ role: 'user', content: prompt });
  }

  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: SYSTEM_PROMPT,
    messages,
  });

  return result.toTextStreamResponse();
}
