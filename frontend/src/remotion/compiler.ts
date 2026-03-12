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

    // 3. Babel: classic JSX runtime so React.createElement is used (available as injected global)
    const result = Babel.transform(stripped, {
      presets: [
        ['react', { runtime: 'classic' }],
        ['typescript', { allExtensions: true, isTSX: true }],
      ],
      filename: 'animation.tsx',
      sourceType: 'module',
    });

    const transformed = result.code;
    if (!transformed) {
      return { Component: null, error: 'Babel transform produced no output' };
    }

    // 4. Find all PascalCase names declared in the transformed output.
    //    Try them in reverse order (last declared = outermost component).
    const declaredNames: string[] = [];
    const nameRe = /(?:const|var|let|function)\s+([A-Z][A-Za-z0-9_]*)/g;
    let m: RegExpExecArray | null;
    while ((m = nameRe.exec(transformed)) !== null) {
      if (!declaredNames.includes(m[1])) declaredNames.push(m[1]);
    }

    // Prefer 'MyAnimation' if present, otherwise try the last PascalCase name
    const tryNames = [
      'MyAnimation',
      '__defaultExport',
      ...declaredNames.filter((n) => n !== 'MyAnimation'),
    ];

    const factoryBody = `
      ${transformed}

      ${tryNames.map((n) => `if (typeof ${n} === 'function') { return ${n}; }`).join('\n      ')}
      return null;
    `;

    const globalNames = Object.keys(GLOBALS);
    const globalValues = Object.values(GLOBALS);

    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const factory = new Function(...globalNames, factoryBody);
    const Component = factory(...globalValues) as React.ComponentType | null;

    if (!Component || typeof Component !== 'function') {
      const msg = `No component found. Declared names: [${declaredNames.join(', ')}]. Make sure to export a React component.`;
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
