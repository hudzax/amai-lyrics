import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The Amai settings sections are rendered by the vendored `spcr-settings`
 * package directly into Spotify's preferences page. Spotify 1.3.x hashed the
 * Encore class names that markup copies, so its look now comes entirely from
 * `src/css/Settings.css`.
 *
 * These tests keep the two files in sync: a hook class the renderer emits
 * without a matching rule is exactly the regression that made the rows
 * collapse, the toggles turn into bare checkboxes and the dropdowns fall back
 * to raw browser styling.
 */
const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');

const css = read('src/css/Settings.css');
const renderer = read('src/edited_packages/spcr-settings/settingsSection.tsx');

/**
 * Hooks that are intentionally styled through an element selector instead of
 * their class: the field renderer puts Spotify's own hashed `Button-*` classes
 * in the same className string, so `... button` is the only safe match.
 */
const VIA_ELEMENT_SELECTOR = new Set(['x-settings-button']);

/** Every Amai hook class the vendored field renderer puts in the DOM. */
function emittedHookClasses(): string[] {
  const hooks = new Set<string>();
  for (const match of renderer.matchAll(/"([^"]+)"/g)) {
    for (const token of match[1].split(/\s+/)) {
      if (/^(x-settings|x-toggle|amai-settings)/.test(token)) hooks.add(token);
    }
  }
  return [...hooks].sort();
}

describe('Settings.css', () => {
  it('styles every hook class the settings renderer emits', () => {
    const hooks = emittedHookClasses();
    // Guards against the extractor silently matching nothing.
    expect(hooks).toContain('x-settings-row');
    expect(hooks).toContain('x-toggle-indicator');

    const unstyled = hooks.filter(
      (hook) => !VIA_ELEMENT_SELECTOR.has(hook) && !css.includes(`.${hook}`),
    );
    expect(unstyled).toEqual([]);
  });

  it('stays scoped to the three Amai sections', () => {
    for (const id of ['#amai-settings', '#amai-dev-settings', '#amai-info']) {
      expect(css).toContain(id);
    }
  });

  it('lays rows out like the native 2fr/1fr settings grid', () => {
    expect(css).toMatch(/grid-template-columns:\s*2fr 1fr/);
  });

  it('sizes the toggle track and knob so the switch cannot collapse', () => {
    expect(css).toMatch(/\.x-toggle-indicatorWrapper\s*\{[^}]*width:\s*42px;[^}]*height:\s*24px;/s);
    expect(css).toMatch(/\.x-toggle-indicator\s*\{[^}]*width:\s*20px;[^}]*height:\s*20px;/s);
    // Checked state must move the knob instead of leaving it on the left.
    expect(css).toMatch(
      /\.x-toggle-input:checked[\s\S]*?\.x-toggle-indicator\s*\{[^}]*right:\s*2px;/,
    );
  });

  it('gives every row a hover wash that cannot shift layout', () => {
    expect(css).toMatch(/\.x-settings-row:hover\s*\{[^}]*background-color:/s);
    // The resting row must already carry padding + radius so the hover tint
    // fades in without moving content.
    expect(css).toMatch(/\.x-settings-row\s*\{[^}]*padding:[^}]*border-radius:/s);
  });

  it('highlights the Enable Amai Theme row through its toggle id', () => {
    // Rows carry no per-field class; the feature styling hooks the toggle's
    // element id (amai-settings.enableAppBackground).
    expect(css).toContain('enableAppBackground');
    expect(css).toContain(':has(#amai-settings\\.enableAppBackground)');
  });
});
