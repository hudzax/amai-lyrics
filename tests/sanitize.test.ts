import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  sanitizeRubyHtml,
  createRubyFragment,
  setSafeRubyHtml,
} from '../src/utils/sanitize';

describe('escapeHtml', () => {
  it('escapes ampersand and brackets and quotes', () => {
    expect(escapeHtml('&<>"\'')).toBe('&amp;&lt;&gt;&quot;&#39;');
  });
  it('leaves plain text unchanged', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });
});

describe('sanitizeRubyHtml', () => {
  it('restores allowed ruby/rt tags', () => {
    const input = 'a<ruby>b<rt>c</rt></ruby>d';
    const result = sanitizeRubyHtml(input);
    expect(result).toBe('a<ruby>b<rt>c</rt></ruby>d');
  });

  it('keeps escaped script tags', () => {
    const input = '<script>alert(1)</script>';
    const result = sanitizeRubyHtml(input);
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  it('allows romaja class', () => {
    const input = '<ruby class="romaja">\uD55C\uAE00<rt>hangeul</rt></ruby>';
    const result = sanitizeRubyHtml(input);
    expect(result).toBe('<ruby class="romaja">\uD55C\uAE00<rt>hangeul</rt></ruby>');
  });

  it('escapes unknown tags even if they look like ruby', () => {
    const input = '<ruby onclick="evil()">x</ruby>';
    const result = sanitizeRubyHtml(input);
    // Should NOT restore as real <ruby> tag (must stay escaped)
    expect(result).not.toContain('<ruby onclick');
    expect(result).toContain('&lt;ruby');
    // Escaped payload is inert — verify no executable ruby element with attribute is created
    const frag = createRubyFragment(input);
    const el = document.createElement('div');
    el.appendChild(frag);
    const ruby = el.querySelector('ruby');
    expect(ruby).toBeNull(); // malicious ruby is escaped, not parsed
  });
});

describe('createRubyFragment', () => {
  it('creates fragment with ruby nodes', () => {
    const frag = createRubyFragment(
      'hello<ruby>\u6F22\u5B57<rt>\u304B\u3093\u3058</rt></ruby>world',
    );
    const container = document.createElement('div');
    container.appendChild(frag);
    expect(container.querySelector('ruby')).not.toBeNull();
    expect(container.querySelector('rt')?.textContent).toBe('\u304B\u3093\u3058');
    expect(container.textContent).toContain('hello');
    expect(container.textContent).toContain('world');
  });

  it('does not create script elements', () => {
    const frag = createRubyFragment('<script>alert(1)</script>hi');
    const container = document.createElement('div');
    container.appendChild(frag);
    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).toContain('hi');
  });
});

describe('setSafeRubyHtml', () => {
  it('clears existing children before inserting', () => {
    const el = document.createElement('div');
    el.textContent = 'old';
    setSafeRubyHtml(el, 'new<ruby>a<rt>b</rt></ruby>');
    expect(el.textContent).not.toContain('old');
    expect(el.querySelector('ruby')).not.toBeNull();
  });
});
