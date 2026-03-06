import { useCurrentFrame, interpolate, spring, Easing } from 'remotion';
import type { SceneKeyframe } from './schema';

export function useLayerTransform(
    keyframes: SceneKeyframe[],
    base: { x: number; y: number; scale: number; rotation: number; opacity: number },
    fps: number,
) {
    const frame = useCurrentFrame();

    const resolve = (prop: SceneKeyframe['prop'], baseVal: number): number => {
        const kfs = keyframes
            .filter(k => k.prop === prop)
            .sort((a, b) => a.frame - b.frame);

        if (kfs.length === 0) return baseVal;
        if (frame <= kfs[0].frame) return kfs[0].value;
        if (frame >= kfs[kfs.length - 1].frame) return kfs[kfs.length - 1].value;

        let lo = kfs[0], hi = kfs[kfs.length - 1];
        for (let i = 0; i < kfs.length - 1; i++) {
            if (frame >= kfs[i].frame && frame <= kfs[i + 1].frame) {
                lo = kfs[i];
                hi = kfs[i + 1];
                break;
            }
        }

        const easing = lo.easing ?? 'linear';

        if (easing === 'spring') {
            const progress = spring({
                frame: frame - lo.frame,
                fps,
                config: { damping: 200 },
                durationInFrames: hi.frame - lo.frame,
            });
            return lo.value + (hi.value - lo.value) * progress;
        }

        const easingFn =
            easing === 'ease-in' ? Easing.in(Easing.quad) :
            easing === 'ease-out' ? Easing.out(Easing.quad) :
            easing === 'ease-in-out' ? Easing.inOut(Easing.quad) :
            Easing.linear;

        return interpolate(frame, [lo.frame, hi.frame], [lo.value, hi.value], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: easingFn,
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
