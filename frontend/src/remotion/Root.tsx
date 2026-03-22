import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { DynamicComposition } from './DynamicComposition';

function RemotionRoot() {
  return (
    <Composition
      id="MorphixVideo"
      component={DynamicComposition}
      durationInFrames={180}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{ code: '', audioUrl: '' }}
    />
  );
}

registerRoot(RemotionRoot);
