# AGENTS.md — Amai Lyrics

> Spicetify extension (not a CustomApp). Single package at repo root. Entrypoint `src/app.tsx` → `main()` → bundled by `spicetify-creator` to `dist/` / `builds/amai-lyrics-main.js`.

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
```

Verify before commit: `npm run lint && npm run typecheck && npm test` — no CI workflow exists; these scripts are the only checks.

## Definition of Done

- Mandatory self-verification: never declare completion on assumption. Audit the final diff for scope violations, regressions, and unintended edits.
- Substantiate every claim with executed evidence: `npm run lint && npm run typecheck && npm test` (or focused equivalent). Unrun checks count as failed.

## Build & Deploy

- Tool: `spicetify-creator@^1.0.17` (esbuild wrapper, no Vite). Config is convention-based; `manifest.json` declares `main: ./builds/amai-lyrics-main.js`.
- `npm run build` writes to Spicetify's config-dir extension folder; `build-local` writes to `dist/` for inspection.
- `release-flow.sh` is the release procedure: edit `VERSION`/`RELEASE_NOTES` at the top, then it runs `npm version → npm run build-local → cp dist/* builds/ → git commit/tag → gh release create + upload builds/amai-lyrics-main.js`. Don't edit `builds/` by hand.
- Registry: `.npmrc` maps `@jsr:registry=https://npm.jsr.io` for `@hudzax/web-modules`. Don't change without updating that.

## Architecture

```
src/app.tsx                    # main() — skeleton styles → ButtonManager → managers → InitializePlaybarLyrics
src/managers/                  # AppInitializer, ButtonManager, EventManager, PageManager, SongChangeManager
src/components/                # Global/, NowBar/, Pages/, PlaybarLyrics/, DynamicBG/, Styling/, Utils/
src/utils/Lyrics/              # Pipeline: fetchLyrics → processing → conversion → Applyer → Animator
src/utils/                     # IntervalManager, lifecycle, storage, Whentil, Hasher, EventManager, settings
src/edited_packages/spcr-settings/  # Vendored settings UI — treat as upstream, avoid drift
src/constants/ intervals.ts, PageViewSelectors.ts, prompts.ts
src/css/ + src/types/ (global.d.ts, spicetify.d.ts)
```

- Managers own lifecycle; `src/app.tsx` wires `IntervalManager` + `lifecycle.track*` + `Whentil.When` for `Spicetify.Platform.PlaybackAPI` readiness.
- Hot-reload: Spicetify re-injects script and re-evaluates modules. Code gates on `window.__amaiCoreInitialized` and `window.__amaiLyricsTeardown` — never remove those guards.

## Spicetify Runtime

- Global `Spicetify` is injected by Spotify at runtime; undefined in tests/Node. All player/platform access must go through `Spicetify.Player`, `Spicetify.Platform`, `Spicetify.CosmosAsync`, `SpotifyPlayer` wrapper.
- `tests/setup.ts` stubs `globalThis.Spicetify` + `window.Spicetify` for jsdom, plus `requestAnimationFrame`/`cancelAnimationFrame` and `ResizeObserver` for render/layout paths. New tests that touch Spicetify APIs must update the stub there, not inline mocks per file.

## Intervals, Events & Teardown

- Use `IntervalManager(durationSeconds, cb)` not raw `setInterval`. Constructor takes **seconds**, internally converts to ms; `Infinity` → 0. It auto-pauses on `document.hidden` (owner `Stop()` while hidden is sticky; auto-paused resumes on visible).
- Use `Whentil.When(condition, cb)` / `Until` (`src/utils/Whentil.ts`) for polling Spotify DOM/API readiness — exponential backoff 10→250ms — not tight loops.
- Register every subscription through `src/utils/lifecycle.ts` (`trackPlayerEvent`, `trackGlobalEvent`, `trackWindow`, `trackInterval`, `trackHistory`). `lifecycle.registerGlobalTeardown()` persists teardown on `window` for re-init.

## Testing

- Runner: Vitest with `jsdom`, `globals: true`, `include: src/**/*.{test,spec}.{ts,tsx} + tests/**/*.{test,spec}.{ts,tsx}`, `setupFiles: tests/setup.ts` (`vitest.config.mjs`).
- Coverage provider `v8`, includes `src/utils/**` + `src/components/**` + `src/managers/**` + `src/constants/**` (excludes `**/*.d.ts`, `src/types/**`, `src/edited_packages/**`).
- Naming: `tests/*.test.ts` (~40 files: conversion, hasher, isRtl, processingUtils, sanitize, lifecycle, intervalManager, lyricsPipeline, translation-sync, … — note there is no plain `processing.test.ts`). Colocated `src/**/*.{test,spec}.*` also picked up (e.g. `PlaybarLyrics.test.ts`, `ArtworkSurfaces.test.ts`, `AppBackground.test.ts`).

## TypeScript / Lint / Format

- `tsconfig.json`: `target ES2020`, `jsx: react`, `module: commonjs`, `strict: false`, `skipLibCheck: true`, `ignoreDeprecations: "6.0"`. Don't enable `strict` without fixing 100s of errors.
- `eslint.config.mjs`: `typescript-eslint` recommended + `eslint-plugin-prettier/recommended`; `**/*.d.ts` disables `no-explicit-any`/`no-duplicate-enum-values` (intentional for Spicetify ambient types).
- Prettier: `tabWidth 2, singleQuote, semi, trailingComma all, printWidth 100, arrowParens always, endOfLine lf`.
- `postinstall` patches `node_modules/@hudzax/web-modules/Scheduler.ts` (`setTimeout`/`setInterval` → `window.setTimeout`/`window.setInterval`) for DOM lib mismatch. If types break after `npm install`, re-run `npm run postinstall`; don't patch upstream source by hand.

## Gotchas

- `npm run build` vs `build-local` — wrong output dir is the most common mistake. Use `build-local` for local inspection, `build` only when Spicetify is installed.
- No GitHub Actions workflows; `.github/` has only `ISSUE_TEMPLATE`. Don't expect CI to catch errors.
- `spicetify-watch.sh` and `amai.sh` both do the `spicetify config extensions "" && spicetify apply && spicetify config extensions <file> && spicetify apply` double-reset — the reset itself is required, not redundant. But note the filenames disagree: `amai.sh` enables `amai-lyrics-main.js` (correct per manifest/README) while `spicetify-watch.sh` still enables `amai-lyrics.js` (stale) — fix that line before relying on `npm run spicetify-watch`.
- `dist/` and `builds/` are build artifacts and partially ignored; the release artifact is `builds/amai-lyrics-main.js` (manifest `main`, `gh release upload` target). Note `release-flow.sh`'s `cp dist/amai-lyrics.js builds/amai-lyrics.js` line still references the old name — sync it before cutting a release.
