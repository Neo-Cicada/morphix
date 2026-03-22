import React from 'react';
import * as Babel from '@babel/standalone';
import * as Remotion from 'remotion';
import * as RemotionShapes from '@remotion/shapes';
import * as RemotionTransitions from '@remotion/transitions';

interface Props extends Record<string, unknown> {
  code: string;
  audioUrl?: string;
  voiceUrl?: string;
}

// Minimal globals for server-side compilation (no Three.js / R3F — not available in Lambda)
const GLOBALS: Record<string, unknown> = {
  React,
  ...Remotion,
  RemotionShapes,
  RemotionTransitions,
};

function compileCode(code: string): React.ComponentType | null {
  try {
    let stripped = code
      .replace(/^import\s+type\s+[^\n]*$/gm, '')
      .replace(/^import\s+[^\n]*from\s+['"][^'"]+['"]\s*;?$/gm, '')
      .replace(/^import\s+['"][^'"]+['"]\s*;?$/gm, '')
      .trim();

    stripped = stripped
      .replace(/export\s+default\s+function\s+/g, 'function ')
      .replace(/export\s+default\s+/g, 'var __defaultExport = ')
      .replace(/export\s+const\s+/g, 'const ')
      .replace(/export\s+function\s+/g, 'function ')
      .replace(/export\s+class\s+/g, 'class ');

    if (!stripped) return null;

    const result = Babel.transform(stripped, {
      presets: [
        ['react', { runtime: 'classic' }],
        ['typescript', { allExtensions: true, isTSX: true }],
      ],
      filename: 'animation.tsx',
      sourceType: 'script',
    });

    const transformed = result.code;
    if (!transformed) return null;

    const declaredNames: string[] = [];
    const nameRe = /(?:const|var|let|function)\s+([A-Z][A-Za-z0-9_]*)/g;
    let m: RegExpExecArray | null;
    while ((m = nameRe.exec(transformed)) !== null) {
      if (!declaredNames.includes(m[1])) declaredNames.push(m[1]);
    }

    const tryNames = ['MyAnimation', '__defaultExport', ...declaredNames.filter((n) => n !== 'MyAnimation')];
    const factoryBody = `
      ${transformed}
      ${tryNames.map((n) => `if (typeof ${n} === 'function') { return ${n}; }`).join('\n')}
      return null;
    `;

    const globalNames = Object.keys(GLOBALS);
    const globalValues = Object.values(GLOBALS);
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const factory = new Function(...globalNames, factoryBody);
    return factory(...globalValues) as React.ComponentType | null;
  } catch (err) {
    console.error('[DynamicComposition] compile error:', err);
    return null;
  }
}

export function DynamicComposition({ code, audioUrl, voiceUrl }: Props) {
  const Component = React.useMemo(() => compileCode(code), [code]);

  if (!Component) {
    return (
      <Remotion.AbsoluteFill style={{ background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#f87171', fontFamily: 'monospace', fontSize: 14 }}>
          Failed to compile animation
        </span>
      </Remotion.AbsoluteFill>
    );
  }

  return (
    <>
      {audioUrl && <Remotion.Audio src={audioUrl} loop />}
      {voiceUrl && <Remotion.Audio src={voiceUrl} />}
      <Component />
    </>
  );
}
