/**
 * Safe HTML utilities for lyrics rendering.
 *
 * Lyrics arrive from external workers / Gemini and contain only a very
 * limited vocabulary: <ruby><rt> plus an optional class="romaja".
 * Everything else must be treated as plain text to prevent XSS.
 *
 * Strategy:
 *  - Escape the whole input first (so <script>, <img onerror=…>, etc.
 *    become harmless entities).
 *  - Then un-escape *only* the known-good ruby tokens produced by
 *    processPhoneticText / ApplyLineLyrics (which use predictable patterns).
 *  - Finally build a DocumentFragment via <template> and return it, so
 *    callers never need to use innerHTML directly.
 */

const RUBY_OPEN = '&lt;ruby&gt;';
const RUBY_CLOSE = '&lt;/ruby&gt;';
const RUBY_ROMAJA_OPEN = '&lt;ruby class=&quot;romaja&quot;&gt;';
const RT_OPEN = '&lt;rt&gt;';
const RT_CLOSE = '&lt;/rt&gt;';

/**
 * Escapes &, <, >, ", ' for safe insertion as HTML.
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Turns a string that may contain *only* <ruby>/<rt> tags into safe HTML.
 * Any other tag is left escaped.
 *
 * Example: processPhoneticText returns "a<ruby>b<rt>c</rt></ruby>d"
 *          → we escape whole string, then restore ruby/rt tokens.
 */
export function sanitizeRubyHtml(html: string): string {
  // 1. Escape everything
  const escaped = escapeHtml(html);
  // 2. Restore only the allow-listed tokens (no attributes except class="romaja")
  return escaped
    .split(RUBY_ROMAJA_OPEN)
    .join('<ruby class="romaja">')
    .split(RUBY_OPEN)
    .join('<ruby>')
    .split(RUBY_CLOSE)
    .join('</ruby>')
    .split(RT_OPEN)
    .join('<rt>')
    .split(RT_CLOSE)
    .join('</rt>');
}

/**
 * Parses sanitized ruby HTML into a DocumentFragment for safe DOM insertion.
 */
export function createRubyFragment(html: string): DocumentFragment {
  const safe = sanitizeRubyHtml(html);
  const tpl = document.createElement('template');
  tpl.innerHTML = safe;
  return tpl.content;
}

/**
 * Safely sets an element's content from a ruby-aware HTML string.
 * Clears existing children, then appends the sanitized fragment.
 */
export function setSafeRubyHtml(element: HTMLElement, html: string): void {
  element.textContent = '';
  element.appendChild(createRubyFragment(html));
}

/**
 * Appends sanitized ruby HTML *preserving* existing child nodes that the
 * caller decides to re-add (e.g. .translation divs). Caller is responsible
 * for re-attaching preserved nodes after calling.
 */
export function replaceMainTextKeepTranslation(lineElement: HTMLElement, rubyHtml: string): void {
  const translation = lineElement.querySelector('.translation');
  const translationText = translation?.textContent ?? null;
  // Remove translation temporarily so it isn't wiped with the fragment logic
  if (translation) translation.remove();
  setSafeRubyHtml(lineElement, rubyHtml);
  if (translationText !== null) {
    const newTranslation = document.createElement('div');
    newTranslation.classList.add('translation');
    newTranslation.textContent = translationText;
    lineElement.appendChild(newTranslation);
  } else if (translation) {
    // Edge: translation existed but was empty — re-add empty node to preserve parity with old logic
    lineElement.appendChild(translation);
  }
}
