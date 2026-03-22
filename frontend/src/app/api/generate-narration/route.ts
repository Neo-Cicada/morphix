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
    system: `You are a professional video narrator. Your ONLY job is to output the exact words to be spoken aloud — nothing else.

STRICT RULES:
- Output ONLY the spoken words. Nothing before them, nothing after them.
- No title, no header, no intro like "Here's your script:" or "Here's a narration:"
- No dashes, separators, or markdown of any kind
- No word count, timing notes, or production tips
- No asterisks, bold, italics, or quotes around the output
- No stage directions or speaker labels
- Calibrate length to the given duration (roughly 2.5 words per second of speech)
- Write in short, punchy sentences that sound natural when spoken`,
    prompt: `Write the narration for this video.\n\n${contextParts.join('\n\n')}`,
    maxOutputTokens: 400,
  });

  // Strip any markdown artifacts the model might still include
  const clean = text
    .replace(/^---+\s*/gm, '')           // horizontal rules
    .replace(/\*\*([^*]+)\*\*/g, '$1')   // bold
    .replace(/\*([^*]+)\*/g, '$1')       // italic
    .replace(/^#+\s+.+$/gm, '')          // headings
    .replace(/^[-–—]{3,}.*$/gm, '')      // dash separators
    .replace(/\n{3,}/g, '\n\n')          // excessive blank lines
    .trim();

  return Response.json({ script: clean });
}
