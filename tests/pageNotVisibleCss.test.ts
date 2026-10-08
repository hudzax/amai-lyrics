import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The "Page Not Visible" height fix must cover the main-view ROOT on both DOM
 * generations — `#main-view` (the id Spicetify injects during preprocessing,
 * live on 1.3.3) and `.Root__main-view` (pre-1.3.3, kept as an alias) — plus
 * the legacy `.main-content-view`. The root was silently dropped from this rule
 * once, leaving the lyrics page mounted with no height; nothing else catches
 * that because the page still renders — just collapsed.
 */
const root = process.cwd();
const css = readFileSync(join(root, 'src/css/default.css'), 'utf8');

describe('default.css Page-Not-Visible height rule', () => {
  it('covers the main-view root on both DOM generations', () => {
    expect(css).toContain('body:has(#AmaiLyricsPage) #main-view,');
    expect(css).toContain('body:has(#AmaiLyricsPage) .Root__main-view,');
  });

  it('keeps the legacy content wrapper and the container chain covered', () => {
    expect(css).toContain('body:has(#AmaiLyricsPage) .main-content-view,');
    expect(css).toContain('body:has(#AmaiLyricsPage) .main-view-container,');
    expect(css).toContain('body:has(#AmaiLyricsPage) .main-view-container__scroll-node,');
    expect(css).toContain(
      'body:has(#AmaiLyricsPage) .main-view-container div[data-overlayscrollbars-viewport]',
    );
  });
});
