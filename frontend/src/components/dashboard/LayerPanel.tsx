'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { Eye, EyeOff, GripVertical } from 'lucide-react';
import { layerKey } from '@/remotion/layerContext';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LayerBlock {
  index: number;
  from: number;
  duration: number;
  name: string;
  /** Character offset of `<Sequence` in the source code. */
  startPos: number;
  /** Character offset just after `</Sequence>`. */
  endPos: number;
  source: string;
}

// ─── Parsing ──────────────────────────────────────────────────────────────────

/** Find the next `<Sequence` tag boundary (not a tag like `<SequenceX>`). */
function findNextSeqTag(code: string, from: number): number {
  let i = from;
  while (i < code.length) {
    const idx = code.indexOf('<Sequence', i);
    if (idx === -1) return -1;
    const next = code[idx + 9];
    if (next === ' ' || next === '\n' || next === '\t' || next === '\r' || next === '>' || next === '/') {
      return idx;
    }
    i = idx + 1;
  }
  return -1;
}

/** Given the position of `<` in `<Sequence`, return the offset just after the matching `</Sequence>`. */
function findMatchingClose(code: string, openPos: number): number {
  let i = openPos + 9; // skip '<Sequence'
  // Advance past opening tag's '>' checking for self-closing
  while (i < code.length) {
    if (code[i] === '/' && code[i + 1] === '>') return i + 2;
    if (code[i] === '>') { i++; break; }
    i++;
  }
  // Find matching </Sequence> accounting for nesting
  let depth = 1;
  while (i < code.length && depth > 0) {
    const nextOpen = findNextSeqTag(code, i);
    const nextClose = code.indexOf('</Sequence>', i);
    if (nextClose === -1) return code.length;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      i = nextOpen + 9;
    } else {
      depth--;
      i = nextClose + 11; // '</Sequence>'.length
    }
  }
  return i;
}

