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

## AutoScroll

The single place that keeps the active lyric line centered: container mount,
active-line decision, eased motion, and cancel. Lives in
src/utils/Scrolling/AutoScroll.ts. Callers cross it through mount, sync,
reset, and destroy - never through the SimpleBar container, the scroller, or
the last-line pointer. The position read crosses the PlaybackTime seam; tests
inject position, lines, container, and scroller overrides instead.
