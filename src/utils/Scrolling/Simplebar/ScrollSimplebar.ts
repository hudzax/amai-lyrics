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

// Stored handler refs so removeEventListener actually matches addEventListener.
let onMouseEnter: (() => void) | null = null;
let onMouseLeave: (() => void) | null = null;
let onDragStart: (() => void) | null = null;
let onDragEnd: (() => void) | null = null;
let boundContainer: HTMLElement | null = null;
let boundLyricsContainer: HTMLElement | null = null;

export function MountScrollSimplebar() {
  const LyricsContainer = document.querySelector<HTMLElement>(
    '#SpicyLyricsPage .LyricsContainer .LyricsContent',
  );
  if (!LyricsContainer) return;

  LyricsContainer.style.height = `${GetElementHeight(LyricsContainer)}px`;

  ScrollSimplebar = new SimpleBar(LyricsContainer, { autoHide: false });

  const container = document.querySelector<HTMLElement>(ElementEventQuery);

  // Create stable handler refs so they can be removed in ClearScrollSimplebar.
  onMouseEnter = () => {
    LyricsPageMouseEnter();
    updateScrollbarVisibility();
  };
  onMouseLeave = () => {
    LyricsPageMouseLeave();
    updateScrollbarVisibility();
  };
  onDragStart = () => {
    isDragging = true;
    updateScrollbarVisibility();
  };
  onDragEnd = () => {
    isDragging = false;
    updateScrollbarVisibility();
  };

  boundContainer = container;
  boundLyricsContainer = LyricsContainer;

  container?.addEventListener('mouseenter', onMouseEnter);
  container?.addEventListener('mouseleave', onMouseLeave);

  // Listen for SimpleBar drag events
  LyricsContainer.addEventListener('simplebar-dragstart', onDragStart);
  LyricsContainer.addEventListener('simplebar-dragend', onDragEnd);
}

export function ClearScrollSimplebar() {
  // Use bound element refs when available (elements may already be detached
  // from DOM, so re-querying can miss them and leave listeners on detached
  // nodes).
  const LyricsContainer =
    boundLyricsContainer ??
    document.querySelector<HTMLElement>('#SpicyLyricsPage .LyricsContainer .LyricsContent');
  const container = boundContainer ?? document.querySelector<HTMLElement>(ElementEventQuery);

  ScrollSimplebar?.unMount();
  ScrollSimplebar = null;
  SetIsMouseInLyricsPage(false);

  if (container && onMouseEnter) container.removeEventListener('mouseenter', onMouseEnter);
  if (container && onMouseLeave) container.removeEventListener('mouseleave', onMouseLeave);
  if (LyricsContainer && onDragStart)
    LyricsContainer.removeEventListener('simplebar-dragstart', onDragStart);
  if (LyricsContainer && onDragEnd)
    LyricsContainer.removeEventListener('simplebar-dragend', onDragEnd);

  onMouseEnter = null;
  onMouseLeave = null;
  onDragStart = null;
  onDragEnd = null;
  boundContainer = null;
  boundLyricsContainer = null;
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
