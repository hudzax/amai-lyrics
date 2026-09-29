# AGENTS.md — Amai Lyrics

> Spicetify extension (not a CustomApp). Single package at repo root. Entrypoint `src/app.tsx` → `main()` → bundled by `spicetify-creator` to `dist/amai-lyrics.js`, then copied to `builds/amai-lyrics.js`. Users load the separate `builds/amai-lyrics-main.js` auto-update loader (see Build & Deploy).

## Commands

```bash
npm install              # also runs postinstall patch for @hudzax/web-modules
npm run build            # spicetify-creator (Spicetify config-dir build)
npm run build-local      # spicetify-creator --out=dist         → dist/amai-lyrics.js
npm run watch            # spicetify-creator --watch
npm run spicetify-watch  # bash spicetify-watch.sh → spicetify watch -le (live reload)

npm test                 # vitest run
npm run test:watch       # vitest (watch mode)
npm run test:coverage    # vitest run --coverage (v8, → coverage/)
npm run lint             # eslint .  (ignores dist/, builds/, previews/, coverage/)
npm run lint:fix         # eslint . --fix
npm run typecheck        # tsc --noEmit
npm run typecheck:strict # tsc --noEmit -p tsconfig.strict.json (stricter, currently advisory)
npm run postinstall      # patches Scheduler.ts DOM types (auto on install/prepare)
```

Single test / focused run:

```bash
npx vitest run tests/conversion.test.ts
npx vitest run src/components/PlaybarLyrics/PlaybarLyrics.test.ts  # colocated example
npx vitest run -t "name substring"                                     # by test name
```

Verify before commit: `npm run lint && npm run typecheck && npm test` — no CI workflow exists; these scripts are the only checks. `typecheck:strict` is **not** part of the gate (it currently reports ~33 errors); don't fail your own work on it, and don't "fix" it opportunistically.

## Definition of Done

- Mandatory self-verification: never declare completion on assumption. Audit the final diff for scope violations, regressions, and unintended edits.
- Substantiate every claim with executed evidence: `npm run lint && npm run typecheck && npm test` (or focused equivalent). Unrun checks count as failed.

## Build & Deploy

- Tool: `spicetify-creator@^1.0.17` (esbuild wrapper, no Vite). There is no config file: the tool hardcodes `src/app.tsx` as the extension entry, so that path is not yours to move.
- `builds/` holds two different things, and the split is deliberate:
  - `builds/amai-lyrics.js` — the real, built extension bundle. Produced by `build-local`; `release-flow.sh` copies `dist/amai-lyrics.js` over it and commits it. This is the code.
  - `builds/amai-lyrics-main.js` — a ~1.2 KB auto-update **loader**, hand-written, not generated. It queries the GitHub API for the latest release tag and `import()`s `builds/amai-lyrics.min.js` from jsDelivr. `manifest.json`'s `main` points here, and it's the only file `gh release upload` sends. Its logic is unchanged since 2025-03-28; don't rewrite it per release.
- jsDelivr's `.min.js` is **not a repo file** — no `amai-lyrics.min.js` is tracked, and none ever has been. jsDelivr synthesizes it on demand by running Terser over `builds/amai-lyrics.js` at the requested tag. That's why the loader's URL resolves even though the path is absent from the tree. Don't "fix" the loader's filename or add a `.min.js`; a 200 on that URL is expected and is not evidence the tag contains the file.
- `npm run build` writes to Spicetify's config-dir extension folder; `build-local` writes to `dist/` for inspection.
- `release-flow.sh` is the release procedure: edit `VERSION`/`RELEASE_NOTES` at the top, then it runs `npm version → npm run build-local → cp dist/amai-lyrics.js builds/ → git add . → git commit/tag → push → gh release create + upload builds/amai-lyrics-main.js`. Note it does a bare `git add .` + `git commit` — review `git status` and the staged diff first, or unrelated working-tree changes ship with the release. Don't edit `builds/` by hand.
- Registry: `.npmrc` maps `@jsr:registry=https://npm.jsr.io` for `@hudzax/web-modules`. Don't change without updating that.

