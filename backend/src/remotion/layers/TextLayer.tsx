import React from 'react';
import type { TextLayer as TextLayerType } from '../schema';
import { useLayerTransform } from '../useKeyframes';

export const TextLayerComponent: React.FC<{ layer: TextLayerType }> = ({ layer }) => {
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
        transform: `translate(-50%, -50%) scale(${t.scale}) rotate(${t.rotation}deg)`,
        transformOrigin: 'center center',
        opacity: t.opacity,
        fontSize: layer.fontSize,
        fontWeight: layer.fontWeight,
        fontFamily: layer.fontFamily,
        letterSpacing: layer.letterSpacing,
        color: layer.color,
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      {layer.content}
    </div>
  );
};
