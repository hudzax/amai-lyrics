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

export function smoothScrollIntoView(
  options: ScrollIntoViewOptions,
): ScrollController {
  const {
    container,
    element,
    duration = 150,
    offset = 0,
    align = 'top',
    axis = 'vertical',
  } = options;

  const containerRect = container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();

  let targetScroll: number;
  let startScroll: number;

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
      // 'top'
      targetScroll =
        elementRect.top - containerRect.top + container.scrollTop - offset;
    }
  } else {
    // 'horizontal'
    startScroll = container.scrollLeft;

    if (align === 'center') {
      targetScroll =
        elementRect.left -
        containerRect.left +
        container.scrollLeft -
        (container.clientWidth / 2 - element.clientWidth / 2) -
        offset;
    } else {
      // 'top' treated as 'start' horizontally
      targetScroll =
        elementRect.left - containerRect.left + container.scrollLeft - offset;
    }
  }

  const distance = targetScroll - startScroll;
  const startTime = performance.now();

  let animationFrameId: number;

  function animate(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
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
  }

  animationFrameId = requestAnimationFrame(animate);

  return {
    cancel: () => {
      cancelAnimationFrame(animationFrameId);
    },
  };
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

export function scrollIntoTopView(
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
    align: 'top',
    axis,
  });
}
