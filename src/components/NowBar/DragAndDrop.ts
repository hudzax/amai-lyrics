import storage from '../../utils/storage';
import Fullscreen from '../Utils/Fullscreen';
import { DraggableElement, DroppableElement } from './types';

export function setupDragAndDrop() {
  // Cache DragBox and dropZones for reuse
  const DragBox = Fullscreen.IsOpen
    ? document.querySelector('#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaContent')
    : document.querySelector('#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaImage');
  if (!DragBox) return;

  const dropZones = document.querySelectorAll<DroppableElement>(
    '#SpicyLyricsPage .ContentBox .DropZone',
  );

  // Use a flag to prevent duplicate event listeners
  if (!(DragBox as DraggableElement)._dragEventsAdded) {
    DragBox.addEventListener('dragstart', () => {
      setTimeout(() => {
        document.querySelector('#SpicyLyricsPage').classList.add('SomethingDragging');
        const NowBar = document.querySelector('#SpicyLyricsPage .ContentBox .NowBar');
        if (NowBar.classList.contains('LeftSide')) {
          dropZones.forEach((zone) => {
            if (zone.classList.contains('LeftSide')) {
              zone.classList.add('Hidden');
            } else {
              zone.classList.remove('Hidden');
            }
          });
        } else if (NowBar.classList.contains('RightSide')) {
          dropZones.forEach((zone) => {
            if (zone.classList.contains('RightSide')) {
              zone.classList.add('Hidden');
            } else {
              zone.classList.remove('Hidden');
            }
          });
        }
        DragBox.classList.add('Dragging');
      }, 0);
    });

    DragBox.addEventListener('dragend', () => {
      document.querySelector('#SpicyLyricsPage').classList.remove('SomethingDragging');
      dropZones.forEach((zone) => zone.classList.remove('Hidden'));
      DragBox.classList.remove('Dragging');
    });

    (DragBox as DraggableElement)._dragEventsAdded = true;
  }

  dropZones.forEach((zone) => {
    // Prevent duplicate listeners
    if (!(zone as DroppableElement)._dropEventsAdded) {
      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('DraggingOver');
      });

      zone.addEventListener('dragleave', () => {
        zone.classList.remove('DraggingOver');
      });

      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('DraggingOver');

        const NowBar = document.querySelector('#SpicyLyricsPage .ContentBox .NowBar');
        const currentClass = NowBar.classList.contains('LeftSide') ? 'LeftSide' : 'RightSide';

        const newClass = zone.classList.contains('RightSide') ? 'RightSide' : 'LeftSide';

        if (currentClass !== newClass) {
          NowBar.classList.remove(currentClass);
          NowBar.classList.add(newClass);
          const side = zone.classList.contains('RightSide') ? 'right' : 'left';
          storage.set('NowBarSide', side);
        }
      });

      (zone as DroppableElement)._dropEventsAdded = true;
    }
  });
}