## Architecture

**Read `CONTEXT.md` before touching `src/utils/Lyrics/`, `src/utils/Gets/`, or `src/components/DynamicBG/`.** It's a 20 KB domain glossary naming every architecture seam (PlaybackTime, ArtworkSurfaces, LyricsRenderer, LyricsRegistry, LineHighlight, AutoScroll, PositionConsumer, PagePresence, NowBarOverlay, LyricsDocument, LyricsPipeline, LyricsSnapshot, EnhancementPolicy, HoverTooltip, FullscreenMode, SettingsValues) — each with the owning file, the public interface callers must cross, and the internals that are deliberately private. It is the source of truth for "who owns this"; filenames alone will mislead you.

```
src/app.tsx                    # main() — skeleton styles → ButtonManager → managers → InitializePlaybarLyrics
src/managers/                  # AppInitializer, ButtonManager, EventManager, PageManager, SongChangeManager
src/components/                # Global/, NowBar/, Pages/, PlaybarLyrics/, DynamicBG/, Styling/, Utils/
src/utils/Lyrics/              # Pipeline: fetchLyrics → processing (builds the document via conversion) → Applyer; the per-frame work is LineHighlight (driven by registry.startLoop), not Animator
src/utils/                     # IntervalManager, lifecycle, storage, Whentil, Hasher, EventManager, settings
src/edited_packages/spcr-settings/  # Settings UI forked from Spicy Lyrics' spcr-settings; already locally adapted (imports local lifecycle) — keep changes minimal and mirror upstream shape
src/constants/ intervals.ts, PageViewSelectors.ts, prompts.ts
src/css/ + src/types/ (global.d.ts, spicetify.d.ts)
```

- Managers own lifecycle; `src/app.tsx` wires `IntervalManager` + `lifecycle.track*` + `Whentil.When` for `Spicetify.Platform.PlaybackAPI` readiness.
- `Animator` exists but is only for Fullscreen's brightness/blur transitions — it is not a general per-frame driver.
- **Subscribing to anything registers a disposer.** `src/app.tsx` routes every listener, interval, observer, and dynamic import through `lifecycle.track*`; new subscriptions that skip it leak across Spicetify hot-reloads.
- Hot-reload: Spicetify re-injects script and re-evaluates modules. Code gates on `window.__amaiCoreInitialized` and `window.__amaiLyricsTeardown` — never remove those guards.
- Development live reload is always active in the user's Spotify environment. Never launch, stop, reconfigure, or manually trigger it. The user owns all manual runtime and end-to-end verification; agents must distinguish automated check results from unverified app behavior and must not claim the latter was tested.

## Spicetify Runtime

- Global `Spicetify` is injected by Spotify at runtime; undefined in tests/Node. All player/platform access must go through `Spicetify.Player`, `Spicetify.Platform`, `Spicetify.CosmosAsync`, `SpotifyPlayer` wrapper.
- `tests/setup.ts` stubs `globalThis.Spicetify` + `window.Spicetify` for jsdom (Player, Platform, CosmosAsync, LocalStorage, Tippy, Snackbar, …), plus `requestAnimationFrame`/`cancelAnimationFrame`, `ResizeObserver`, and a writable `document.fullscreenElement` with working `requestFullscreen`/`exitFullscreen`. New tests that touch Spicetify or these APIs must extend that stub, not inline per-file mocks.

## Intervals, Events & Teardown

- Use `IntervalManager(durationSeconds, cb)` not raw `setInterval`. Constructor takes **seconds**, internally converts to ms; `Infinity` → 0. It auto-pauses on `document.hidden` (owner `Stop()` while hidden is sticky; auto-paused resumes on visible).
- Use `Whentil.When(condition, cb)` / `Until` (`src/utils/Whentil.ts`) for polling Spotify DOM/API readiness — exponential backoff 10→250ms — not tight loops.
- Register every subscription through `src/utils/lifecycle.ts` (`trackPlayerEvent`, `trackGlobalEvent`, `trackWindow`, `trackInterval`, `trackHistory`). `lifecycle.registerGlobalTeardown()` persists teardown on `window` for re-init.

