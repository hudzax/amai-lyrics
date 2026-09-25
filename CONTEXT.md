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
row building for the Line and Static document kinds, info/credits, styling,
registry population, scroll mount, and the in-place translation update with
scroll re-anchor. Lives in src/utils/Lyrics/LyricsRenderer.ts. Callers cross it
through renderLyrics (which takes a `LyricsDocument`), updateLyricTranslations
(which takes nothing — it reads the rows it registered), getPaintedLines (the
registered lyric rows, musical-break rows excluded), and applyScrollReanchor —
never through the Static/Line row builders, which stay private because the two
row shapes differ for real reasons (timing, musical breaks and alignment on one
side; the font-size tag on the other). The builders register into the one
ordered `LyricsObject.Lines`, so a consumer reads one list instead of indexing
by lyrics type, and each registered row pairs its `LineView` with the
`.main-lyrics-text` element the updater writes into — for both kinds.
Enhancement mutates those same line views in place, which is why the updater
needs no payload handed to it. Callers reach all of this through
`LyricsRenderer` alone: the `translationUpdater` and Static/Line Applyer
adapters that used to sit over it had no src callers and were deleted.
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

## LyricsDocument

The single shape the lyrics pipeline carries once it leaves ingest: the track's
lyrics as one ordered list of lines plus the display metadata that travels with
them (type, raw line text, info/credits, styles). Built in
src/utils/Lyrics/processing.ts (`buildDocument`), which is also where a
'Syllable' response is normalized to line-synced lines. Every stage downstream
of it — cache, snapshot, publish, render, translate — crosses this shape and
never the API's `Type`/`Content`/`Lines` union, which now stops at ingest
(api.ts, conversion.ts). Callers cross it through `processAndEnhanceLyrics`,
the cache's `cacheLyrics`/`getLyricsFromCache`, the snapshot's
`writeSnapshot`/`readSnapshot`, `publishInitialLyrics`/`publishEnhancedLyrics`,
`renderLyrics`, and the enhancement's `enhanceLyrics`.

Each line is a `LineView`: `text`, `translation?`, `raw?`, `start?`, `end?`,
`oppositeAligned?`. Times are seconds, matching the API unit. There is no
discriminant: `start`/`end` are present exactly on line-synced rows, and that
presence is what tells the two payload kinds apart downstream. `raw` is the
line as prepared, captured before enhancement and phonetics overwrite `text`;
it is what decides whether a translation adds information the line does not
already carry. Enhancement mutates the document's line objects in place — they
are the objects the renderer registered, so the update path picks the result up
without anything being handed across, and nothing may clone the document on the
way to enhancement.

`LYRICS_DOCUMENT_VERSION` stamps the stored form (cache and snapshot).
`toDocument` is the single decode point: a value written by an older version
decodes to null, so a stale cache or snapshot entry reads as a miss and
re-fetches instead of rendering blank.

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
storage key): its serialized format, the document version stamp, the legacy
plain-string `NO_LYRICS:<id>` form, the sentinel rule, the track gate, and the
seconds→ms scaling. Lives in src/utils/Lyrics/snapshot.ts. Callers cross it
through writeSnapshot (the only writer, used behind publish's currency check;
returns the serialized payload for the publisher to carry on the bus),
clearSnapshot (the refresh/invalidate clear — it notifies on its own, because
its callers are not publishers), readSnapshot (the track-gated typed view the
pipeline reads), publishedTimedLines (the ms-scaled view the playbar overlay
ticks through), isPublishedNoLyrics (the ungated boolean
the fullscreen exit checks), and invalidateSnapshotCache (what the playbar
listener calls when the notification fires) - never through the raw storage
key. The stored payload is the `LyricsDocument` stamped with
`LYRICS_DOCUMENT_VERSION`, so decoding a stored value back into a document is
`toDocument`'s job alone; an entry from an older version is a miss rather than
a decode. The parse memo reads storage on every read and skips re-parsing only
while the stored string is unchanged, so an unseen write self-heals on the
next read. `lyrics:data-updated` is a pure "the snapshot changed"
notification.

## EnhancementPolicy

The single place that turns prepared lyrics into enhanced lyrics: backend
selection, fallback order, prompt construction, mutation, and the user-visible
error message. It sits behind the LyricsPipeline seam. Callers cross it
through `enhanceLyrics` - never through the Gemini/Amai providers directly.

## HoverTooltip

The single place that replaces Spotify's native hover and focus labels with
Amai's lightweight labels while preserving navigation, activation, and
third-party tooltip ownership. It owns trigger recognition, label
reconstruction, dwell, one-bubble ownership, and teardown behind one seam.
Callers should not coordinate suppression, replacement, or Tippy instances
separately.

## SettingsValues

The single place that knows how a user setting is stored and what it means when
unset: the storage key, the encoding, and the default. Lives in
src/utils/settingsValues.ts. Callers cross it through `get` and `set` with the
setting's name — never through `storage.get` plus a comparison, which let two
readers of one key disagree about what unset means.

The values are written by the settings UI (src/utils/settings.ts), which also
seeds each vendored field from the same `get`, so the panel cannot show a
different value than the engine reads. The vendored field store in
spcr-settings is that UI's own persistence and stays behind the wiring; this
seam owns only what the product reads. A stored value that is neither `'true'`
nor `'false'` counts as unset and decodes to the default, so a corrupted entry
can never flip a flag on.
