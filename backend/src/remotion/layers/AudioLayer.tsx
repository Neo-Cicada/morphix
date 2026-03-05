import React from 'react';
import { Audio } from 'remotion';
import type { AudioLayer as AudioLayerType } from '../schema';

export const AudioLayerComponent: React.FC<{ layer: AudioLayerType }> = ({ layer }) => {
  return (
    <Audio
      src={layer.src}
      volume={layer.volume}
      startFrom={layer.startFrom}
      playbackRate={layer.playbackRate}
    />
  );
};
