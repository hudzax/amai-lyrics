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
src/utils/Scrolling/AutoScroll.ts. Callers cross it through mount, sync, reset,
and destroy - never through the SimpleBar container, the scroller, or the
last-line pointer. The position read crosses the PlaybackTime seam; tests
inject position, lines, container, and scroller overrides instead.

## PositionConsumer

The single place that owns a position-driven render tick: the IntervalManager,
play-state self-heal, the lyrics-page gate, the position-tracking refcount, and
the finite-guarded position read. Lives in src/utils/PositionConsumer.ts. The
lyrics-page animator (surface `highlight`) and the playbar overlay (surface
`playbar`) cross it through registerPositionConsumer - never through their own
IntervalManager, a resolveIsPlaying call, a History pathname check, or
requestPositionTracking. A consumer states its surface, its cadence, its own
enable gate, what to do with a position, and (optionally) how to clear its DOM
when idle; the refcount policy is per-consumer but the acquire/release plumbing
lives here. The position read crosses the PlaybackTime seam (getPositionFor,
lead time included). One loop per surface, persisted on window so a hot
re-injection reuses rather than duplicates.

The NowBar fullscreen timeline is also a PositionConsumer. Unlike lyric
surfaces, it shows the audio position without a lead time.

## NowBarOverlay

The track-information panel on the lyrics page: artwork, title, artists, and
vinyl playback state. Fullscreen adds album information, playback controls,
and a seekable timeline; exiting fullscreen retains the normal panel.
Opening an already-open panel does not create a second lifetime. Closing or
removing the page cancels its pending display updates and releases its
resources. Playback commands may appear immediately, but player observations
remain authoritative.

## LyricsPipeline

The single place that turns a track change into painted lyrics: request
currency, cache and storage reads, lyrics API fetch, enhancement, publication,
and apply. Lives in src/utils/Lyrics/fetchLyrics.ts (composition) with
publish.ts owning currency and publication. Callers cross it through
loadAndApplyLyrics, fetchLyrics, refreshLyrics, and invalidateLyrics - never
through cache, api, processing, publish, ui, or the Global Applyer directly.
SongChangeManager is a thin caller that fans out to this seam plus artwork and
page content.

- `invalidateLyrics({ all | trackId }, { reload })` is the invalidation entry:
  config changes (translation language, romaji, API key) and first startup say
  what is stale and whether to reload; eviction and snapshot-clearing stay
  inside. The reload re-fetches with `flush` so an in-flight fetch that
  predates the invalidation is never served.
- `publishNoLyrics(token, id)` in publish.ts is the negative result's
  publication: it persists the typed sentinel and fires the same
  `lyrics:data-updated` event as the positive path, so the playbar overlay
  clears instead of freezing on the previous track's line. ui.noLyricsMessage
  owns only the page-visible transitions.
