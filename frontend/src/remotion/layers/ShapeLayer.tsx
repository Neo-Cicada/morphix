'use client';

import React from 'react';
import type { ShapeLayer as ShapeLayerType } from '../schema';
import { useLayerTransform } from '../useKeyframes';

export const ShapeLayerComponent: React.FC<{ layer: ShapeLayerType }> = ({ layer }) => {
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
        background: layer.color,
        borderRadius: layer.shape === 'circle' ? '50%' : 4,
        filter: layer.blur ? `blur(${layer.blur}px)` : undefined,
        pointerEvents: 'none',
      }}
    />
  );
};