/** Pull the first piece of human-readable text out of a Sequence block's inner content. */
function extractName(inner: string, fallback: string): string {
  const patterns = [
    /<(?:h[1-6]|p|span|strong|em|text)(?:\s[^>]*)?>\s*([^<{][^<]{0,40}?)\s*<\//,
    /["']([A-Z][a-zA-Z0-9 ]{2,30})["']/,
  ];
  for (const p of patterns) {
    const m = inner.match(p);
    if (m?.[1]?.trim()) return m[1].trim().slice(0, 22);
  }
  return fallback;
}

export function parseLayerBlocks(code: string): LayerBlock[] {
  const blocks: LayerBlock[] = [];
  let i = 0;
  let idx = 0;
  // Track nesting — only surface top-level sequences as full blocks
  const depthStack: number[] = [];

  while (i < code.length) {
    const nextOpen = findNextSeqTag(code, i);
    const nextClose = code.indexOf('</Sequence>', i);

    // Determine which comes first
    const hasOpen = nextOpen !== -1;
    const hasClose = nextClose !== -1;

    if (!hasOpen && !hasClose) break;

    if (hasOpen && (!hasClose || nextOpen <= nextClose)) {
      // Opening tag
      if (depthStack.length === 0) {
        // Top-level: extract full block
        const startPos = nextOpen;
        const endPos = findMatchingClose(code, nextOpen);
        const source = code.slice(startPos, endPos);
        const openTag = source.match(/^<Sequence([\s\S]*?)>/)?.[1] ?? '';
        const fromM = openTag.match(/from=\{(\d+)\}/);
        const durM = openTag.match(/durationInFrames=\{(\d+)\}/);
        if (fromM && durM) {
          const from = parseInt(fromM[1]);
          const duration = parseInt(durM[1]);
          const innerStart = source.indexOf('>') + 1;
          const inner = source.slice(innerStart, source.length - 11);
          blocks.push({
            index: idx++,
            from,
            duration,
            name: extractName(inner, `Layer ${idx}`),
            startPos,
            endPos,
            source,
          });
        }
        i = endPos;
        continue;
      } else {
        depthStack.push(nextOpen);
        i = nextOpen + 9;
      }
    } else if (hasClose) {
      if (depthStack.length > 0) depthStack.pop();
      i = nextClose + 11;
    } else {
      break;
    }
  }

  return blocks;
}

/** Reorder blocks in source code by swapping their text regions. */
export function reorderBlocks(code: string, blocks: LayerBlock[], fromIdx: number, toIdx: number): string {
  if (fromIdx === toIdx || blocks.length < 2) return code;
  const sorted = [...blocks].sort((a, b) => a.startPos - b.startPos);
  const before = code.slice(0, sorted[0].startPos);
  const after = code.slice(sorted[sorted.length - 1].endPos);

  // Preserve separators (whitespace) between blocks
  const separators = sorted.slice(0, -1).map((b, i) => code.slice(b.endPos, sorted[i + 1].startPos));

  const sources = sorted.map((b) => b.source);
  const reordered = [...sources];
  const [moved] = reordered.splice(fromIdx, 1);
  reordered.splice(toIdx, 0, moved);

  return before + reordered.map((s, i) => s + (separators[i] ?? '')).join('') + after;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LAYER_COLORS = ['#C17B4F', '#5c9e53', '#4F7BC1', '#9e5c7a', '#c1b04f', '#4fc1a0'];

function formatRange(from: number, duration: number, fps: number): string {
  const start = (from / fps).toFixed(1);
  const end = ((from + duration) / fps).toFixed(1);
  return `${start}–${end}s`;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface LayerPanelProps {
  code: string;
  fps: number;
  hiddenLayers: Set<string>;
  onToggleVisibility: (key: string) => void;
  onReorder: (newCode: string) => void;
  onSelectLayer: (lineNumber: number) => void;
}

export function LayerPanel({ code, fps, hiddenLayers, onToggleVisibility, onReorder, onSelectLayer }: LayerPanelProps) {
  const blocks = useMemo(() => parseLayerBlocks(code), [code]);

  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, idx: number) => {
    setDragging(idx);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(idx);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, toIdx: number) => {
    e.preventDefault();
    if (dragging === null || dragging === toIdx) {
      setDragging(null);
      setDragOver(null);
      return;
    }
    const newCode = reorderBlocks(code, blocks, dragging, toIdx);
    onReorder(newCode);
    setDragging(null);
    setDragOver(null);
  }, [dragging, code, blocks, onReorder]);

  const handleDragEnd = useCallback(() => {
    setDragging(null);
    setDragOver(null);
  }, []);

  const handleSelect = useCallback((block: LayerBlock) => {
    setSelected(block.index);
    const lineNumber = code.slice(0, block.startPos).split('\n').length;
    onSelectLayer(lineNumber);
  }, [code, onSelectLayer]);

  if (blocks.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{
          background: 'rgba(193,123,79,0.08)',
          border: '1px solid rgba(193,123,79,0.15)',
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-[#C17B4F]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <div>
          <p className="text-[#bbb] text-sm font-medium mb-1">No layers yet</p>
          <p className="text-[#888884] text-xs leading-relaxed">
            Generate an animation with multiple scenes using{' '}
            <code className="text-[#C17B4F] text-[10px]">&lt;Sequence&gt;</code> to see layers here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
      <div className="p-2 space-y-0.5">
        {blocks.map((block, i) => {
          const key = layerKey(block.from, block.duration);
          const isHidden = hiddenLayers.has(key);
          const isDraggingThis = dragging === i;
          const isDropTarget = dragOver === i && dragging !== i;
          const isSelected = selected === block.index;
          const color = LAYER_COLORS[i % LAYER_COLORS.length];

          return (
            <div
              key={`${block.from}-${block.duration}-${i}`}
              draggable
              onDragStart={(e) => handleDragStart(e, i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={(e) => handleDrop(e, i)}
              onDragEnd={handleDragEnd}
              onClick={() => handleSelect(block)}
              className={`
                group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all select-none
                ${isDraggingThis ? 'opacity-40' : 'opacity-100'}
                ${isDropTarget ? 'ring-1 ring-[#C17B4F]/60 bg-[#C17B4F]/5' : ''}
                ${isSelected ? 'bg-[#1e1e1c] ring-1 ring-[#3a3a38]' : 'hover:bg-[#1a1a18]'}
              `}
            >
              {/* Drag handle */}
              <GripVertical className="w-3.5 h-3.5 text-[#2e2e2c] group-hover:text-[#555553] transition-colors shrink-0 cursor-grab active:cursor-grabbing" />

              {/* Color dot */}
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />

              {/* Name */}
              <span
                className="flex-1 text-xs truncate"
                style={{ color: isHidden ? '#3a3a38' : '#bbb' }}
              >
                {block.name}
              </span>

              {/* Timing badge */}
              <span className="text-[10px] tabular-nums text-[#3a3a38] group-hover:text-[#555553] transition-colors shrink-0 font-mono">
                {formatRange(block.from, block.duration, fps)}
              </span>

              {/* Visibility toggle */}
              <button
                onClick={(e) => { e.stopPropagation(); onToggleVisibility(key); }}
                className="shrink-0 text-[#3a3a38] hover:text-[#888884] transition-colors p-0.5 rounded"
                title={isHidden ? 'Show layer' : 'Hide layer'}
              >
                {isHidden
                  ? <EyeOff className="w-3.5 h-3.5" />
                  : <Eye className="w-3.5 h-3.5" />
                }
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="px-4 pb-3 mt-auto pt-2 border-t border-[#1f1f1d]">
        <p className="text-[10px] text-[#3a3a38] leading-relaxed">
          Drag to reorder · Click to go to code · Eye to hide
        </p>
      </div>
    </div>
  );
}
