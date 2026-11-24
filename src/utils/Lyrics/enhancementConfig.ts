import storage from '../storage';
import { StorageKeys } from '../storageKeys';
import type { LyricsDocument } from './conversion';

export function getEnhancementConfigRevision(): number {
  const raw = storage.get(StorageKeys.ENHANCEMENT_CONFIG_REVISION);
  const revision = Number(raw);
  return Number.isSafeInteger(revision) && revision >= 0 ? revision : 0;
}

export function bumpEnhancementConfigRevision(): number {
  const revision = getEnhancementConfigRevision() + 1;
  storage.set(StorageKeys.ENHANCEMENT_CONFIG_REVISION, String(revision));
  return revision;
}

export function isEnhancementComplete(document: LyricsDocument): boolean {
  return (
    document.enhancementStatus === 'complete' &&
    document.enhancementConfigRevision === getEnhancementConfigRevision()
  );
}
