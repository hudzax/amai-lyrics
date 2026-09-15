# CONTEXT.md - Amai Lyrics domain glossary

Names for the seams architecture reviews design against. Use these terms when
naming or describing the modules behind them.

## PlaybackTime

The single place that knows where in the track we are: raw position, live play
state, per-surface lead times, and consumer-tracked sync. Lives in
src/utils/Gets/GetProgress.ts. Callers cross it through GetProgress,
resolveIsPlaying, getPositionFor, requestPositionTracking, requestPositionSync,
and syncPlaybackPosition - never through its defensive Spicetify readers.

## ArtworkSurfaces

Every artwork-derived surface painted from the live track's cover art: the
sidebar canvas, the app-frame canvas, the lyrics-page canvas, and the accent
publish. Lives in src/components/DynamicBG/ArtworkSurfaces.ts. A one-shot waiter covers the launch gap where the shell is ready before player artwork exists. Callers cross
it through mount, applyArtwork, refreshStaticSurfaces, cancelPending, and
destroy - never through the individual canvases.

## LyricsRenderer

The single place that paints lyrics onto the page: container lookup, clear,
row building for Line and Static payloads, info/credits, styling,
registration, scroll mount, and the in-place translation update with scroll
re-anchor. Lives in src/utils/Lyrics/LyricsRenderer.ts. Callers cross it
through renderLyrics, updateLyricTranslations, and getLineRecords (the uniform
line view) - never through the Static/Line builders, the translation updater,
or the scroll container. The builders and updater remain as thin adapters over
this seam for their historic callers and tests.
## AutoScroll

The single place that keeps the active lyric line centered: container mount,
active-line decision, eased motion, and cancel. Lives in
src/utils/Scrolling/AutoScroll.ts. Callers cross it through mount, sync,
reset, and destroy - never through the SimpleBar container, the scroller, or
the last-line pointer. The position read crosses the PlaybackTime seam; tests
inject position, lines, container, and scroller overrides instead.

## LyricsPipeline

The single place that turns a track change into painted lyrics: request
currency, cache and storage reads, lyrics API fetch, enhancement, publication,
and apply. Lives in src/utils/Lyrics/fetchLyrics.ts (composition) with
publish.ts owning currency and publication. Callers cross it through
loadAndApplyLyrics and fetchLyrics - never through cache, api, processing,
publish, ui, or the Global Applyer directly. SongChangeManager is a thin
caller that fans out to this seam plus artwork and page content.
