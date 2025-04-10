import SimpleBar from 'simplebar';
import { GetElementHeight } from '../../Gets/GetElementHeight';
import {
  IsMouseInLyricsPage,
  LyricsPageMouseEnter,
  LyricsPageMouseLeave,
  SetIsMouseInLyricsPage,
} from '../Page/IsHovering';

export let ScrollSimplebar: SimpleBar;
let isDragging = false;

const ElementEventQuery = '#SpicyLyricsPage .ContentBox .LyricsContainer';

export function MountScrollSimplebar() {
  const LyricsContainer = document.querySelector<HTMLElement>(
    '#SpicyLyricsPage .LyricsContainer .LyricsContent',
  );

  LyricsContainer.style.height = `${GetElementHeight(LyricsContainer)}px`;

  ScrollSimplebar = new SimpleBar(LyricsContainer, { autoHide: false });

  const container = document.querySelector<HTMLElement>(ElementEventQuery);

  container?.addEventListener('mouseenter', () => {
    LyricsPageMouseEnter();
    updateScrollbarVisibility();
  });

  container?.addEventListener('mouseleave', () => {
    LyricsPageMouseLeave();
    updateScrollbarVisibility();
  });

  // Listen for SimpleBar drag events
  LyricsContainer.addEventListener('simplebar-dragstart', () => {
    isDragging = true;
    updateScrollbarVisibility();
  });

  LyricsContainer.addEventListener('simplebar-dragend', () => {
    isDragging = false;
    updateScrollbarVisibility();
  });
}

export function ClearScrollSimplebar() {
  const LyricsContainer = document.querySelector<HTMLElement>(
    '#SpicyLyricsPage .LyricsContainer .LyricsContent',
  );
  const container = document.querySelector<HTMLElement>(ElementEventQuery);

  ScrollSimplebar?.unMount();
  ScrollSimplebar = null;
  SetIsMouseInLyricsPage(false);

  container?.removeEventListener('mouseenter', LyricsPageMouseEnter);
  container?.removeEventListener('mouseleave', LyricsPageMouseLeave);

  LyricsContainer?.removeEventListener('simplebar-dragstart', () => {});
  LyricsContainer?.removeEventListener('simplebar-dragend', () => {});
}

export function RecalculateScrollSimplebar() {
  ScrollSimplebar?.recalculate();
}

function updateScrollbarVisibility() {
  const LyricsContainer = document.querySelector<HTMLElement>(
    '#SpicyLyricsPage .LyricsContainer .LyricsContent',
  );
  if (!LyricsContainer) return;

  if (IsMouseInLyricsPage || isDragging) {
    LyricsContainer.classList.remove('hide-scrollbar');
  } else {
    LyricsContainer.classList.add('hide-scrollbar');
  }
}
