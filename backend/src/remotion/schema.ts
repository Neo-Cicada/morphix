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
    from: number;
    durationInFrames: number;
    x: number;
    y: number;
    scale: number;
    rotation: number;
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
    width: number;
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

export interface VideoLayer extends LayerBase {
    type: 'video';
    src: string;
    width: number;
    height: number;
    volume: number;
    startFrom: number;
    playbackRate: number;
}

export interface AudioLayer extends LayerBase {
    type: 'audio';
    src: string;
    volume: number;
    startFrom: number;
    playbackRate: number;
}

export type Layer = TextLayer | ShapeLayer | ImageLayer | VideoLayer | AudioLayer;

// ─── Scene ────────────────────────────────────────────────────────────────────

export interface Scene {
    fps: number;
    width: number;
    height: number;
    durationInFrames: number;
    layers: Layer[];
}
