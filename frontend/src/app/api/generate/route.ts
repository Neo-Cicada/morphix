import { createClient } from '@/utils/supabase/server';
import { streamText, generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { NextRequest } from 'next/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';

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

BANNED: Do not shadow these global names — spring, interpolate, useCurrentFrame, useVideoConfig, AbsoluteFill, Sequence, useFrame

OUTPUT: Only output the raw TSX code with no markdown fences, no imports, no explanations.

3D ANIMATIONS (React Three Fiber + Three.js):

When the user requests 3D content, use these additional globals (no imports needed):

- THREE — full Three.js namespace (new THREE.Vector3(), THREE.MathUtils.degToRad(), etc.)
- ThreeCanvas — REQUIRED wrapper for all 3D. Use instead of Canvas. Props: width, height (from useVideoConfig()), plus camera, shadows, etc.
- useThree — access { camera, scene, gl, size } inside ThreeCanvas
- extend — register custom Three.js classes as JSX elements
- DO NOT USE useFrame — animate with useCurrentFrame() only

Drei geometry: Box, Sphere, Plane, Torus, Cylinder, Cone, RoundedBox
Drei materials: MeshDistortMaterial (props: distort, speed), MeshWobbleMaterial (props: factor, speed)
Drei scene: Environment (preset: 'sunset'|'dawn'|'night'|'warehouse'|'forest'|'studio'|'city'), Stars, Float, Center
Drei text/camera: Text, PerspectiveCamera

3D RULES:
1. Always wrap 3D in <ThreeCanvas width={width} height={height}>
2. Never use useFrame() — drive all animation from frame = useCurrentFrame()
3. Animate object props from frame: rotation={[0, frame * 0.02, 0]}
4. Add lights inside ThreeCanvas: <ambientLight /> <directionalLight position={[5, 5, 5]} />
5. When using <Sequence> inside <ThreeCanvas>, set layout="none" on Sequence
6. Can mix 2D (AbsoluteFill) and 3D (ThreeCanvas) in same animation

EXAMPLE:
const MyAnimation = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <ThreeCanvas width={width} height={height} camera={{ fov: 50, position: [0, 0, 5] }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <mesh rotation={[0, frame * 0.02, 0]}>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="#C17B4F" />
        </mesh>
      </ThreeCanvas>
    </AbsoluteFill>
  );
};`;

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

// 20 generations per hour per user (blocks abuse while allowing normal usage)
const GENERATE_LIMIT = 20
const GENERATE_WINDOW_MS = 60 * 60 * 1000

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const rl = checkRateLimit(`generate:${session.user.id}`, GENERATE_LIMIT, GENERATE_WINDOW_MS)
  if (!rl.allowed) return rateLimitResponse(rl.resetAt)

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
