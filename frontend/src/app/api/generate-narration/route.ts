import { createClient } from '@/utils/supabase/server';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { animationCode, userPrompt, durationSeconds, instructions } = await req.json();

  if (!animationCode && !userPrompt) {
    return Response.json({ error: 'Provide animationCode or userPrompt' }, { status: 400 });
  }

  const contextParts: string[] = [];

  if (userPrompt) {
    contextParts.push(`User's animation description:\n"${userPrompt}"`);
  }

  if (animationCode) {
    // Send just a snippet of the code — enough to understand content/tone
    const snippet = animationCode.slice(0, 2000);
    contextParts.push(`Animation code (excerpt):\n\`\`\`\n${snippet}\n\`\`\``);
  }

  if (durationSeconds) {
    contextParts.push(`Target video duration: ${durationSeconds} seconds`);
  }

  if (instructions) {
    contextParts.push(`Additional instructions from user: "${instructions}"`);
  }

  const { text } = await generateText({
    model: anthropic('claude-haiku-4-5-20251001'),
    system: `You are a professional video narrator and copywriter. Generate concise, compelling narration scripts for marketing and product videos.

Guidelines:
- Write in a natural, conversational tone that sounds good when spoken aloud
- Match the energy and style implied by the animation content
- Keep sentences short and punchy — they need to fit the video pacing
- Never include stage directions, speaker names, or formatting — just the words to be spoken
- No markdown, no asterisks, no quotes around the output
- If a duration is given, calibrate length accordingly (roughly 130-150 words per minute of speech)
- Focus on benefits, transformation, and emotional resonance`,
    prompt: `Generate a narration script for this video.\n\n${contextParts.join('\n\n')}`,
    maxTokens: 400,
  });

  return Response.json({ script: text.trim() });
}
