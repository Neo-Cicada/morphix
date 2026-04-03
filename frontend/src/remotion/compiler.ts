'use client';

import * as Babel from '@babel/standalone';
import React from 'react';
import * as Remotion from 'remotion';
import * as RemotionShapes from '@remotion/shapes';
import * as RemotionTransitions from '@remotion/transitions';
import * as THREE from 'three';
import { useFrame, useThree, extend } from '@react-three/fiber';
import * as DreiExports from '@react-three/drei';
import { ThreeCanvas } from '@remotion/three';

export interface CompileResult {
  Component: React.ComponentType | null;
  error: string | null;
}

// Injected globals available to generated code
const GLOBALS = {
  React,
  ...Remotion,
  RemotionShapes,
  RemotionTransitions,
  THREE,
  ThreeCanvas,
  useFrame,
  useThree,
  extend,
  // Drei geometry
  Box: DreiExports.Box,
  Sphere: DreiExports.Sphere,
  Plane: DreiExports.Plane,
  Torus: DreiExports.Torus,
  Cylinder: DreiExports.Cylinder,
  Cone: DreiExports.Cone,
  RoundedBox: DreiExports.RoundedBox,
  // Drei materials
  MeshDistortMaterial: DreiExports.MeshDistortMaterial,
  MeshWobbleMaterial: DreiExports.MeshWobbleMaterial,
  // Drei scene
  Environment: DreiExports.Environment,
  Stars: DreiExports.Stars,
  Float: DreiExports.Float,
  Center: DreiExports.Center,
  // Drei text/camera
  Text: DreiExports.Text,
  PerspectiveCamera: DreiExports.PerspectiveCamera,
} as Record<string, unknown>;

const BABEL_PRESETS_TS = [
  ['react', { runtime: 'classic' }],
  ['typescript', { allExtensions: true, isTSX: true }],
];
const BABEL_PRESETS_JSX = [['react', { runtime: 'classic' }]];

/**
 * Strip TypeScript-only constructs so Babel can parse the code as plain JS+JSX.
 * Used as a fallback when the TypeScript preset fails (e.g. complex generics
 * with semicolons inside object-type literals confuse Babel's TSX parser).
 */
function stripTypeScriptAnnotations(code: string): string {
  return (
    code
      // interface declarations (handles multiline)
      .replace(/\binterface\s+\w+(\s*<[^>]*>)?(\s*extends\s+[^{]+)?\s*\{[^}]*\}/gs, '')
      // type alias declarations: type Foo = ...;
      .replace(/\btype\s+\w+(\s*<[^>]*>)?\s*=[^;]+;/gs, '')
      // generic type parameters on function/method calls: fn<Type>( → fn(
      // careful not to eat JSX like <Comp>
      .replace(/\b(\w+)\s*<([A-Za-z][A-Za-z0-9,. <>\[\]{} |&?]*)>\s*\(/g, '$1(')
      // return type annotations: ): Type => or ): Type {
      .replace(/\)\s*:\s*[A-Za-z][A-Za-z0-9.<>\[\]| &?,{}]*(?=\s*(?:=>|\{))/g, ')')
      // variable type annotations: const x: Type =
      .replace(/\b(const|let|var)\s+(\w+)\s*:\s*[A-Za-z][A-Za-z0-9.<>\[\]| &?,{}]*(?=\s*=)/g, '$1 $2')
      // parameter type annotations: (p: Type, i: Type) — only simple word types
      .replace(/(\b\w+)\s*:\s*[A-Za-z]\w*(\[\])?(?=\s*[,)])/g, '$1')
      // 'as Type' type assertions
      .replace(/\s+as\s+[A-Za-z][A-Za-z0-9.<>\[\]| &?,]*/g, '')
  );
}

function babelTransform(code: string, presets: unknown[]): string {
  const result = Babel.transform(code, {
    presets,
    filename: 'animation.tsx',
    sourceType: 'module',
  });
  if (!result.code) throw new Error('Babel transform produced no output');
  return result.code;
}