## Testing

- Runner: Vitest with `jsdom`, `globals: true`, `include: src/**/*.{test,spec}.{ts,tsx} + tests/**/*.{test,spec}.{ts,tsx}`, `setupFiles: tests/setup.ts` (`vitest.config.mjs`).
- Coverage provider `v8`, includes `src/utils/**` + `src/components/**` + `src/managers/**` + `src/constants/**` (excludes `**/*.d.ts`, `src/types/**`, `src/edited_packages/**`).
- Naming: `tests/*.test.ts` (52 files: conversion, hasher, isRtl, processingUtils, sanitize, lifecycle, intervalManager, lyricsPipeline, translation-sync, lineHighlight, pagePresence, … — note there is no plain `processing.test.ts`). Colocated `src/**/*.{test,spec}.*` are picked up too (9 today: `PlaybarLyrics`, `NowBar`, `Fullscreen`, `AutoScroll`, and five under `DynamicBG/` — `AppBackground`, `AppBackgroundGl`, `GlAppBackground`, `ArtworkSurfaces`, `identity`). 61 files / 496 tests as of the last green run.

## TypeScript / Lint / Format

- `tsconfig.json`: `target ES2020`, `jsx: react`, `module: commonjs`, `strict: false`, `skipLibCheck: true`, `ignoreDeprecations: "6.0"`. Don't enable `strict` — `tsconfig.strict.json` is advisory and has ~33 real errors waiting.
- `eslint.config.mjs`: `typescript-eslint` recommended + `eslint-plugin-prettier/recommended`; `**/*.d.ts` disables `no-explicit-any`/`no-duplicate-enum-values` (intentional for Spicetify ambient types).
- **`// SAFETY:` comments are a required convention**, not noise. Because `strict: false` forces `as` casts and non-null assertions throughout, every intentional type/unsafe-HTML suppression is justified with a `// SAFETY: <reason>` line (~18 across 10 files). Match it when you add a cast; don't strip existing ones.
- Prettier: `tabWidth 2, singleQuote, semi, trailingComma all, printWidth 100, arrowParens always, endOfLine lf`. Prettier runs as an ESLint rule, so `npm run lint:fix` is the formatter.
- `postinstall` patches `node_modules/@hudzax/web-modules/Scheduler.ts` (`setTimeout`/`setInterval` → `window.setTimeout`/`window.setInterval`) for DOM lib mismatch. If types break after `npm install`, re-run `npm run postinstall`; don't patch upstream source by hand.

## Gotchas

- `npm run build` vs `build-local` — wrong output dir is the most common mistake. Use `build-local` for local inspection, `build` only when Spicetify is installed.
- No GitHub Actions workflows; `.github/` has only `ISSUE_TEMPLATE`. Don't expect CI to catch errors.
- **`release-flow.sh` and `amai.sh` are untracked and gitignored** (`.gitignore:153-154`) — only `spicetify-watch.sh` is committed. They exist locally, are documented here because they matter, but `git add` won't pick them up. Don't "restore" them to the repo and don't assume a fresh clone has them.
- `spicetify-watch.sh` and `amai.sh` both do the `spicetify config extensions "" && spicetify apply && spicetify config extensions <file> && spicetify apply` double-reset — the reset itself is required, not redundant. They enable different files on purpose: `amai.sh` enables `amai-lyrics-main.js` (the loader, matching the manifest) for normal use, while `spicetify-watch.sh` enables `builds/amai-lyrics.js` so live reload picks up local builds instead of re-fetching the published release. The divergence is intentional; don't "sync" them.
- The uploaded release asset is the loader `builds/amai-lyrics-main.js` — deliberately, so the auto-updater can resolve `latest`. The bundle users actually execute comes from the tag via jsDelivr, not from the release asset. `release-flow.sh`'s `cp dist/amai-lyrics.js builds/amai-lyrics.js` line is correct as written; leave it alone.
