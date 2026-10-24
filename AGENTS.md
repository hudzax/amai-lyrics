# AGENTS.md — Amai Lyrics

Spicetify extension (not a CustomApp). Single package at repo root. Entrypoint `src/app.tsx` → `main()` → bundled to `dist/amai-lyrics.js` → copied to `builds/amai-lyrics.js`. Users load the separate auto-update loader `builds/amai-lyrics-main.js` (see Build & Deploy).

## Commands

```bash
npm install              # also runs the postinstall patch for @hudzax/web-modules
npm run build            # spicetify-creator (writes to Spicetify's config dir — only when Spicetify is installed)
npm run build-local      # spicetify-creator --out=dist        → dist/amai-lyrics.js
npm run watch            # spicetify-creator --watch
npm run spicetify-watch  # ./spicetify-watch.sh → spicetify watch -le (live reload)

npm test                 # vitest run
npm run test:watch       # vitest (watch mode)
npm run test:coverage    # vitest run --coverage (v8, → coverage/)
npm run lint             # eslint .  (ignores dist/, builds/, previews/, coverage/)
npm run lint:fix         # eslint . --fix  — this is the formatter (prettier runs as an ESLint rule)
npm run typecheck        # tsc --noEmit (strict — must stay at zero errors)
npm run postinstall      # patches @hudzax/web-modules .ts sources (runs on install/prepare)
```

```bash
npx vitest run tests/conversion.test.ts                           # single file
npx vitest run src/components/PlaybarLyrics/PlaybarLyrics.test.ts  # colocated file
npx vitest run -t "name substring"                                # by test name
```

## Definition of Done

- Never declare completion on assumption. Audit the final diff for scope violations, regressions, and unintended edits.
- Substantiate every claim with executed evidence: `npm run lint && npm run typecheck && npm test` (or a focused equivalent). Unrun checks count as failed.
- There is no CI. These scripts are the only gate — `.github/` contains only `ISSUE_TEMPLATE`. Nothing downstream will catch an error for you.
- `typecheck` must stay at zero errors under `strict: true`. Fix new errors properly; never silence them with `any` / `as any`.
- **Never run `npm run build` when Spicetify isn't installed** — it writes to the config dir, not `dist/`. For local inspection always use `build-local`. Wrong output dir is the most common mistake.
- Live reload is always active in the user's Spotify environment. Never launch, stop, reconfigure, or manually trigger it. The user owns all manual runtime and end-to-end verification. Distinguish automated check results from unverified app behavior, and never claim the latter was tested.

## Architecture

**Read `CONTEXT.md` before touching `src/utils/Lyrics/`, `src/utils/Gets/`, or `src/components/DynamicBG/`.** It's the domain glossary and the source of truth for "who owns this" — filenames alone will mislead you. It names each seam with its owning file, the public interface callers must cross, and the internals that are deliberately private: `SpotifyDomContract`, `PlaybackTime`, `ArtworkSurfaces`, `LyricsRenderer`, `LyricsRegistry`, `LineHighlight`, `AutoScroll`, `PositionConsumer`, `PagePresence`, `NowBarOverlay`, `LyricsDocument`, `LyricsPipeline`, `LyricsSnapshot`, `EnhancementPolicy`, `HoverTooltip`, `FullscreenMode`, `SettingsValues`, `ThemeSettings`.

```
src/app.tsx                        # main() — skeleton styles → ButtonManager → managers → InitializePlaybarLyrics
src/managers/                      # AppInitializer, ButtonManager, EventManager, PageManager, SongChangeManager
src/components/                    # Global/, NowBar/, Pages/, PlaybarLyrics/, DynamicBG/, Styling/, Utils/
src/utils/Lyrics/                  # fetchLyrics → processing (builds the document via conversion) → Applyer
src/utils/                         # IntervalManager, lifecycle, storage, Whentil, Hasher, EventManager, Animator, settings
src/edited_packages/spcr-settings/ # Settings UI forked from Spicy Lyrics; already locally adapted (imports local lifecycle).
                                   #   Keep changes minimal and mirror upstream shape.
src/constants/                     # intervals.ts, PageViewSelectors.ts, SpotifyDom.ts, prompts.ts
src/css/, src/types/               # global.d.ts, spicetify.d.ts
```

- Managers own lifecycle. `src/app.tsx` wires `IntervalManager` + `lifecycle.track*` + `Whentil.When` for `Spicetify.Platform.PlaybackAPI` readiness.
- `Animator` is only for Fullscreen's brightness/blur transitions — it is not a general per-frame driver. The per-frame lyrics work is `LineHighlight`, driven by `registry.startLoop`.
- Hot-reload gates on `window.__amaiCoreInitialized` (AppInitializer.ts) and `window.__amaiLyricsTeardown` (app.tsx / lifecycle.ts). **Never remove those guards.**
- **Subscribing to anything registers a disposer.** Route every listener, interval, observer, and dynamic import through `lifecycle.track*`. A subscription that skips it leaks across Spicetify hot-reloads.

