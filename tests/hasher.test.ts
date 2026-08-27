import { describe, it, expect } from 'vitest';
import { md5, spotifyHex } from '../src/utils/Hasher';

describe('md5', () => {
  it('produces known hash for hello', () => {
    expect(md5('hello')).toBe('5d41402abc4b2a76b9719d911017c592');
  });
  it('empty string hash', () => {
    expect(md5('')).toBe('d41d8cd98f00b204e9800998ecf8427e');
  });
});

describe('spotifyHex', () => {
  it('converts base62 to hex padded to 32', () => {
    // Known mapping: base62 '0' -> hex '0' padded
    const result = spotifyHex('0');
    expect(result).toBe('00000000000000000000000000000000');
  });
  it('throws on invalid char', () => {
    expect(() => spotifyHex('!')).toThrow();
  });
  it('handles typical spotify id length', () => {
    const id = '4cOdK2wGLETKBW3PvgPWqT'; // 22 chars typical
    const hex = spotifyHex(id);
    expect(hex.length).toBe(32);
    expect(/^[0-9a-f]{32}$/.test(hex)).toBe(true);
  });
});
