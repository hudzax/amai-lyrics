import storage from '../../utils/storage';

/** Binds one NowBar's drag lifetime. Dispose before rebinding after a layout change. */
export function setupDragAndDrop(root: HTMLElement, fullscreen: boolean): () => void {
  const page = root.closest<HTMLElement>('#AmaiLyricsPage');
  const dragBox = root.querySelector<HTMLElement>(
    fullscreen ? '.Header .MediaBox .MediaContent' : '.Header .MediaBox .MediaImage',
  );
  if (!page || !dragBox) return () => {};

  const dropZones = page.querySelectorAll<HTMLElement>('.ContentBox .DropZone');
  const disposers: (() => void)[] = [];
  let dragStartTimer: number | null = null;
  let destroyed = false;

  function clearDragState(): void {
    if (dragStartTimer !== null) {
      window.clearTimeout(dragStartTimer);
      dragStartTimer = null;
    }
    page.classList.remove('SomethingDragging');
    dragBox.classList.remove('Dragging');
    dropZones.forEach((zone) => zone.classList.remove('Hidden', 'DraggingOver'));
  }

  function listen(target: Element, type: string, handler: EventListener): void {
    target.addEventListener(type, handler);
    disposers.push(() => target.removeEventListener(type, handler));
  }

  listen(dragBox, 'dragstart', () => {
    clearDragState();
    // Defer styling until the browser has captured the drag image.
    dragStartTimer = window.setTimeout(() => {
      dragStartTimer = null;
      if (destroyed || !root.isConnected) return;
      page.classList.add('SomethingDragging');
      const side = root.classList.contains('LeftSide')
        ? 'LeftSide'
        : root.classList.contains('RightSide')
          ? 'RightSide'
          : null;
      dropZones.forEach((zone) => {
        zone.classList.toggle('Hidden', side !== null && zone.classList.contains(side));
      });
      dragBox.classList.add('Dragging');
    }, 0);
  });
  listen(dragBox, 'dragend', clearDragState);

  dropZones.forEach((zone) => {
    listen(zone, 'dragover', (event) => {
      event.preventDefault();
      zone.classList.add('DraggingOver');
    });
    listen(zone, 'dragleave', () => zone.classList.remove('DraggingOver'));
    listen(zone, 'drop', (event) => {
      event.preventDefault();
      clearDragState();
      const currentSide = root.classList.contains('LeftSide') ? 'left' : 'right';
      const newSide = zone.classList.contains('RightSide') ? 'right' : 'left';
      if (currentSide !== newSide) {
        root.classList.toggle('LeftSide', newSide === 'left');
        root.classList.toggle('RightSide', newSide === 'right');
        storage.set('NowBarSide', newSide);
      }
    });
  });

  return () => {
    if (destroyed) return;
    destroyed = true;
    disposers.splice(0).forEach((dispose) => dispose());
    clearDragState();
  };
}
