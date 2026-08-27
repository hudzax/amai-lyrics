/**
 * Debounce utility — returns a function that delays invoking `fn` until after `delay` ms
 * have elapsed since the last invocation. The returned function has a `.cancel()` method.
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number,
): T & { cancel: () => void } {
  let timer: number | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timer !== null) window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      timer = null;
      fn(...args);
    }, delay);
  };

  (debounced as T & { cancel: () => void }).cancel = () => {
    if (timer !== null) {
      window.clearTimeout(timer);
      timer = null;
    }
  };

  return debounced as T & { cancel: () => void };
}

/**
 * Async debounce for functions that return promises — coalesces rapid calls and
 * resolves all callers with the last invocation's result.
 */
export function debounceAsync<T extends (...args: Parameters<T>) => Promise<unknown>>(
  fn: T,
  delay: number,
): T & { cancel: () => void } {
  let timer: number | null = null;
  let pending: Array<{ resolve: (v: unknown) => void; reject: (e: unknown) => void }> = [];

  const debounced = (...args: Parameters<T>): Promise<unknown> => {
    if (timer !== null) window.clearTimeout(timer);

    return new Promise((resolve, reject) => {
      pending.push({ resolve, reject });
      timer = window.setTimeout(async () => {
        timer = null;
        const toResolve = pending;
        pending = [];
        try {
          const result = await fn(...(args as Parameters<T>));
          toResolve.forEach(({ resolve: r }) => r(result));
        } catch (e) {
          toResolve.forEach(({ reject: r }) => r(e));
        }
      }, delay);
    });
  };

  (debounced as T & { cancel: () => void }).cancel = () => {
    if (timer !== null) {
      window.clearTimeout(timer);
      timer = null;
    }
    pending.forEach(({ resolve }) => resolve(undefined));
    pending = [];
  };

  return debounced as T & { cancel: () => void };
}
