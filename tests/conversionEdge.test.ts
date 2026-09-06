import { describe, it, expect, vi, afterEach } from 'vitest';
import { convertLyrics } from '../src/utils/Lyrics/conversion';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('convertLyrics edge cases', () => {
  it('preserves Type and OppositeAligned', () => {
    const result = convertLyrics([
      {
        Type: 'vocal',
        OppositeAligned: true,
        Lead: { StartTime: 5, EndTime: 10, Syllables: [{ Text: 'hey' }] },
      },
    ]);
    expect(result[0].Type).toBe('vocal');
    expect(result[0].OppositeAligned).toBe(true);
    expect(result[0].Text).toBe('hey');
  });

  it('joins a multi-syllable word without spaces', () => {
    const result = convertLyrics([
      {
        Type: 'line',
        OppositeAligned: false,
        Lead: {
          StartTime: 0,
          EndTime: 100,
          Syllables: [
            { Text: 'un', IsPartOfWord: true },
            { Text: 'be', IsPartOfWord: true },
            { Text: 'lievable', IsPartOfWord: false },
          ],
        },
      },
    ]);
    expect(result[0].Text).toBe('unbelievable');
  });

  it('keeps lead times when backgrounds carry no timestamps', () => {
    const result = convertLyrics([
      {
        Type: 'line',
        OppositeAligned: false,
        Lead: { StartTime: 100, EndTime: 200, Syllables: [{ Text: 'lead' }] },
        Background: [{ Syllables: [{ Text: 'bg' }] }],
      },
    ]);
    expect(result[0].StartTime).toBe(100);
    expect(result[0].EndTime).toBe(200);
    expect(result[0].Text).toBe('lead (bg)');
  });

  it('joins multiple backgrounds with spaces', () => {
    const result = convertLyrics([
      {
        Type: 'line',
        OppositeAligned: false,
        Lead: { StartTime: 0, EndTime: 100, Syllables: [{ Text: 'lead' }] },
        Background: [
          { StartTime: 0, EndTime: 100, Syllables: [{ Text: 'one' }] },
          { StartTime: 0, EndTime: 100, Syllables: [{ Text: 'two' }] },
        ],
      },
    ]);
    expect(result[0].Text).toBe('lead (one two)');
  });

  it('produces empty text for an empty syllable list', () => {
    const result = convertLyrics([
      {
        Type: 'line',
        OppositeAligned: false,
        Lead: { StartTime: 7, EndTime: 9, Syllables: [] },
      },
    ]);
    expect(result[0].Text).toBe('');
    expect(result[0].StartTime).toBe(7);
    expect(result[0].EndTime).toBe(9);
  });

  it('logs an error for missing syllables', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = convertLyrics([
      { Type: 'line', OppositeAligned: false, Lead: { StartTime: 0, EndTime: 0 } } as never,
    ]);
    expect(result[0].Text).toBe('');
    expect(err).toHaveBeenCalled();
  });
});
