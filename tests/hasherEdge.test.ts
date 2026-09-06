import { describe, it, expect } from 'vitest';
import { md5, spotifyHex } from '../src/utils/Hasher';

describe('spotifyHex edge cases', () => {
  it('maps empty string to zero-padded hex', () => {
    expect(spotifyHex('')).toBe('00000000000000000000000000000000');
  });

  it('maps base62 digits to their numeric value', () => {
    expect(spotifyHex('1')).toBe('00000000000000000000000000000001');
    expect(spotifyHex('z')).toBe('00000000000000000000000000000023');
  });

  it('is deterministic for the same id', () => {
    const id = '4cOdK2wGLETKBW3PvgPWqT';
    expect(spotifyHex(id)).toBe(spotifyHex(id));
  });
});

describe('md5 edge cases', () => {
  it('returns 32 lowercase hex chars for unicode input', () => {
    const hash = md5('こんにちは');
    expect(hash).toHaveLength(32);
    expect(/^[0-9a-f]{32}$/.test(hash)).toBe(true);
  });

  it('differs for different inputs', () => {
    expect(md5('a')).not.toBe(md5('b'));
  });
});
