import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The Amai Theme settings (src/utils/ThemeSettings.ts) publish root-level
 * `--amai-bg-*-scale` factors that `sweet-dynamic-bg.css` consumes via
 * `calc(value * var(..., 1))`. These static assertions keep the stylesheet
 * hooked to those vars: an edit that re-hardcodes a value or an animation
 * duration silently detaches the user presets from that surface, which is
 * exactly the regression nothing else would catch.
 */
const root = process.cwd();
const css = readFileSync(join(root, 'src/css/DynamicBG/sweet-dynamic-bg.css'), 'utf8');

describe('sweet-dynamic-bg.css theme-setting hooks', () => {
  it('consumes every ThemeSettings scale var with a neutral fallback', () => {
    expect(css).toContain('var(--amai-bg-blur-scale, 1)');
    expect(css).toContain('var(--amai-bg-saturation-scale, 1)');
    expect(css).toContain('var(--amai-bg-brightness-scale, 1)');
    expect(css).toContain('var(--amai-bg-motion-scale, 1)');
  });

  it('freezes the CSS layers through the motion-off class', () => {
    expect(css).toContain('.amai-bg-motion-off .sweet-dynamic-bg');
    expect(css).toContain('animation-play-state: paused');
  });

  it('rides the motion scale on every background animation duration', () => {
    // Any `animation:`/`animation-duration:` declaration carrying a literal
    // duration must go through the motion scale, so a future hardcoded
    // duration cannot silently ignore the Off/Slow/Fast setting. The match
    // runs to the semicolon so the var() fallback inside calc() is included.
    const unscaled = [...css.matchAll(/animation(?:-duration)?:\s*[^;]+;/g)]
      .map((match) => match[0])
      .filter(
        (declaration) =>
          /\d+(?:\.\d+)?s/.test(declaration) && !declaration.includes('var(--amai-bg-motion-scale'),
      );
    expect(unscaled).toEqual([]);
  });
});
