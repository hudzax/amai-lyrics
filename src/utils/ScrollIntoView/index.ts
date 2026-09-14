import fastdom from 'fastdom';

interface ScrollIntoViewOptions {
  container: HTMLElement;
  element: HTMLElement;
  duration?: number; // default 150ms
  offset?: number; // default 0px
  align?: 'center' | 'top'; // default 'top'
  axis?: 'vertical' | 'horizontal'; // default 'vertical'
}

interface ScrollController {
  cancel: () => void;
}

function cubicEaseInOut(progress: number): number {
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
}

const INERT_CONTROLLER: ScrollController = {
  cancel: () => {},
};

export function smoothScrollIntoView(options: ScrollIntoViewOptions): ScrollController {
  const {
    container,
    element,
    duration = 150,
    offset = 0,
    align = 'top',
    axis = 'vertical',
  } = options;

  // Validate before scheduling anything: measuring a detached node yields
  // zero rects and a garbage target, so bail out synchronously instead.
  if (!container.isConnected || !element.isConnected) return INERT_CONTROLLER;

  let cancelled = false;
  let animationFrameId = 0;
  // fastdom.measure returns the queued task, so cancel() can dequeue it via
  // fastdom.clear instead of letting it run a frame later just to early-return.
  let measureTask: (() => void) | null = null;
  const controller: ScrollController = {
    cancel: () => {
      cancelled = true;
      if (measureTask) {
        fastdom.clear(measureTask);
        measureTask = null;
      }
      cancelAnimationFrame(animationFrameId);
    },
  };

  measureTask = fastdom.measure(() => {
    measureTask = null;
    if (cancelled || !container.isConnected || !element.isConnected) return;

    let startScroll: number;
    let distance: number;
    try {
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();

      let targetScroll: number;
      if (axis === 'vertical') {
        startScroll = container.scrollTop;
        if (align === 'center') {
          targetScroll =
            elementRect.top -
            containerRect.top +
            container.scrollTop -
            (container.clientHeight / 2 - element.clientHeight / 2) -
            offset;
        } else {
          targetScroll = elementRect.top - containerRect.top + container.scrollTop - offset;
        }
      } else {
        startScroll = container.scrollLeft;
        if (align === 'center') {
          targetScroll =
            elementRect.left -
            containerRect.left +
            container.scrollLeft -
            (container.clientWidth / 2 - element.clientWidth / 2) -
            offset;
        } else {
          targetScroll = elementRect.left - containerRect.left + container.scrollLeft - offset;
        }
      }
      distance = targetScroll - startScroll;
    } catch {
      // A layout read can throw on a node removed mid-flush; skip silently —
      // the next scroll tick will retry with live nodes.
      return;
    }

    // Already there: skip the rAF loop entirely.
    if (distance === 0) return;
    if (cancelled || !container.isConnected) return;

    // The rAF loop writes directly instead of re-queueing every tick through
    // fastdom.mutate: rAF already batches per frame, so per-tick mutate
    // would only add a frame of latency and queue churn at 60fps.
    // The clock starts from the first rAF timestamp, not from this measure
    // task, so the measure→rAF gap doesn't skew the easing curve.
    let startTime: number | null = null;
    const animate = (currentTime: number) => {
      if (cancelled || !container.isConnected) return;
      if (startTime === null) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = duration <= 0 ? 1 : Math.min(elapsed / duration, 1);
      const easedProgress = cubicEaseInOut(progress);
      const newScroll = startScroll + distance * easedProgress;

      if (axis === 'vertical') {
        container.scrollTop = newScroll;
      } else {
        container.scrollLeft = newScroll;
      }

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);
  });

  // Return the controller immediately
  return controller;
}

export function scrollIntoCenterView(
  container: HTMLElement,
  element: HTMLElement,
  duration = 150,
  offset = 0,
  axis: 'vertical' | 'horizontal' = 'vertical',
): ScrollController {
  return smoothScrollIntoView({
    container,
    element,
    duration,
    offset,
    align: 'center',
    axis,
  });
}
