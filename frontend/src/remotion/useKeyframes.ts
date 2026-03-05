'use client';

import { useCurrentFrame } from 'remotion';
import { interpolate } from 'remotion';
import type { SceneKeyframe } from './schema';

/**
 * Given a layer's keyframes array and base values, returns the resolved
 * transform properties for the current Remotion frame.
 *
 * Keyframe `frame` values are relative to the layer's Sequence (0 = layer start).
 */
export function useLayerTransform(
    keyframes: SceneKeyframe[],
    base: { x: number; y: number; scale: number; rotation: number; opacity: number },
) {
    const frame = useCurrentFrame();

    const resolve = (prop: SceneKeyframe['prop'], baseVal: number): number => {
        const kfs = keyframes
            .filter(k => k.prop === prop)
            .sort((a, b) => a.frame - b.frame);

        if (kfs.length === 0) return baseVal;

        // Clamp to first/last keyframe
        if (frame <= kfs[0].frame) return kfs[0].value;
        if (frame >= kfs[kfs.length - 1].frame) return kfs[kfs.length - 1].value;

        // Find the surrounding keyframes
        let lo = kfs[0], hi = kfs[kfs.length - 1];
        for (let i = 0; i < kfs.length - 1; i++) {
            if (frame >= kfs[i].frame && frame <= kfs[i + 1].frame) {
                lo = kfs[i];
                hi = kfs[i + 1];
                break;
            }
        }

        return interpolate(frame, [lo.frame, hi.frame], [lo.value, hi.value], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
        });
    };

    return {
        x: resolve('x', base.x),
        y: resolve('y', base.y),
        scale: resolve('scale', base.scale),
        rotation: resolve('rotation', base.rotation),
        opacity: resolve('opacity', base.opacity),
    };
}
