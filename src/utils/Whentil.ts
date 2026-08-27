type CancelableTask = {
  Cancel: () => void;
  Reset: () => void;
};

// Polling cadence: start fast so short waits stay snappy, then back off
// exponentially so a condition that never becomes true doesn't busy-poll at
// 100Hz for the whole session.
const INITIAL_DELAY_MS = 10;
const MAX_DELAY_MS = 250;

function Until<T>(
  statement: T | (() => T),
  callback: () => void,
  maxRepeats: number = Infinity,
): CancelableTask {
  let delay = INITIAL_DELAY_MS;
  let isCancelled = false;
  let executedCount = 0;
  let timerId: number | null = null;

  const resolveStatement = (): T =>
    typeof statement === 'function' ? (statement as () => T)() : statement;

  const runner = () => {
    timerId = null;
    if (isCancelled || executedCount >= maxRepeats) return;

    const conditionMet = resolveStatement();
    if (!conditionMet) {
      callback();
      executedCount++;
      if (!isCancelled && executedCount < maxRepeats) {
        timerId = window.setTimeout(runner, delay);
        delay = Math.min(delay * 2, MAX_DELAY_MS);
      }
    }
  };

  timerId = window.setTimeout(runner, delay);

  return {
    Cancel() {
      isCancelled = true;
      if (timerId !== null) {
        window.clearTimeout(timerId);
        timerId = null;
      }
    },
    Reset() {
      if (executedCount >= maxRepeats || isCancelled) {
        isCancelled = false;
        executedCount = 0;
        delay = INITIAL_DELAY_MS;
        if (timerId !== null) window.clearTimeout(timerId);
        runner();
      }
    },
  };
}

function When<T>(
  statement: T | (() => T),
  callback: (statement: T) => void,
  repeater: number = 1,
): CancelableTask {
  let delay = INITIAL_DELAY_MS;
  let isCancelled = false;
  let executionsRemaining = repeater;
  let timerId: number | null = null;

  const resolveStatement = (): T =>
    typeof statement === 'function' ? (statement as () => T)() : statement;

  const schedule = (fn: () => void, ms: number) => {
    timerId = window.setTimeout(() => {
      timerId = null;
      fn();
    }, ms);
  };

  const runner = () => {
    if (isCancelled || executionsRemaining <= 0) return;

    try {
      const resolved = resolveStatement();
      if (resolved) {
        callback(resolved);
        delay = INITIAL_DELAY_MS;
        executionsRemaining--;
        if (executionsRemaining > 0) schedule(runner, delay);
      } else {
        schedule(runner, delay);
        delay = Math.min(delay * 2, MAX_DELAY_MS);
      }
    } catch {
      schedule(runner, delay);
      delay = Math.min(delay * 2, MAX_DELAY_MS);
    }
  };

  schedule(runner, delay);

  return {
    Cancel() {
      isCancelled = true;
      if (timerId !== null) {
        window.clearTimeout(timerId);
        timerId = null;
      }
    },
    Reset() {
      if (executionsRemaining <= 0 || isCancelled) {
        isCancelled = false;
        executionsRemaining = repeater;
        delay = INITIAL_DELAY_MS;
        if (timerId !== null) window.clearTimeout(timerId);
        runner();
      }
    },
  };
}

const Whentil = {
  When,
  Until,
};

export default Whentil;
