'use client';

import React from 'react';
import { Sequence, AbsoluteFill } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';

loadFont('normal', { weights: ['400', '600', '700', '800'], subsets: ['latin'] });
import type { Scene } from './schema';
import { TextLayerComponent } from './layers/TextLayer';
import { ShapeLayerComponent } from './layers/ShapeLayer';
import { ImageLayerComponent } from './layers/ImageLayer';
import { VideoLayerComponent } from './layers/VideoLayer';
import { AudioLayerComponent } from './layers/AudioLayer';

interface MorphixVideoProps {
  scene: Scene;
  selectedLayerId?: string | null;
}

export const MorphixVideo: React.FC<MorphixVideoProps> = ({ scene, selectedLayerId }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {scene.layers.map((layer) => {
        const isSelected = layer.id === selectedLayerId;
        return (
          <Sequence
            key={layer.id}
            from={layer.from}
            durationInFrames={layer.durationInFrames}
            name={layer.label}
          >
            <AbsoluteFill
              style={{
                outline: isSelected ? '2px dashed rgba(59,130,246,0.5)' : undefined,
                pointerEvents: 'none',
              }}
            >
              {layer.type === 'text' && <TextLayerComponent layer={layer} />}
              {layer.type === 'shape' && <ShapeLayerComponent layer={layer} />}
              {layer.type === 'image' && <ImageLayerComponent layer={layer} />}
              {layer.type === 'video' && <VideoLayerComponent layer={layer} />}
              {layer.type === 'audio' && <AudioLayerComponent layer={layer} />}
            </AbsoluteFill>
          </Sequence>
        );
      })}

      {/* Cinematic letterbox bars */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '9%', background: '#000', zIndex: 100 }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '9%', background: '#000', zIndex: 100 }} />
    </AbsoluteFill>
  );
};
