import { describe, it, expect } from 'vitest';
import { convertLyrics } from '../src/utils/Lyrics/conversion';

describe('convertLyrics', () => {
  it('converts single lead syllables joined', () => {
    const data = [
      {
        Type: 'line',
        OppositeAligned: false,
        Lead: {
          StartTime: 0,
          EndTime: 1000,
          Syllables: [
            { Text: 'hel', IsPartOfWord: true },
            { Text: 'lo', IsPartOfWord: false },
            { Text: 'world', IsPartOfWord: false },
          ],
        },
      },
    ];
    const result = convertLyrics(data as never);
    expect(result[0].Text).toBe('hello world');
    expect(result[0].StartTime).toBe(0);
    expect(result[0].EndTime).toBe(1000);
  });

  it('handles Japanese no space between kanji', () => {
    const data = [
      {
        Type: 'line',
        OppositeAligned: false,
        Lead: {
          StartTime: 0,
          EndTime: 1000,
          Syllables: [{ Text: 'こん' }, { Text: 'にちは' }],
        },
      },
    ];
    const result = convertLyrics(data as never);
    // Japanese regex joins without space
    expect(result[0].Text).toBe('こんにちは');
  });

  it('handles background vocals', () => {
    const data = [
      {
        Type: 'line',
        OppositeAligned: false,
        Lead: {
          StartTime: 100,
          EndTime: 200,
          Syllables: [{ Text: 'lead' }],
        },
        Background: [
          {
            StartTime: 50,
            EndTime: 250,
            Syllables: [{ Text: 'bg' }],
          },
        ],
      },
    ];
    const result = convertLyrics(data as never);
    expect(result[0].Text).toContain('lead');
    expect(result[0].Text).toContain('bg');
    expect(result[0].StartTime).toBe(50);
    expect(result[0].EndTime).toBe(250);
  });

  it('returns empty text for invalid lead', () => {
    const data = [{ Type: 'line', OppositeAligned: false, Lead: null } as never];
    const result = convertLyrics(data);
    expect(result[0].Text).toBe('');
  });

  it('produces empty array for empty input', () => {
    expect(convertLyrics([])).toEqual([]);
  });
});
