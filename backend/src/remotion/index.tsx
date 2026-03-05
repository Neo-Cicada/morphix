import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { MorphixVideo } from './MorphixVideo';
import type { Scene } from './schema';

const defaultScene: Scene = {
  fps: 30,
  width: 1920,
  height: 1080,
  durationInFrames: 300,
  layers: [],
};

const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="MorphixVideo"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      component={MorphixVideo as any}
      durationInFrames={defaultScene.durationInFrames}
      fps={defaultScene.fps}
      width={defaultScene.width}
      height={defaultScene.height}
      defaultProps={{ scene: defaultScene }}
    />
  );
};

registerRoot(RemotionRoot);
