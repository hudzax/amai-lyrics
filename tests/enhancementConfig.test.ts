import { beforeEach, describe, expect, it } from 'vitest';
import storage from '../src/utils/storage';
import { StorageKeys } from '../src/utils/storageKeys';
import {
  bumpEnhancementConfigRevision,
  getEnhancementConfigRevision,
  isEnhancementComplete,
} from '../src/utils/Lyrics/enhancementConfig';
import type { LyricsDocument } from '../src/utils/Lyrics/conversion';

function document(revision?: number): LyricsDocument {
  return {
    type: 'Static',
    enhancementStatus: 'complete',
    enhancementConfigRevision: revision,
    lines: [{ text: 'line' }],
  };
}

beforeEach(() => {
  storage.set(StorageKeys.ENHANCEMENT_CONFIG_REVISION, null);
});

describe('enhancement configuration revision', () => {
  it('defaults to zero and advances durably', () => {
    expect(getEnhancementConfigRevision()).toBe(0);
    expect(bumpEnhancementConfigRevision()).toBe(1);
    expect(getEnhancementConfigRevision()).toBe(1);
  });

  it('accepts completion only for the current revision', () => {
    bumpEnhancementConfigRevision();

    expect(isEnhancementComplete(document(1))).toBe(true);
    expect(isEnhancementComplete(document(0))).toBe(false);
    expect(isEnhancementComplete(document())).toBe(false);
  });

  it('does not accept pending documents', () => {
    const pending: LyricsDocument = {
      type: 'Static',
      enhancementStatus: 'pending',
      enhancementConfigRevision: getEnhancementConfigRevision(),
      lines: [{ text: 'line' }],
    };

    expect(isEnhancementComplete(pending)).toBe(false);
  });
});
