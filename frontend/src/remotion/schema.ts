'use client';

// ─── Keyframe ─────────────────────────────────────────────────────────────────

export interface SceneKeyframe {
    frame: number;
    prop: 'x' | 'y' | 'scale' | 'rotation' | 'opacity';
    value: number;
}

// ─── Layer types ──────────────────────────────────────────────────────────────

export interface LayerBase {
    id: string;
    type: string;
    label: string;
    trackColor: string;
    from: number;             // start frame
    durationInFrames: number;
    x: number;                // pixels
    y: number;
    scale: number;
    rotation: number;         // degrees
    opacity: number;
    keyframes: SceneKeyframe[];
}

export interface TextLayer extends LayerBase {
    type: 'text';
    content: string;
    fontSize: number;
    color: string;
    fontWeight: number;
    fontFamily: string;
    letterSpacing: number;
}

export interface ShapeLayer extends LayerBase {
    type: 'shape';
    shape: 'rect' | 'circle';
    width: number;            // pixels
    height: number;
    color: string;
    blur: number;
}

export interface ImageLayer extends LayerBase {
    type: 'image';
    src: string;
    width: number;
    height: number;
    objectFit: 'cover' | 'contain';
}

export type Layer = TextLayer | ShapeLayer | ImageLayer;

// ─── Scene ────────────────────────────────────────────────────────────────────

export interface Scene {
    fps: number;
    width: number;
    height: number;
    durationInFrames: number;
    layers: Layer[];
}

// ─── Track colors ─────────────────────────────────────────────────────────────

const TRACK_COLORS = [
    '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7',
    '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#8b5cf6',
];

export function getTrackColor(index: number): string {
    return TRACK_COLORS[index % TRACK_COLORS.length];
}

// ─── Default demo scene ───────────────────────────────────────────────────────

export const DEFAULT_SCENE: Scene = {
    fps: 30,
    width: 1920,
    height: 1080,
    durationInFrames: 300, // 10 seconds

    layers: [
        // 1 ── Title — fades in with upward slide, fades out at end
        {
            id: 'layer-1',
            type: 'text',
            label: 'Title',
            trackColor: '#ffffff',
            from: 0,
            durationInFrames: 270,
            x: 960, y: 475,
            scale: 1, rotation: 0, opacity: 0,
            content: 'MORPHIX',
            fontSize: 72,
            color: '#ffffff',
            fontWeight: 800,
            fontFamily: 'var(--font-sans, system-ui)',
            letterSpacing: 6,
            keyframes: [
                { frame: 0, prop: 'opacity', value: 0 },
                { frame: 30, prop: 'opacity', value: 1 },
                { frame: 240, prop: 'opacity', value: 1 },
                { frame: 270, prop: 'opacity', value: 0 },
                { frame: 0, prop: 'y', value: 605 },
                { frame: 30, prop: 'y', value: 475 },
            ],
        } as TextLayer,

        // 2 ── Subtitle — scales up from 0, fades out
        {
            id: 'layer-2',
            type: 'text',
            label: 'Subtitle',
            trackColor: '#666666',
            from: 45,
            durationInFrames: 210,
            x: 960, y: 670,
            scale: 0, rotation: 0, opacity: 0,
            content: 'AI-Powered Video Creation',
            fontSize: 28,
            color: '#888888',
            fontWeight: 400,
            fontFamily: 'var(--font-sans, system-ui)',
            letterSpacing: 2,
            keyframes: [
                { frame: 0, prop: 'scale', value: 0 },
                { frame: 30, prop: 'scale', value: 1 },
                { frame: 0, prop: 'opacity', value: 0 },
                { frame: 30, prop: 'opacity', value: 1 },
                { frame: 180, prop: 'opacity', value: 1 },
                { frame: 210, prop: 'opacity', value: 0 },
            ],
        } as TextLayer,

        // 3 ── Rotating rectangle
        {
            id: 'layer-3',
            type: 'shape',
            label: 'Spin Rect',
            trackColor: '#a855f7',
            from: 60,
            durationInFrames: 180,
            x: 960, y: 540,
            scale: 1, rotation: 0, opacity: 0,
            shape: 'rect',
            width: 420, height: 54,
            color: '#a855f7',
            blur: 0,
            keyframes: [
                { frame: 0, prop: 'opacity', value: 0 },
                { frame: 30, prop: 'opacity', value: 0.18 },
                { frame: 150, prop: 'opacity', value: 0.18 },
                { frame: 180, prop: 'opacity', value: 0 },
                { frame: 0, prop: 'rotation', value: 0 },
                { frame: 180, prop: 'rotation', value: 360 },
            ],
        } as ShapeLayer,

        // 4 ── Glow circle — slides in from left
        {
            id: 'layer-4',
            type: 'shape',
            label: 'Glow Circle',
            trackColor: '#3b82f6',
            from: 30,
            durationInFrames: 240,
            x: 288, y: 540,
            scale: 0.5, rotation: 0, opacity: 0,
            shape: 'circle',
            width: 806, height: 806,
            color: '#3b82f6',
            blur: 44,
            keyframes: [
                { frame: 0, prop: 'opacity', value: 0 },
                { frame: 30, prop: 'opacity', value: 0.35 },
                { frame: 0, prop: 'x', value: 288 },
                { frame: 60, prop: 'x', value: 960 },
                { frame: 0, prop: 'scale', value: 0.5 },
                { frame: 60, prop: 'scale', value: 1 },
            ],
        } as ShapeLayer,
    ],
};
