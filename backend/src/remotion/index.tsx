import React from 'react';
import { Composition, registerRoot } from 'remotion';
import type { CalculateMetadataFunction } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { MorphixVideo } from './MorphixVideo';
import type { Scene } from './schema';

// Load Inter font — blocks rendering until ready in Lambda
loadFont('normal', { weights: ['400', '600', '700', '800'], subsets: ['latin'] });

interface RootProps {
  scene: Scene;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const calculateMetadata: CalculateMetadataFunction<any> = ({ props }: { props: RootProps }) => {
  return {
    durationInFrames: props.scene.durationInFrames,
    fps: props.scene.fps,
    width: props.scene.width,
    height: props.scene.height,
  };
};

const defaultScene: Scene = {
  fps: 30,
  width: 1920,
  height: 1080,
  durationInFrames: 300,
  backgroundColor: '#000000',
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
      calculateMetadata={calculateMetadata}
    />
  );
};

registerRoot(RemotionRoot);
