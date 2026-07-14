/**
 * Suppresses blank/empty Spicetify toasts (snackbars).
 *
 * Spicetify's `showNotification` is just a wrapper around notistack's
 * `enqueueSnackbar` (spicetifyWrapper.js), which renders into Spotify's
 * global snackbar. This module drops any toast that has no real text
 * (empty, or only symbols like a lone "+"), keeping all genuine
 * notifications (cache cleared, API saved, etc.) working.
 *
 * The programmatic wrapper is the primary, safe mechanism. The DOM
 * observer is scoped strictly to snackbar containers (class contains
 * "ackbar") so it can never touch normal icon-only UI.
 */

import lifecycle from './lifecycle';

const LETTER = /[A-Za-z]/;

function extractText(message: unknown): string {
  if (message == null) return '';
  if (typeof message === 'string') return message;
  if (typeof message === 'number' || typeof message === 'boolean') {
    return String(message);
  }
  if (typeof message === 'object') {
    const props = (message as { props?: { children?: unknown } }).props;
    if (props && 'children' in props) return extractText(props.children);
    const text = (message as { textContent?: string }).textContent;
    if (typeof text === 'string') return text;
  }
  return '';
}

/** True when the toast has no meaningful text (empty or symbol-only, e.g. "+"). */
function isSuppressed(message: unknown): boolean {
  return !LETTER.test(extractText(message).trim());
}

function overrideShowNotification() {
  const original = Spicetify.showNotification?.bind(Spicetify);
  if (!original) return;
  Spicetify.showNotification = ((
    message: Parameters<typeof Spicetify.showNotification>[0],
    isError?: boolean,
    msTimeout?: number,
  ) => {
    if (isSuppressed(message)) return;
    return original(message, isError, msTimeout);
  }) as typeof Spicetify.showNotification;
}

function overrideSnackbar() {
  const spicetify = Spicetify as unknown as {
    Snackbar?: {
      enqueueSnackbar?: (msg: unknown, opts?: unknown) => unknown;
      __amaiWrapped?: boolean;
    };
  };
  const snackbar = spicetify.Snackbar;
  if (!snackbar || typeof snackbar.enqueueSnackbar !== 'function' || snackbar.__amaiWrapped) {
    return false;
  }
  const original = snackbar.enqueueSnackbar.bind(snackbar);
  snackbar.enqueueSnackbar = (message: unknown, options?: unknown) => {
    if (isSuppressed(message)) return;
    return original(message, options);
  };
  snackbar.__amaiWrapped = true;
  return true;
}

// Only the real snackbar container, never generic UI wrappers.
const SNACKBAR_SELECTOR = '[class*="ackbar" i]';

/** Hide any letterless (empty or symbol-only) toast inside a given container. */
function hideLetterlessInContainer(container: Element): void {
  const candidates = [container, ...Array.from(container.children)];
  for (const candidate of candidates) {
    const text = (candidate.textContent ?? '').trim();
    if (text === '' || !LETTER.test(text)) {
      (candidate as HTMLElement).style.display = 'none';
    }
  }
}

function hideAllLetterlessToasts(): void {
  if (typeof document === 'undefined' || !document.body) return;
  document.querySelectorAll(SNACKBAR_SELECTOR).forEach((c) => {
    hideLetterlessInContainer(c as Element);
  });
}

function setupBlankToastObserver() {
  if (typeof document === 'undefined' || !document.body) return;

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        const container = (node as Element).closest(SNACKBAR_SELECTOR);
        if (container) hideLetterlessInContainer(container);
      });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  lifecycle.trackObserver(observer);
}

/** Safety net for the install race: scan briefly after startup. */
function startStartupPoll(durationMs = 3000, intervalMs = 250): void {
  if (typeof document === 'undefined' || !document.body) return;
  hideAllLetterlessToasts();
  let elapsed = 0;
  const timer = setInterval(() => {
    hideAllLetterlessToasts();
    elapsed += intervalMs;
    if (elapsed >= durationMs) clearInterval(timer);
  }, intervalMs);
  lifecycle.track(() => clearInterval(timer));
}

export function installBlankToastSuppressor() {
  const windowRef = window as unknown as { __amaiToastInstalled?: boolean };

  // Monkey-patch the API wrappers only once. The previous wrapper persists
  // across re-init and stays functional, so re-wrapping would just nest them.
  if (!windowRef.__amaiToastInstalled) {
    windowRef.__amaiToastInstalled = true;

    overrideShowNotification();

    if (!overrideSnackbar()) {
      // Spicetify.Snackbar may not be initialized yet; retry briefly.
      let tries = 0;
      const timer = setInterval(() => {
        if (overrideSnackbar() || ++tries > 20) clearInterval(timer);
      }, 250);
      lifecycle.track(() => clearInterval(timer));
    }
  }

  // Always (re)create the DOM observer and startup poll. Teardown disconnects
  // the previous observer on re-init, so it must be recreated — otherwise
  // blank "ackbar" toasts would stop being suppressed after a reload.
  setupBlankToastObserver();
  startStartupPoll();
}
