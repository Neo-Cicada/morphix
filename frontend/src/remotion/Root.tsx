import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { DynamicComposition } from './DynamicComposition';

interface InputProps {
  code: string;
  durationInFrames: number;
  fps: number;
}

function RemotionRoot() {
  return (
    <Composition
      id="MorphixVideo"
      component={DynamicComposition}
      durationInFrames={180}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{
        code: '',
        durationInFrames: 180,
        fps: 30,
      }}
      calculateMetadata={async ({ props }: { props: InputProps }) => ({
        durationInFrames: props.durationInFrames || 180,
        fps: props.fps || 30,
      })}
    />
  );
}

registerRoot(RemotionRoot);