function extractComponent(transformed: string): React.ComponentType | null {
  const declaredNames: string[] = [];
  const nameRe = /(?:const|var|let|function)\s+([A-Z][A-Za-z0-9_]*)/g;
  let m: RegExpExecArray | null;
  while ((m = nameRe.exec(transformed)) !== null) {
    if (!declaredNames.includes(m[1])) declaredNames.push(m[1]);
  }

  const tryNames = [
    'MyAnimation',
    '__defaultExport',
    ...declaredNames.filter((n) => n !== 'MyAnimation'),
  ];

  const factoryBody = `
    ${transformed}

    ${tryNames.map((n) => `if (typeof ${n} === 'function') { return ${n}; }`).join('\n    ')}
    return null;
  `;

  const globalNames = Object.keys(GLOBALS);
  const globalValues = Object.values(GLOBALS);

  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const factory = new Function(...globalNames, factoryBody);
  return factory(...globalValues) as React.ComponentType | null;
}

export function compile(code: string): CompileResult {
  try {
    // 1. Strip import statements
    let stripped = code
      .replace(/^import\s+type\s+[^\n]*$/gm, '')
      .replace(/^import\s+[^\n]*from\s+['"][^'"]+['"]\s*;?$/gm, '')
      .replace(/^import\s+['"][^'"]+['"]\s*;?$/gm, '')
      .trim();

    // 2. Replace export keywords so code is valid inside new Function()
    stripped = stripped
      .replace(/export\s+default\s+function\s+/g, 'function ')
      .replace(/export\s+default\s+/g, 'var __defaultExport = ')
      .replace(/export\s+const\s+/g, 'const ')
      .replace(/export\s+function\s+/g, 'function ')
      .replace(/export\s+class\s+/g, 'class ');

    if (!stripped) return { Component: null, error: null };

    // 2b. Fix common LLM-generated syntax issues before Babel sees them
    stripped = stripped
      // collapse multiple consecutive semicolons
      .replace(/;{2,}/g, ';')
      // remove semicolons after JSX closing tags when followed by ), ], }, or ,
      .replace(/(<\/[A-Za-z][A-Za-z0-9.]*>)\s*;(\s*[)\]},])/g, '$1$2')
      // remove stray semicolons before self-closing />
      .replace(/;\s*(\/\/>)/g, ' $1');

    // 3. Try Babel with TypeScript + JSX preset first
    let transformed: string;
    try {
      transformed = babelTransform(stripped, BABEL_PRESETS_TS);
    } catch (tsErr) {
      // Fallback: strip TypeScript annotations and retry with JSX-only preset.
      // This handles cases where TypeScript generics with object-type literals
      // (e.g. useMemo<{x: number; y: number}[]>) confuse Babel's TSX parser,
      // producing misleading errors like "Missing semicolon" at template literals.
      console.warn('[compiler] TypeScript parse failed, retrying without TS annotations:', tsErr instanceof Error ? tsErr.message : tsErr);
      try {
        const stripped2 = stripTypeScriptAnnotations(stripped);
        transformed = babelTransform(stripped2, BABEL_PRESETS_JSX);
      } catch (jsxErr) {
        // Both passes failed — surface the original TS error (more informative)
        const message = tsErr instanceof Error ? tsErr.message : String(tsErr);
        console.error('[compiler]', message);
        return { Component: null, error: message };
      }
    }

    // 4. Execute and extract the component
    const Component = extractComponent(transformed);

    if (!Component || typeof Component !== 'function') {
      const msg = `No component found. Make sure to export a React component named MyAnimation.`;
      console.error('[compiler]', msg);
      return { Component: null, error: msg };
    }

    console.log('[compiler] OK —', Component.name || 'anonymous');
    return { Component, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[compiler]', message);
    return { Component: null, error: message };
  }
}
