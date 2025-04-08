type CancelableTask = {
  Cancel: () => void;
  Reset: () => void;
};

function Until<T>(
  statement: T | (() => T),
  callback: () => void,
  maxRepeats: number = Infinity,
): CancelableTask {
  const delay = 10;
  let isCancelled = false;
  let executedCount = 0;

  const resolveStatement = (): T =>
    typeof statement === 'function' ? (statement as () => T)() : statement;

  const runner = () => {
    if (isCancelled || executedCount >= maxRepeats) return;

    const conditionMet = resolveStatement();
    if (!conditionMet) {
      callback();
      executedCount++;
      setTimeout(runner, delay);
    }
  };

  setTimeout(runner, delay);

  return {
    Cancel() {
      isCancelled = true;
    },
    Reset() {
      if (executedCount >= maxRepeats || isCancelled) {
        isCancelled = false;
        executedCount = 0;
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
  const delay = 10;
  let isCancelled = false;
  let executionsRemaining = repeater;

  const resolveStatement = (): T =>
    typeof statement === 'function' ? (statement as () => T)() : statement;

  const runner = () => {
    if (isCancelled || executionsRemaining <= 0) return;

    try {
      const resolved = resolveStatement();
      if (resolved) {
        callback(resolved);
        executionsRemaining--;
        if (executionsRemaining > 0) setTimeout(runner, delay);
      } else {
        setTimeout(runner, delay);
      }
    } catch (error) {
      setTimeout(runner, delay);
    }
  };

  setTimeout(runner, delay);

  return {
    Cancel() {
      isCancelled = true;
    },
    Reset() {
      if (executionsRemaining <= 0 || isCancelled) {
        isCancelled = false;
        executionsRemaining = repeater;
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
