# CONTEXT.md - Amai Lyrics domain glossary

Names for the seams architecture reviews design against. Use these terms when
naming or describing the modules behind them.

## PlaybackTime

The single place that knows where in the track we are: raw position, live play
state, per-surface lead times, and consumer-tracked sync. Lives in
src/utils/Gets/GetProgress.ts. Callers cross it through GetProgress,
resolveIsPlaying, getPositionFor (+ PlaybackSurfaceOffset/PlaybackSurface),
requestPositionTracking, requestPositionSync, and syncPlaybackPosition - never
through its defensive Spicetify readers. IsPlaying in src/utils/Addons.ts is a
legacy alias that delegates to resolveIsPlaying.

## ArtworkSurfaces

Every artwork-derived surface painted from the live track's cover art: the
sidebar canvas, the app-frame canvas, the lyrics-page canvas, and the accent
publish. Lives in src/components/DynamicBG/ArtworkSurfaces.ts. A one-shot waiter covers the launch gap where the shell is ready before player artwork exists. Callers cross
it through mount, applyArtwork, refreshStaticSurfaces, cancelPending, and
destroy - never through the individual canvases, except two intentional
immediate paints: PageView's page-open lyrics-page paint
(src/components/Pages/PageView.ts) and the settings theme toggle's
app-frame apply/remove (src/utils/settings.ts, which re-notifies the seam via
`amai:appbg-changed`). refreshStaticSurfaces is the internal static repaint
used by mount and the launch waiter; it currently has no external callers.

## LyricsRenderer

The single place that paints lyrics onto the page: container lookup, clear,
row building for Line and Static payloads, info/credits, styling,
registration, scroll mount, and the in-place translation update with scroll
re-anchor. Lives in src/utils/Lyrics/LyricsRenderer.ts. Callers cross it
through renderLyrics, updateLyricTranslations (+ applyScrollReanchor, owned
here and re-exported by the updater), and getLineRecords (the uniform
line view, currently test-only: production ticks still read LyricsObject
directly) - never through the Static/Line builders for row building. The builders and updater remain as thin adapters over
this seam with no src callers, kept for their historic names and tests.
Container CSS vars (Global Applyer, settings font-size handlers), the loader
clear path (ui.ClearLyricsPageContainer via fetch/publish), and click-to-seek
attach (lyrics.ts) touch the same container outside row building.
## AutoScroll

The single place that keeps the active lyric line centered: container mount,
active-line decision, eased motion, and cancel. Lives in
src/utils/Scrolling/AutoScroll.ts. Callers cross it through mount, sync, reset,
and destroy (the AutoScroll facade over mountAutoScroll/syncAutoScroll/
resetAutoScroll/destroyAutoScroll) - never through the SimpleBar container, the scroller, or the
last-line pointer for the scroll tick. The position read crosses the PlaybackTime seam; tests
inject position, lines, container, scroller, isPlaying, and onLyricsPage
overrides instead. The scroller override accepts the full
scrollIntoCenterView shape (container, element, duration, offset, axis).

## PositionConsumer

The single place that owns a position-driven render tick: the IntervalManager,
play-state self-heal, the lyrics-page gate, the position-tracking refcount, and
the finite-guarded position read. Lives in src/utils/PositionConsumer.ts. The
lyrics-page animator (surface `highlight`), the playbar overlay (surface
`playbar`), and the NowBar fullscreen timeline (surface `nowbar`) cross it
through registerPositionConsumer - never through their own
IntervalManager, a resolveIsPlaying call, a History pathname check, or
requestPositionTracking. A consumer states its surface, its cadence, its own
enable gate, what to do with a position, and (optionally) how to clear its DOM
when idle; the refcount policy is per-consumer but the acquire/release plumbing
lives here. The position read crosses the PlaybackTime seam (getPositionFor,
lead time included). One loop per surface, persisted on window so a hot
re-injection reuses rather than duplicates. The `scroll` surface has no own
loop: AutoScroll reads getPositionFor('scroll') inside the `highlight` tick.

The NowBar fullscreen timeline is also a PositionConsumer. Unlike lyric
surfaces, it shows the audio position without a lead time.

## NowBarOverlay

The track-information panel on the lyrics page: artwork, title, artists, and
vinyl playback state. Lives in src/components/NowBar/NowBar.ts. Fullscreen adds album information, playback controls,
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
  inside. Handlers must write the new setting to storage before calling it
  with reload, so the re-fetch sees the new value. The reload re-fetches with `flush` so an in-flight fetch that
  predates the invalidation is never served. The default `fetchLyrics` export
  is internal to the composition (only loadAndApplyLyrics calls it) and the
  `{ trackId }` branch currently has no callers (all use `{ all: true }`).
- `publishNoLyrics(token, id)` in publish.ts is the negative result's
  publication: it persists the typed sentinel through LyricsSnapshot and
  fires the same `lyrics:data-updated` notification as the positive path;
  the playbar overlay re-reads through LyricsSnapshot, so it clears instead
  of freezing on the previous track's line. ui.noLyricsMessage owns only the
  page-visible transitions.

## LyricsSnapshot

The single owner of the published-lyrics snapshot (the `currentLyricsData`
storage key): its serialized format, the legacy plain-string `NO_LYRICS:<id>`
form, the sentinel rule, the track gate, the seconds→ms scaling, and the
Syllable→Line shape. Lives in src/utils/Lyrics/snapshot.ts. Callers cross it
through writeSnapshot (the only writer, used behind publish's currency check;
returns the serialized payload for the publisher to carry on the bus),
clearSnapshot (the refresh/invalidate clear — it notifies on its own, because
its callers are not publishers), readSnapshot (the track-gated typed view the
pipeline reads), publishedTimedLines (the ms-scaled, Syllable-normalized view
the playbar overlay ticks through), isPublishedNoLyrics (the ungated boolean
the fullscreen exit checks), and invalidateSnapshotCache (what the playbar
listener calls when the notification fires) - never through the raw storage
key. The parse memo reads storage on every read and skips re-parsing only
while the stored string is unchanged, so an unseen write self-heals on the
next read. `lyrics:data-updated` is a pure "the snapshot changed"
notification.

## EnhancementPolicy

The single place that turns prepared lyrics into enhanced lyrics: backend
selection, fallback order, prompt construction, mutation, and the user-visible
error message. It sits behind the LyricsPipeline seam. Callers cross it
through `enhanceLyrics` - never through the Gemini/Amai providers directly.