## Intervals, Events & Teardown

- `IntervalManager(durationSeconds, cb)` (`src/utils/IntervalManager.ts`), not raw `setInterval`. Takes **seconds**, converts to ms internally; `Infinity` → 0. Auto-pauses on `document.hidden` (an owner `Stop()` while hidden is sticky; auto-paused resumes on visible).
- `Whentil.When(condition, cb)` / `Until` (`src/utils/Whentil.ts`) for polling DOM/API readiness — exponential backoff 10 → 250 ms. Never a tight loop.
- `src/utils/lifecycle.ts` owns disposers: `track`, `trackPlayerEvent`, `trackGlobalEvent`, `trackWindow`, `trackInterval`, `trackWhentil`, `trackObserver`, `trackHistory`, `trackCallback`, and `registerGlobalTeardown()` (persists teardown on `window` for re-init).

## Spicetify Runtime

- The global `Spicetify` is injected by Spotify at runtime and is undefined in tests/Node. All player/platform access goes through `Spicetify.Player`, `Spicetify.Platform`, `Spicetify.CosmosAsync`, or the `SpotifyPlayer` wrapper.
- `tests/setup.ts` stubs `globalThis.Spicetify` + `window.Spicetify` for jsdom (Player, Platform, CosmosAsync, LocalStorage, Tippy, Snackbar, …), plus `requestAnimationFrame`/`cancelAnimationFrame`, `ResizeObserver`, and a writable `document.fullscreenElement` with working `requestFullscreen`/`exitFullscreen`. New tests touching Spicetify or these APIs must **extend that stub**, not inline per-file mocks.

## Spotify DOM (`SpotifyDomContract`)

Spotify DOM knowledge has exactly one owner: `src/constants/SpotifyDom.ts` (see `CONTEXT.md`).

- New selector literals for an aliased or multi-file surface belong there, never inline. `querySelector`/`matches`/`closest` take the `anySurface` form (`:is(…)` when the surface has several spellings, the bare selector when it has one).
- Callers never index `SPOTIFY_SURFACES[name][i]` — use `primarySurface` / `legacySurface`.
- `tests/spotifyDomContract.test.ts` resolves every core surface on both transcribed DOM generations and every surface on at least one fixture. `tests/spotifyDomCss.test.ts` pins the per-file spellings the stylesheets must keep, matching on whitespace-collapsed CSS so a selector wrapped across lines is still seen.
- Stylesheets are the half the seam does *not* own: they're bundled as text and injected as one `<style>`, so no TS helper reaches them and no test ever evaluates a selector there. Spell each rule's selector by hand in the comma-list form and add that spelling to its file's entry in `spotifyDomCss.test.ts`. `allSurface()` exists only to pin `:is()`/comma-list equivalence inside the contract test — never as a way to generate CSS.
- The extension's **own** page DOM has its own one-owner rule: every selector reaching into the `#AmaiLyricsPage` subtree lives in `src/constants/PageViewSelectors.ts` (see `CONTEXT.md` → PageViewSelectors). Never hand-spell an `#AmaiLyricsPage` chain at a call site — `tests/pageViewSelectors.test.ts` fails the build on any new one.

## Testing

- Runner: Vitest + jsdom, `globals: true`; include is `src/**/*.{test,spec}.{ts,tsx}` and `tests/**/*.{test,spec}.{ts,tsx}`, `setupFiles: tests/setup.ts` (`vitest.config.mjs`).
- The root `tests/` directory is inside `tsconfig.json`'s include, so tests are strict-typechecked by `npm run typecheck` too. **Import vitest APIs explicitly** (`import { describe, it, expect, vi } from 'vitest'`); bare globals run fine but don't typecheck.
- Coverage: `v8` provider, includes `src/utils/**`, `src/components/**`, `src/managers/**`, `src/constants/**` (excludes `**/*.d.ts`, `src/types/**`, `src/edited_packages/**`).
- Layout: tests live in two places, both picked up by the same `include`. The root `tests/` directory holds the unit-level suites (conversion, hasher, isRtl, processingUtils, sanitize, lifecycle, intervalManager, lyricsPipeline, translation-sync, lineHighlight, pagePresence, spotifyDomContract, spotifyDomCss, … — note there is no plain `processing.test.ts`), and component suites are colocated alongside their source under `src/` (PlaybarLyrics, NowBar, ProgressBar, Fullscreen, AutoScroll, and several under `DynamicBG/`). Don't assume a suite doesn't exist because it isn't in `tests/` — check `src/**` too.

## TypeScript / Lint / Format

