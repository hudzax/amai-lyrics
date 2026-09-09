/**
 * Phonetic (ruby) pattern matching for CJK lyrics.
 *
 * This is deliberately a LEAF module with zero imports. The phonetic regexes were
 * previously duplicated byte-for-byte in three places (processing.ts, Applyer/Static.ts
 * and Applyer/Synced/Line.ts), which meant any fix had to be applied three times.
 *
 * It must stay dependency-free: processing.ts, Applyer/Static.ts and
 * Applyer/Synced/Line.ts all sit inside a pre-existing import cycle (via
 * LyricsObject -> lyrics.ts -> ... -> pageButtons.ts -> Global/Applyer.ts), so
 * importing anything heavier here — or importing processing.ts from the Applyers —
 * would add a back-edge to that cycle and risk a module-init/TDZ failure on the
 * render path. A leaf with no imports cannot create a cycle.
 */

/**
 * Gate: text contains Japanese script — Hiragana, Katakana, CJK ideographs or
 * the ideographic iteration mark (々). Korean and Latin text fall through to the
 * romaja branch, so this must not be widened to include Hangul.
 *
 * NOTE: intentionally narrower than JAPANESE_REGEX in processing.ts (language
 * detection for the AI enhancement path, which also covers CJK Ext-A and compat
 * ideographs). A line matching only the wider set takes the Korean branch here
 * and never renders romaji/furigana — pre-existing divergence, do not "fix" by
 * widening this gate without checking the romaja branch and Info notification.
 */
const JAPANESE_CHAR_REGEX = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF々]/;

/** 漢字{かんじ} / （漢字）{かんじ} — fullwidth braces and parens accepted. */
const JAPANESE_ROMAJI_REGEX =
  /(([\u4E00-\u9FFF々\u3040-\u309F\u30A0-\u30FF0-9]+)|[(\uFF08]([\u4E00-\u9FFF々\u3040-\u309F\u30A0-\u30FF0-9]+)[)\uFF09])(?:{|\uFF5B)([^}\uFF5D]+)(?:}|\uFF5D)/g;

const JAPANESE_FURIGANA_REGEX = /([\u4E00-\u9FFF々]+[\u3040-\u30FF]*){([^}]+)}/g;

const KOREAN_ROMAJA_REGEX =
  /((?:\([0-9\uAC00-\uD7AF\u1100-\u11FF]+\)|[\uAC00-\uD7AF\u1100-\u11FF]+)(?:[a-zA-Z]*)[?.!,"']?){([^}]+)}/g;

/**
 * True when `text` contains Japanese script, i.e. when the romaji/furigana
 * distinction applies. Callers use this to decide whether to surface the
 * "toggle Romaji/Furigana" notification.
 */
export function isJapaneseText(text: string | undefined): boolean {
  return !!text && JAPANESE_CHAR_REGEX.test(text);
}

/**
 * Convert phonetic annotations to <ruby> markup.
 *
 * Japanese input uses `enableRomaji` to pick romaji vs furigana; any other input
 * is treated as Korean romaja. Returns `undefined` for `undefined` input so
 * callers can keep assigning straight onto an optional `Text` field.
 *
 * NOTE: the /g patterns above are module-level singletons, so `lastIndex` is
 * carried over between calls. `String.prototype.replace` with a /g regex always
 * resets lastIndex to 0 and consumes the whole string, which is safe here — do
 * NOT add a `.test()` on these three patterns without dropping /g or resetting
 * lastIndex first.
 */
export function applyPhoneticPatterns(text: string, enableRomaji: boolean): string;
export function applyPhoneticPatterns(text: undefined, enableRomaji: boolean): undefined;
export function applyPhoneticPatterns(
  text: string | undefined,
  enableRomaji: boolean,
): string | undefined {
  if (text === undefined) return undefined;
  if (JAPANESE_CHAR_REGEX.test(text)) {
    if (enableRomaji) {
      return text.replace(JAPANESE_ROMAJI_REGEX, (_match, _p1, p2, p3, p4) => {
        const base = p2 || p3;
        return `<ruby>${base}<rt>${p4}</rt></ruby>`;
      });
    }
    return text.replace(JAPANESE_FURIGANA_REGEX, '<ruby>$1<rt>$2</rt></ruby>');
  }
  return text.replace(KOREAN_ROMAJA_REGEX, '<ruby class="romaja">$1<rt>$2</rt></ruby>');
}
