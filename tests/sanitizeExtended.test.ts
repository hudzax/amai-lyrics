import { describe, it, expect } from 'vitest';
import { replaceMainTextKeepTranslation } from '../src/utils/sanitize';

describe('replaceMainTextKeepTranslation', () => {
  it('replaces main text while preserving the translation text', () => {
    const line = document.createElement('div');
    line.textContent = 'old main';
    const translation = document.createElement('div');
    translation.classList.add('translation');
    translation.textContent = 'old translation';
    line.appendChild(translation);

    replaceMainTextKeepTranslation(line, 'new<ruby>漢字<rt>かんじ</rt></ruby>');

    expect(line.querySelector('ruby')).not.toBeNull();
    expect(line.querySelector('rt')?.textContent).toBe('かんじ');
    expect(line.querySelector('.translation')?.textContent).toBe('old translation');
    expect(line.textContent).not.toContain('old main');
  });

  it('works when there is no translation node', () => {
    const line = document.createElement('div');
    line.textContent = 'plain old';
    replaceMainTextKeepTranslation(line, 'brand new');
    expect(line.textContent).toBe('brand new');
    expect(line.querySelector('.translation')).toBeNull();
  });

  it('re-adds an empty translation node to preserve structure', () => {
    const line = document.createElement('div');
    line.textContent = 'main';
    const translation = document.createElement('div');
    translation.classList.add('translation');
    line.appendChild(translation);

    replaceMainTextKeepTranslation(line, 'updated');

    const after = line.querySelector('.translation');
    expect(after).not.toBeNull();
    expect(after?.textContent).toBe('');
  });

  it('sanitizes malicious markup in the replacement', () => {
    const line = document.createElement('div');
    replaceMainTextKeepTranslation(line, '<script>alert(1)</script>hi');
    expect(line.querySelector('script')).toBeNull();
    expect(line.textContent).toContain('hi');
  });
});