- `tsconfig.json`: `target ES2020`, `jsx: react`, `module: commonjs`, `strict: true` (`noImplicitReturns`, `noFallthroughCasesInSwitch` on; `strictPropertyInitialization` deliberately `false`), `skipLibCheck: true`, `ignoreDeprecations: "6.0"`. Don't downgrade `strict` or loosen the config to make an error go away.
- **The typechecker is newer than the bundler.** `spicetify-creator` ships esbuild 0.14 (2022), so syntax `tsc` accepts can still fail `npm run build` / `build-local` / `watch` — and `typecheck` won't warn you, because esbuild isn't part of that gate. `satisfies` (TS 4.9), `const` type parameters (5.0), `using` / `await using` (5.2) and `accessor` (4.9) all fail to parse. Use a conditional type for the `satisfies`-shaped cases. The build breaks while every script you were told to run stays green.
- `eslint.config.mjs`: typescript-eslint recommended + `eslint-plugin-prettier/recommended`; `**/*.d.ts` disables `no-explicit-any` / `no-duplicate-enum-values` (intentional for the Spicetify ambient types).
- **`// SAFETY:` comments are a required convention, not noise.** Legacy casts and non-null assertions are throughout (and Spicetify's ambient types include `any`), so every intentional type/unsafe-HTML suppression carries a `// SAFETY: <reason>` line. Match it when you add a cast; don't strip existing ones.
- Prettier: `tabWidth 2, singleQuote, semi, trailingComma all, printWidth 100, arrowParens always, endOfLine lf`. It runs as an ESLint rule, so `npm run lint:fix` is the formatter.
- `postinstall` patches `node_modules/@hudzax/web-modules` in place: `Scheduler.ts` (`setTimeout`/`setInterval` → `window.*` for the DOM lib mismatch) and `FreeArray.ts` (adds an explicit `return undefined;` in `Remove` for `noImplicitReturns`). The package ships `.ts` sources, so both files are in the typecheck program. If types break after `npm install`, re-run `npm run postinstall` — don't patch upstream source by hand.

## Build & Deploy

Tool: `spicetify-creator@^1.0.17` (esbuild wrapper, no Vite). There is no config file — the tool hardcodes `src/app.tsx` as the extension entry, so that path is not yours to move.

`builds/` holds two deliberately different things:

- **`builds/amai-lyrics.js`** — the real built extension bundle. Produced by `build-local`; `release-flow.sh` copies `dist/amai-lyrics.js` over it and commits it. This is the code.
- **`builds/amai-lyrics-main.js`** — a small auto-update **loader**, hand-written, not generated. It queries the GitHub API for the latest release tag and `import()`s `builds/amai-lyrics.min.js` from jsDelivr. `manifest.json`'s `main` points here, and it's the only file `gh release upload` sends. Its logic is unchanged since 2025-03-28 — don't rewrite it per release.

jsDelivr's `.min.js` is **not a repo file**. No `amai-lyrics.min.js` is tracked and none ever has been; jsDelivr synthesizes it on demand by running Terser over `builds/amai-lyrics.js` at the requested tag. That's why the loader's URL resolves even though the path is absent from the tree. Don't "fix" the loader's filename or add a `.min.js`; a 200 on that URL is expected and is not evidence the tag contains the file.

**The release asset is the loader, deliberately**, so the auto-updater can resolve `latest`. What users execute comes from the tag via jsDelivr, not from the release asset. `release-flow.sh`'s `cp dist/amai-lyrics.js builds/amai-lyrics.js` line is correct as written — leave it alone. Don't edit `builds/` by hand.

`release-flow.sh` procedure: edit the `VERSION` / `RELEASE_NOTES` variables at the top of the script, then run it (`bash release-flow.sh`). It does the rest: `npm version (no-git-tag) → build-local → cp dist/amai-lyrics.js builds/ → git add . → commit/tag → push → gh release create + upload builds/amai-lyrics-main.js`. Note it does a bare `git add .` + `git commit` — review `git status` and the staged diff **before** running it, or unrelated working-tree changes ship with the release.

Only the user makes releases. Don't bump `VERSION`, don't commit a release, and don't run `release-flow.sh` unless asked — the script's `git add .` will sweep up whatever is currently uncommitted in the working tree.

Registry: `.npmrc` maps `@jsr:registry=https://npm.jsr.io` for `@hudzax/web-modules`. Don't change it without updating that mapping.

## Gotchas

- **`release-flow.sh` and `amai.sh` are untracked and gitignored** — only `spicetify-watch.sh` is committed. They exist locally and are documented here because they matter, but `git add` won't pick them up. Don't "restore" them to the repo and don't assume a fresh clone has them.
- `spicetify-watch.sh` and `amai.sh` both do the `spicetify config extensions "" && spicetify apply && spicetify config extensions <file> && spicetify apply` double-reset. The reset itself is required, not redundant. They enable different files on purpose: `amai.sh` enables `amai-lyrics-main.js` (the loader, matching the manifest) for normal use, while `spicetify-watch.sh` enables `builds/amai-lyrics.js` so live reload picks up local builds instead of re-fetching the published release. The divergence is intentional — don't "sync" them.
- No GitHub Actions workflows. Don't expect CI to catch anything.
