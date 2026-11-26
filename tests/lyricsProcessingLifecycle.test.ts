import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/utils/Lyrics/cache', () => ({
  cacheLyrics: vi.fn(async () => undefined),
}));
vi.mock('../src/utils/Lyrics/ai', () => ({
  enhanceLyrics: vi.fn(),
}));
vi.mock('../src/utils/Lyrics/publish', () => ({
  isCurrentLyricsRequest: vi.fn(() => true),
  publishEnhancedLyrics: vi.fn(() => true),
}));
vi.mock('../src/utils/Lyrics/ui', () => ({
  ShowProcessingIndicator: vi.fn(),
  EnsureProcessingIndicatorHidden: vi.fn(),
}));

import storage from '../src/utils/storage';
import { StorageKeys } from '../src/utils/storageKeys';
import { cacheLyrics } from '../src/utils/Lyrics/cache';
import { enhanceLyrics } from '../src/utils/Lyrics/ai';
import { isCurrentLyricsRequest, publishEnhancedLyrics } from '../src/utils/Lyrics/publish';
import { enhancePreparedLyrics, processAndEnhanceLyrics } from '../src/utils/Lyrics/processing';
import {
  bumpEnhancementConfigRevision,
  getEnhancementConfigRevision,
} from '../src/utils/Lyrics/enhancementConfig';
import type { LyricsDocument } from '../src/utils/Lyrics/conversion';

function preparedDocument(): LyricsDocument {
  return { type: 'Static', lines: [{ text: 'line', raw: 'line' }] };
}

beforeEach(() => {
  vi.clearAllMocks();
  storage.set(StorageKeys.ENHANCEMENT_CONFIG_REVISION, null);
  vi.mocked(isCurrentLyricsRequest).mockReturnValue(true);
  vi.mocked(publishEnhancedLyrics).mockReturnValue(true);
});

describe('lyrics enhancement lifecycle', () => {
  it('marks a completed document and persists the same instance', async () => {
    const document = preparedDocument();
    vi.mocked(enhanceLyrics).mockImplementation(async (value) => {
      value.lines[0]!.translation = 'translated';
      return value;
    });

    await enhancePreparedLyrics(1, 'trackA', document);

    expect(document.enhancementStatus).toBe('complete');
    expect(document.enhancementConfigRevision).toBe(getEnhancementConfigRevision());
    expect(cacheLyrics).toHaveBeenCalledWith('trackA', document, 1);
    expect(publishEnhancedLyrics).toHaveBeenCalledWith(1, 'trackA', document);
  });

  it('skips a document that already completed enhancement', async () => {
    const document = {
      ...preparedDocument(),
      enhancementStatus: 'complete' as const,
      enhancementConfigRevision: getEnhancementConfigRevision(),
    };

    await enhancePreparedLyrics(1, 'trackA', document);

    expect(enhanceLyrics).not.toHaveBeenCalled();
    expect(cacheLyrics).not.toHaveBeenCalled();
    expect(publishEnhancedLyrics).not.toHaveBeenCalled();
  });

  it('does not persist or publish when currency is lost after the policy settles', async () => {
    const document = preparedDocument();
    vi.mocked(enhanceLyrics).mockImplementation(async (value) => {
      vi.mocked(isCurrentLyricsRequest).mockReturnValue(false);
      return value;
    });

    await enhancePreparedLyrics(1, 'trackA', document);

    expect(document.enhancementStatus).not.toBe('complete');
    expect(cacheLyrics).not.toHaveBeenCalled();
    expect(publishEnhancedLyrics).not.toHaveBeenCalled();
  });

  it('does not persist completion when settings are invalidated during the policy', async () => {
    const document = preparedDocument();
    vi.mocked(enhanceLyrics).mockImplementation(async (value) => {
      bumpEnhancementConfigRevision();
      return value;
    });

    await enhancePreparedLyrics(1, 'trackA', document);

    expect(document.enhancementStatus).not.toBe('complete');
    expect(cacheLyrics).not.toHaveBeenCalled();
    expect(publishEnhancedLyrics).not.toHaveBeenCalled();
  });

  it('returns prepared lyrics without starting enhancement in the producer', async () => {
    const document = await processAndEnhanceLyrics(
      'trackA',
      { id: 'trackA', Type: 'Static', Lines: [{ Text: 'line' }] },
      1,
    );

    expect(document.enhancementStatus).toBe('pending');
    expect(document.enhancementConfigRevision).toBe(getEnhancementConfigRevision());
    expect(enhanceLyrics).not.toHaveBeenCalled();
    expect(cacheLyrics).toHaveBeenCalledTimes(1);
    expect(cacheLyrics).toHaveBeenCalledWith('trackA', document, 1);
  });

  it('does not persist prepared lyrics for a stale request', async () => {
    vi.mocked(isCurrentLyricsRequest).mockReturnValue(false);

    await processAndEnhanceLyrics(
      'trackA',
      { id: 'trackA', Type: 'Static', Lines: [{ Text: 'line' }] },
      1,
    );

    expect(cacheLyrics).not.toHaveBeenCalled();
  });
});
