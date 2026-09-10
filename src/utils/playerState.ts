/**
 * Pure derivations of the app's loop/shuffle display state from raw Spicetify
 * player state. Extracted from EventManager, which previously repeated these
 * ternaries in three places (init, on repeat/shuffle change, and on song
 * change) — a fix in one would silently drift from the others.
 */

export type LoopType = 'context' | 'track' | 'none';
export type ShuffleType = 'smart' | 'normal' | 'none';

/**
 * Maps Spicetify's repeat mode (0 = off, 1 = context, 2 = track) to the app's
 * LoopType.
 */
export function deriveLoopType(repeat: number): LoopType {
  return repeat === 1 ? 'context' : repeat === 2 ? 'track' : 'none';
}

/**
 * Maps Spicetify's shuffle flags to the app's ShuffleType. Smart shuffle wins
 * over normal shuffle; neither set means no shuffle.
 */
export function deriveShuffleType(shuffleState: boolean, smartShuffleState: boolean): ShuffleType {
  return smartShuffleState ? 'smart' : shuffleState ? 'normal' : 'none';
}
