import React from 'react';
import { Sequence, AbsoluteFill } from 'remotion';
import type { Scene } from './schema';
import { TextLayerComponent } from './layers/TextLayer';
import { ShapeLayerComponent } from './layers/ShapeLayer';
import { ImageLayerComponent } from './layers/ImageLayer';
import { VideoLayerComponent } from './layers/VideoLayer';
import { AudioLayerComponent } from './layers/AudioLayer';

interface MorphixVideoProps {
  scene: Scene;
}

export const MorphixVideo: React.FC<MorphixVideoProps> = ({ scene }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: scene.backgroundColor ?? '#000' }}>
      {scene.layers.map((layer) => (
        <Sequence
          key={layer.id}
          from={layer.from}
          durationInFrames={layer.durationInFrames}
          name={layer.label}
          style={{ zIndex: layer.zIndex ?? 0 }}
        >
          <AbsoluteFill style={{ pointerEvents: 'none' }}>
            {layer.type === 'text' && <TextLayerComponent layer={layer} />}
            {layer.type === 'shape' && <ShapeLayerComponent layer={layer} />}
            {layer.type === 'image' && <ImageLayerComponent layer={layer} />}
            {layer.type === 'video' && <VideoLayerComponent layer={layer} />}
            {layer.type === 'audio' && <AudioLayerComponent layer={layer} />}
          </AbsoluteFill>
        </Sequence>
      ))}

      {/* Cinematic letterbox bars */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '9%', background: '#000', zIndex: 100 }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '9%', background: '#000', zIndex: 100 }} />
    </AbsoluteFill>
  );
};
