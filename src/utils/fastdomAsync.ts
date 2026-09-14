import fastdom from 'fastdom';

let errorHandlerInstalled = false;

/**
 * Route FastDOM batch errors to the console instead of re-throwing them
 * inside a rAF callback (fastdom's default when `catch` is unset), where
 * they surface as untraceable uncaught exceptions and silently skip the
 * rest of the batch. Idempotent — safe to call from multiple modules.
 */
export function installFastdomErrorHandler(): void {
  if (errorHandlerInstalled) return;
  errorHandlerInstalled = true;
  fastdom.catch = (error: unknown) => {
    console.error('[Amai Lyrics] FastDOM task failed:', error);
  };
}

// Install on import so every `fastdom.measure/mutate` call site benefits,
// including files that use the raw API for fire-and-forget writes.
installFastdomErrorHandler();

/**
 * Awaitable `fastdom.measure`. Rejects if `fn` throws — unlike a hand-rolled
 * `new Promise((resolve) => fastdom.measure(() => { …; resolve(); }))`,
 * which would hang forever on the same error.
 */
export function measureAsync<T>(fn: () => T): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    fastdom.measure(() => {
      try {
        resolve(fn());
      } catch (error) {
        reject(error);
      }
    });
  });
}

/**
 * Awaitable `fastdom.mutate`. See `measureAsync` for why the try/catch
 * matters: without it a throwing mutation leaves the awaiter pending
 * forever while fastdom re-throws inside its rAF flush.
 */
export function mutateAsync<T>(fn: () => T): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    fastdom.mutate(() => {
      try {
        resolve(fn());
      } catch (error) {
        reject(error);
      }
    });
  });
}
