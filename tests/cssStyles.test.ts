import { describe, it, expect } from 'vitest';
import { applyStyles, removeAllStyles } from '../src/utils/CSS/Styles';

describe('applyStyles', () => {
  it('applies style properties and returns true', () => {
    const el = document.createElement('div');
    expect(applyStyles(el, { color: 'red', 'font-size': '12px' })).toBe(true);
    expect(el.style.getPropertyValue('color')).toBe('red');
    expect(el.style.getPropertyValue('font-size')).toBe('12px');
  });

  it('stringifies numeric values', () => {
    const el = document.createElement('div');
    expect(applyStyles(el, { opacity: 0.5 })).toBe(true);
    expect(el.style.getPropertyValue('opacity')).toBe('0.5');
  });

  it('returns false for missing elements', () => {
    expect(applyStyles(null, { color: 'red' })).toBe(false);
    expect(applyStyles(undefined, { color: 'red' })).toBe(false);
  });
});

describe('removeAllStyles', () => {
  it('removes the inline style attribute and returns true', () => {
    const el = document.createElement('div');
    applyStyles(el, { color: 'red' });
    expect(el.hasAttribute('style')).toBe(true);
    expect(removeAllStyles(el)).toBe(true);
    expect(el.hasAttribute('style')).toBe(false);
  });

  it('returns false for missing elements', () => {
    expect(removeAllStyles(null)).toBe(false);
    expect(removeAllStyles(undefined)).toBe(false);
  });
});
