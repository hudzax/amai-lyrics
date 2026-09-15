import type SimpleBar from 'simplebar';
import { resetAutoScroll, syncAutoScroll } from './AutoScroll';

/**
 * Backward-compatible seam for auto-scroll decisions.
 *
 * The sequencing now lives in the AutoScroll module; this adapter preserves
 * the historical import path so existing callers keep working while they
 * migrate to AutoScroll.sync / AutoScroll.reset directly.
 */
export function ScrollToActiveLine(scrollSimplebar?: SimpleBar): void {
  if (scrollSimplebar) {
    try {
      syncAutoScroll({ container: scrollSimplebar.getScrollElement() as HTMLElement });
      return;
    } catch {
      return;
    }
  }
  syncAutoScroll();
}

export function ResetLastLine(): void {
  resetAutoScroll();
}
