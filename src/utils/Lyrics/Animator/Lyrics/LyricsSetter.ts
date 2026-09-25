import Defaults from '../../../../components/Global/Defaults';
import { LyricsObject } from '../../lyrics';
import type { PaintedDot, TimedPaintedLine } from '../../lyrics';
import { timeOffset } from '../Shared';
import { findActiveIndex } from '../../findActiveIndex';

function getStatus(start: number, end: number, current: number): 'Active' | 'NotSung' | 'Sung' {
  if (start <= current && current <= end) {
    return 'Active';
  } else if (start >= current) {
    return 'NotSung';
  } else {
    return 'Sung';
  }
}

function updateCollectionStatus(collection: PaintedDot[], current: number) {
  for (const item of collection) {
    item.status = getStatus(item.StartTime, item.EndTime, current);
  }
}

// Cache last active index so we only touch lines whose visible status actually flips.
let lastActiveIndex = -1;
let lastCachedLength = -1;

export function resetLyricsSetterCache(): void {
  lastActiveIndex = -1;
  lastCachedLength = -1;
}

function applyNoActive(tLines: TimedPaintedLine[], pos: number): void {
  for (const line of tLines) {
    const next =
      line.StartTime <= pos && pos <= line.EndTime
        ? 'Active'
        : line.StartTime >= pos
          ? 'NotSung'
          : 'Sung';
    if (line.status !== next) line.status = next;
  }
  lastActiveIndex = -1;
}

function applyDelta(tLines: TimedPaintedLine[], activeIndex: number, pos: number): void {
  if (lastActiveIndex === -1) {
    for (let i = 0; i < tLines.length; i++) {
      const line = tLines[i]!;
      const next = i === activeIndex ? 'Active' : i < activeIndex ? 'Sung' : 'NotSung';
      if (line.status !== next) line.status = next;
    }
  } else if (activeIndex > lastActiveIndex) {
    const prev = tLines[lastActiveIndex]!;
    if (prev.status !== 'Sung') prev.status = 'Sung';
    for (let i = lastActiveIndex + 1; i < activeIndex; i++) {
      const line = tLines[i]!;
      if (line.status !== 'Sung') line.status = 'Sung';
    }
    const cur = tLines[activeIndex]!;
    if (cur.status !== 'Active') cur.status = 'Active';
  } else {
    const prev = tLines[lastActiveIndex]!;
    if (prev.status !== 'NotSung') prev.status = 'NotSung';
    for (let i = activeIndex + 1; i <= lastActiveIndex - 1; i++) {
      const line = tLines[i]!;
      const next = tLines[i]!.StartTime >= pos ? 'NotSung' : 'Sung';
      if (line.status !== next) line.status = next;
    }
    const cur = tLines[activeIndex]!;
    if (cur.status !== 'Active') cur.status = 'Active';
  }
  const activeLine = tLines[activeIndex]!;
  if (activeLine.dots) updateCollectionStatus(activeLine.dots, pos);
  lastActiveIndex = activeIndex;
}

export function TimeSetter(PreCurrentPosition: number) {
  const CurrentPosition = PreCurrentPosition + timeOffset;
  // The registry holds rows of both payload kinds; only line-synced ones carry
  // timing, and only they can be searched.
  if (Defaults.CurrentLyricsType !== 'Line') return;

  const lines = LyricsObject.Lines;
  if (!lines.length) return;
  if (lines.length !== lastCachedLength) {
    lastActiveIndex = -1;
    lastCachedLength = lines.length;
  }
  // SAFETY: renderLineRows fills StartTime/EndTime for every row of a
  // line-synced document.
  const tLines = lines as TimedPaintedLine[];
  const activeIndex = findActiveIndex(tLines, CurrentPosition);
  if (activeIndex !== -1 && activeIndex === lastActiveIndex) {
    const al = tLines[activeIndex]!;
    if (al.dots) updateCollectionStatus(al.dots, CurrentPosition);
    return;
  }
  if (activeIndex === -1) {
    applyNoActive(tLines, CurrentPosition);
    return;
  }
  applyDelta(tLines, activeIndex, CurrentPosition);
}

export function getActiveLineIndex(): number {
  return lastActiveIndex;
}
