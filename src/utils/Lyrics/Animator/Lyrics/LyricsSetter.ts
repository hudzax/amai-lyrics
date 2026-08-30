import Defaults from '../../../../components/Global/Defaults';
import { LyricsObject } from '../../lyrics';
import { timeOffset } from '../Shared';

function getStatus(start: number, end: number, current: number): 'Active' | 'NotSung' | 'Sung' {
  if (start <= current && current <= end) {
    return 'Active';
  } else if (start >= current) {
    return 'NotSung';
  } else {
    return 'Sung';
  }
}

interface WordOrSyllable {
  StartTime: number;
  EndTime: number;
  Status?: 'Active' | 'NotSung' | 'Sung';
}

function updateCollectionStatus(collection: WordOrSyllable[], current: number) {
  for (const item of collection) {
    item.Status = getStatus(item.StartTime, item.EndTime, current);
  }
}

// Cache last active index so we only touch lines whose visible status actually flips.
let lastActiveIndex = -1;
let lastCachedLength = -1;

export function resetLyricsSetterCache(): void {
  lastActiveIndex = -1;
  lastCachedLength = -1;
}

type LineLike = {
  StartTime: number;
  EndTime: number;
  Status?: string;
  DotLine?: boolean;
  Syllables?: { Lead: WordOrSyllable[] };
};

function binarySearchActive(tLines: LineLike[], pos: number): number {
  let lo = 0;
  let hi = tLines.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const line = tLines[mid]!;
    if (line.StartTime <= pos && pos <= line.EndTime) return mid;
    if (pos < line.StartTime) hi = mid - 1;
    else lo = mid + 1;
  }
  return -1;
}

function applyNoActive(tLines: LineLike[], pos: number): void {
  for (const line of tLines) {
    const next =
      line.StartTime <= pos && pos <= line.EndTime
        ? 'Active'
        : line.StartTime >= pos
          ? 'NotSung'
          : 'Sung';
    if (line.Status !== next) line.Status = next;
  }
  lastActiveIndex = -1;
}

function applyDelta(tLines: LineLike[], activeIndex: number, pos: number): void {
  if (lastActiveIndex === -1) {
    for (let i = 0; i < tLines.length; i++) {
      const line = tLines[i]!;
      const next = i === activeIndex ? 'Active' : i < activeIndex ? 'Sung' : 'NotSung';
      if (line.Status !== next) line.Status = next;
    }
  } else if (activeIndex > lastActiveIndex) {
    const prev = tLines[lastActiveIndex]!;
    if (prev.Status !== 'Sung') prev.Status = 'Sung';
    for (let i = lastActiveIndex + 1; i < activeIndex; i++) {
      const line = tLines[i]!;
      if (line.Status !== 'Sung') line.Status = 'Sung';
    }
    const cur = tLines[activeIndex]!;
    if (cur.Status !== 'Active') cur.Status = 'Active';
  } else {
    const prev = tLines[lastActiveIndex]!;
    if (prev.Status !== 'NotSung') prev.Status = 'NotSung';
    for (let i = activeIndex + 1; i <= lastActiveIndex - 1; i++) {
      const line = tLines[i]!;
      const next = tLines[i]!.StartTime >= pos ? 'NotSung' : 'Sung';
      if (line.Status !== next) line.Status = next;
    }
    const cur = tLines[activeIndex]!;
    if (cur.Status !== 'Active') cur.Status = 'Active';
  }
  const activeLine = tLines[activeIndex]!;
  if (activeLine.DotLine) updateCollectionStatus(activeLine.Syllables!.Lead, pos);
  lastActiveIndex = activeIndex;
}

export function TimeSetter(PreCurrentPosition: number) {
  const CurrentPosition = PreCurrentPosition + timeOffset;
  const CurrentLyricsType = Defaults.CurrentLyricsType;
  if (CurrentLyricsType && CurrentLyricsType === 'None') return;
  const lines = LyricsObject.Types[CurrentLyricsType]?.Lines;
  if (!lines) return;
  if (CurrentLyricsType !== 'Line') return;
  if (lines.length !== lastCachedLength) {
    lastActiveIndex = -1;
    lastCachedLength = lines.length;
  }
  // SAFETY: Lines from SpikyCache/network JSON; conversion.ts guarantees StartTime/EndTime for Line type
  const tLines = lines as unknown as LineLike[];
  const activeIndex = binarySearchActive(tLines, CurrentPosition);
  if (activeIndex !== -1 && activeIndex === lastActiveIndex) {
    const al = tLines[activeIndex]!;
    if (al.DotLine) updateCollectionStatus(al.Syllables!.Lead, CurrentPosition);
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
