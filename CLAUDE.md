# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Amai Lyrics — Spicetify extension (not a CustomApp)

Single package at repo root. Entrypoint `src/app.tsx` → `main()` → bundled by `spicetify-creator` (esbuild wrapper, no Vite). `manifest.json` declares `main: ./builds/amai-lyrics-main.js`. What it does: Furigana/Romaji/Romanization + line-by-line Gemini translations for JP/KR lyrics on Spotify, plus playbar lyrics overlay and album-art dynamic background.

## Commands

```bash
npm install              # runs postinstall patch for @hudzax/web-modules automatically
npm run build-local      # spicetify-creator --out=dist → dist/ (use for local inspection)
npm run build            # builds into Spicetify's config-dir extension folder (needs Spicetify installed)
npm run watch            # spicetify-creator --watch
npm run spicetify-watch  # bash spicetify-watch.sh → `spicetify watch -le` live reload

npm test                 # vitest run
npx vitest run tests/conversion.test.ts   # single test file (also works for colocated src/**/*.test.ts)
npm run test:watch       # vitest watch mode
npm run test:coverage    # vitest run --coverage (v8 → coverage/)

npm run lint             # eslint . (ignores dist/, builds/, previews/, coverage/)
npm run lint:fix         # eslint . --fix
npm run typecheck        # tsc --noEmit
npm run typecheck:strict # stricter config (tsconfig.strict.json), currently advisory
npm run postinstall      # re-run if DOM setTimeout/setInterval type errors appear after install
```

Verify before commit: `npm run lint && npm run typecheck && npm test` — no CI exists (`.github/` has only ISSUE_TEMPLATEs), these are the only checks.

Release: `release-flow.sh` is `npm version → npm run build-local → cp dist/* builds/ → git commit/tag → gh release create + upload builds/amai-lyrics-main.js`. Never edit `builds/` by hand.

## Architecture

```
src/app.tsx              # main(): core init → ButtonManager → managers → InitializePlaybarLyrics
src/managers/            # AppInitializer, ButtonManager, EventManager, PageManager, SongChangeManager
src/components/          # Global/ (SpotifyPlayer, Platform), Pages/ (lyrics page), PlaybarLyrics/, DynamicBG/, NowBar/, Styling/, Utils/
src/utils/Lyrics/        # pipeline: fetchLyrics → processing → conversion → Applyer → Animator; ai/ (gemini, amai), cache, publish, translationUpdater
src/utils/               # IntervalManager, lifecycle, storage, Whentil, Hasher, EventManager, Gets/GetProgress
src/edited_packages/spcr-settings/  # vendored settings UI — treat as upstream, avoid drift
src/constants/ intervals.ts, PageViewSelectors.ts, prompts.ts
src/css/ + src/types/ (global.d.ts, spicetify.d.ts, spicy.d.ts)
```

- Lyrics data flow: `SongChangeManager` detects track change → `fetchLyrics.loadAndApplyLyrics(uri)` (per-track `inFlight` Map dedupes; reads localStorage → `cache.getLyricsFromCache` → `api.fetchLyricsFromAPI`) → single publication seam `publish.publishInitialLyrics(token, result)` (currency check + bus notify) → `Global/Applyer` → `Applyer/{Static,Synced,Info}` + `Animator` render loop (`utils/Lyrics/lyrics.ts` `ensureLyricsRenderLoop`) picks active line via `findActiveIndex`. AI enrichment (`ai/gemini.ts`, `ai/amai.ts`, `translationUpdater.ts`) fills furigana/romaji/translation per line.
- Managers own lifecycle; `app.tsx` wires everything through `lifecycle.*` + `Whentil.When` waiting on `Spicetify.Platform.PlaybackAPI`.
- `ArtworkSurfaces` (`components/DynamicBG/`) is the single owner of background canvases + accent publish; song changes and remounts fan out from it.
- Settings UI is built in `src/utils/settings.ts` on the vendored `spcr-settings` API (`src/settings.json` holds only spicetify-creator's `nameId`); the Gemini API key is stored locally via `utils/storage.ts` (`GEMINI_API_KEY`).

## Spicetify runtime constraints

- Global `Spicetify` is injected by Spotify at runtime; undefined in Node. Access player/platform only via `Spicetify.Player`, `Spicetify.Platform`, `Spicetify.CosmosAsync` or the `SpotifyPlayer` wrapper. `tests/setup.ts` stubs `Spicetify` for jsdom — update the stub there for new Spicetify-dependent tests, not inline per-file mocks.
- Hot-reload: Spicetify re-injects the script and re-evaluates modules. `main()` tears down via `window.__amaiLyricsTeardown` and gates on `window.__amaiCoreInitialized` — never remove those guards; every subscription must go through `src/utils/lifecycle.ts` (`trackPlayerEvent`, `trackGlobalEvent`, `trackWindow`, `trackInterval`, `trackHistory`, `trackCallback`) so re-init starts clean.
- Intervals: use `IntervalManager(durationSeconds, cb)` — constructor takes **seconds**, not ms. It auto-pauses on `document.hidden`. For Spotify DOM/API readiness polling use `Whentil.When/Until` (exponential backoff 10→250ms), not tight loops.

## Gotchas

- `npm run build` vs `build-local`: wrong output dir is the most common mistake. Use `build-local` unless deploying into a real Spicetify install.
- `spicetify-watch.sh` / `amai.sh` run `spicetify config extensions "" && spicetify apply && spicetify config extensions <file> && spicetify apply` — the double-reset is required, not redundant. Note `spicetify-watch.sh` still enables the stale filename `amai-lyrics.js` while `amai.sh` uses `amai-lyrics-main.js` — fix before relying on it.
- `.npmrc` maps `@jsr:registry=https://npm.jsr.io` for `@hudzax/web-modules`; don't change without updating that.
- `dist/` and `builds/` are build artifacts (partially gitignored); `builds/amai-lyrics-main.js` is the release artifact.

## TS / lint / format

- `tsconfig.json`: `target ES2020`, `jsx: react`, `module: commonjs`, `strict: false`, `skipLibCheck: true`. Don't enable `strict` without fixing 100s of errors.
- ESLint: `typescript-eslint` recommended + `eslint-plugin-prettier/recommended`; `**/*.d.ts` intentionally allows `any`/duplicate enum values for Spicetify ambient types.
- Prettier: `tabWidth 2, singleQuote, semi, trailingComma all, printWidth 100, arrowParens always, endOfLine lf`.
- Tests: Vitest + jsdom, `globals: true`, `include: src/**/*.{test,spec} + tests/**/*.{test,spec}`, `setupFiles: tests/setup.ts`. Coverage (v8) counts only `src/utils/**`, `src/components/**`, `src/managers/**`, `src/constants/**`.
