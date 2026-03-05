import React from 'react';
import { Img } from 'remotion';
import type { ImageLayer as ImageLayerType } from '../schema';
import { useLayerTransform } from '../useKeyframes';

export const ImageLayerComponent: React.FC<{ layer: ImageLayerType }> = ({ layer }) => {
  const t = useLayerTransform(layer.keyframes, {
    x: layer.x,
    y: layer.y,
    scale: layer.scale,
    rotation: layer.rotation,
    opacity: layer.opacity,
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: t.x,
        top: t.y,
        width: layer.width,
        height: layer.height,
        transform: `translate(-50%, -50%) scale(${t.scale}) rotate(${t.rotation}deg)`,
        transformOrigin: 'center center',
        opacity: t.opacity,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <Img
        src={layer.src}
        style={{
          width: '100%',
          height: '100%',
          objectFit: layer.objectFit,
        }}
      />
    </div>
  );
};
