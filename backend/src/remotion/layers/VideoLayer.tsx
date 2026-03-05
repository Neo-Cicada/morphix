import React from 'react';
import { Video } from 'remotion';
import type { VideoLayer as VideoLayerType } from '../schema';
import { useLayerTransform } from '../useKeyframes';

export const VideoLayerComponent: React.FC<{ layer: VideoLayerType }> = ({ layer }) => {
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
      <Video
        src={layer.src}
        volume={layer.volume}
        startFrom={layer.startFrom}
        playbackRate={layer.playbackRate}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </div>
  );
};
