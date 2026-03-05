import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an AI video editor for Morphix Studio. You modify video scenes by editing a JSON scene object.

## Scene Schema

A Scene has this structure:
\`\`\`ts
interface Scene {
  fps: number;              // always 30
  width: number;            // always 1920
  height: number;           // always 1080
  durationInFrames: number; // total frames (fps * seconds)
  layers: Layer[];
}
\`\`\`

Each Layer has a base plus type-specific fields:
\`\`\`ts
interface LayerBase {
  id: string;               // e.g. "layer-5"
  type: string;             // "text" | "shape" | "image"
  label: string;            // display name
  trackColor: string;       // hex color for timeline
  from: number;             // start frame (0-based)
  durationInFrames: number; // how many frames this layer is visible
  x: number; y: number;     // position in pixels (center of 1920×1080)
  scale: number;            // 1 = normal
  rotation: number;         // degrees
  opacity: number;          // 0-1
  keyframes: Keyframe[];
}

interface Keyframe {
  frame: number;   // relative to layer start (0 = first frame of layer)
  prop: "x" | "y" | "scale" | "rotation" | "opacity";
  value: number;
}

// Text layer
interface TextLayer extends LayerBase {
  type: "text";
  content: string;
  fontSize: number;        // pixels
  color: string;           // hex
  fontWeight: number;      // 300-800
  fontFamily: string;
  letterSpacing: number;
}

// Shape layer
interface ShapeLayer extends LayerBase {
  type: "shape";
  shape: "rect" | "circle";
  width: number;           // pixels
  height: number;          // pixels
  color: string;           // hex
  blur: number;            // px, 0 = no blur
}
\`\`\`

## Rules
- The canvas is 1920×1080 pixels. Center is (960, 540).
- FPS is always 30. To convert seconds to frames: seconds × 30.
- Keyframe \`frame\` values are RELATIVE to the layer's \`from\`. Frame 0 = when the layer starts.
- Layer IDs must be unique strings like "layer-N".
- Track colors should be hex colors.
- Opacity must be between 0 and 1.
- When adding a new layer, pick a unique ID that doesn't conflict with existing ones.
- When removing a layer, remove it entirely from the layers array.
- Do NOT change the scene fps, width, or height unless explicitly asked.

## Response Format
You MUST respond with:
1. A brief natural language explanation of what you changed (1-3 sentences).
2. A JSON code block containing the COMPLETE modified scene object:

\`\`\`json
{ "fps": 30, "width": 1920, "height": 1080, "durationInFrames": ..., "layers": [...] }
\`\`\`

IMPORTANT: Always return the COMPLETE scene with ALL layers (not just the ones you modified). The JSON must be valid and parseable.`;

// ─── Handler ──────────────────────────────────────────────────────────────────

interface ChatMessage {
    role: 'user' | 'assistant';
    text: string;
}

interface EditRequest {
    scene: Record<string, unknown>;
    message: string;
    history?: ChatMessage[];
}

export async function editScene(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const { scene, message, history } = req.body as EditRequest;

        if (!scene || !message) {
            res.status(400).json({ status: 'error', message: 'scene and message are required' });
            return;
        }

        // Build conversation messages
        const messages: Anthropic.MessageParam[] = [];

        // Include recent chat history for context (last 10 messages max)
        if (history && Array.isArray(history)) {
            const recent = history.slice(-10);
            for (const msg of recent) {
                messages.push({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content: msg.text,
                });
            }
        }

        // Add the current user message with scene context
        messages.push({
            role: 'user',
            content: `Here is the current scene:\n\`\`\`json\n${JSON.stringify(scene, null, 2)}\n\`\`\`\n\nUser request: ${message}`,
        });

        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 8192,
            system: SYSTEM_PROMPT,
            messages,
        });

        // Extract text from response
        const responseText = response.content
            .filter((block): block is Anthropic.TextBlock => block.type === 'text')
            .map(block => block.text)
            .join('\n');

        // Parse the JSON scene from the response
        const jsonMatch = responseText.match(/```json\s*([\s\S]*?)```/);
        if (!jsonMatch) {
            res.status(422).json({
                status: 'error',
                message: 'AI did not return a valid scene. Please try rephrasing your request.',
                reply: responseText,
            });
            return;
        }

        let updatedScene;
        try {
            updatedScene = JSON.parse(jsonMatch[1].trim());
        } catch {
            res.status(422).json({
                status: 'error',
                message: 'AI returned invalid JSON. Please try again.',
                reply: responseText,
            });
            return;
        }

        // Extract the natural language explanation (everything before the JSON block)
        const reply = responseText
            .replace(/```json[\s\S]*?```/, '')
            .trim()
            || 'Done! I\'ve updated the scene.';

        res.json({
            scene: updatedScene,
            reply,
        });
    } catch (err: unknown) {
        if (err instanceof Error && err.message?.includes('API key')) {
            res.status(500).json({ status: 'error', message: 'AI service configuration error' });
            return;
        }
        next(err);
    }
}
