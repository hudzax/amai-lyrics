import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PageViewSelectors } from '../src/constants/PageViewSelectors';

/**
 * The ownership pin for the extension's own page DOM.
 *
 * Spotify's DOM has the SpotifyDomContract (tests/spotifyDomContract.test.ts /
 * spotifyDomCss.test.ts); the page this extension creates has
 * src/constants/PageViewSelectors.ts. Before that owner was enforced, ~40
 * call sites across ~20 files hand-spelled `#AmaiLyricsPage ...` chains, and
 * PageView's own comment counted the cost: a stale duplicate page node was
 * resolved by "~75 selectors throughout the app". A page restructure meant a
 * twenty-file edit, and one miss shipped silently.
 *
 * This suite pins the one-owner rule: the `#AmaiLyricsPage` literal appears in
 * exactly one non-test src file — the owner. Comments are tolerated (they
 * document the page element); a trailing comment that quotes the selector
 * would fail this scan, which is fine — reword it, don't quote it.
 *
 * Deliberate exclusions:
 * - `src/edited_packages/` — vendored spcr-settings, forked on purpose; its
 *   spellings are not ours to reroute.
 * - The stylesheets — CSS is bundled as text and injected as one `<style>`,
 *   the same half-seam asymmetry the SpotifyDomContract documents.
 * - PageView's `document.getElementById('AmaiLyricsPage')` — the creator names
 *   the node it builds; that is an id, not a descendant selector.
 */

const root = process.cwd();
const OWNER_PATH = join('src', 'constants', 'PageViewSelectors.ts');

/** Collect every src file that could hold a page-selector spelling. */
function collectSrcFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
    const rel = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (rel.replace(/\\/g, '/').startsWith('src/edited_packages')) continue;
      out.push(...collectSrcFiles(rel));
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry.name)) continue;
    if (/\.test\.(ts|tsx)$/.test(entry.name) || /\.d\.ts$/.test(entry.name)) continue;
    if (rel === OWNER_PATH) continue;
    out.push(rel);
  }
  return out;
}

/** A line whose first non-space characters mark it as a comment. */
function isCommentLine(line: string): boolean {
  const trimmed = line.trimStart();
  return trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*');
}

describe('PageViewSelectors ownership', () => {
  it('the owner still carries the page root selector', () => {
    expect(PageViewSelectors.AmaiLyricsPage).toBe('#AmaiLyricsPage');
  });

  it('no non-test src file spells a #AmaiLyricsPage selector outside the owner', () => {
    const offenders: string[] = [];
    for (const rel of collectSrcFiles('src')) {
      const lines = readFileSync(join(root, rel), 'utf8').split(/\r?\n/);
      lines.forEach((line, i) => {
        if (isCommentLine(line)) return;
        if (line.includes('#AmaiLyricsPage')) offenders.push(`${rel}:${i + 1}: ${line.trim()}`);
      });
    }
    expect(
      offenders,
      `Raw #AmaiLyricsPage spellings belong in ${OWNER_PATH} — route them through ` +
        `PageViewSelectors instead:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });
});
