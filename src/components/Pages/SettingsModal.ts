import { getAmaiSettingsSections } from '../../utils/settings';

/**
 * Custom Amai settings overlay. We intentionally do not use
 * `Spicetify.PopupModal` here — it silently failed to appear on some clients,
 * leaving the Settings button looking dead with no fallback in sight.
 *
 * The overlay mounts the same live `SettingsSection` instances that render
 * into the `/preferences` page, so fields, stored values and change handlers
 * are identical — only the mount point differs. Row styling comes from
 * `Settings.css` (scoped by section id); the companion `SettingsModal.css`
 * only lays out the overlay shell below.
 */

let overlay: HTMLElement | null = null;
let lastFocusedElement: HTMLElement | null = null;

function handleOverlayMouseDown(event: MouseEvent): void {
  // Backdrop dismiss only — clicks inside the dialog bubble up but must not
  // close it.
  if (event.target === overlay) closeAmaiSettingsModal();
}

function handleKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Escape') closeAmaiSettingsModal();
}

export function openAmaiSettingsModal(): void {
  const sections = getAmaiSettingsSections();
  if (sections.length === 0) {
    console.error('[Amai Lyrics] Cannot open settings modal: no sections registered');
    Spicetify.showNotification('Amai settings are not ready yet', true, 2000);
    return;
  }

  // Singleton: rebuild fresh so rows always reflect current stored values.
  closeAmaiSettingsModal();

  const active = document.activeElement;
  lastFocusedElement = active instanceof HTMLElement ? active : null;

  overlay = document.createElement('div');
  overlay.className = 'amai-settings-overlay';

  const dialog = document.createElement('div');
  dialog.className = 'amai-settings-dialog';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-label', 'Amai Lyrics Settings');

  const header = document.createElement('div');
  header.className = 'amai-settings-dialog-header';

  const title = document.createElement('h2');
  title.className = 'amai-settings-dialog-title';
  title.textContent = 'Amai Lyrics Settings';

  const closeButton = document.createElement('button');
  closeButton.className = 'amai-settings-dialog-close';
  closeButton.type = 'button';
  closeButton.setAttribute('aria-label', 'Close settings');
  closeButton.textContent = '✕';
  closeButton.addEventListener('click', () => closeAmaiSettingsModal());

  header.appendChild(title);
  header.appendChild(closeButton);

  const body = document.createElement('div');
  body.className = 'amai-settings-dialog-body';

  const container = document.createElement('div');
  container.className = 'amai-settings-modal';

  const slots = sections.map((section) => {
    const slot = document.createElement('div');
    slot.id = section.settingsId;
    container.appendChild(slot);
    return slot;
  });

  body.appendChild(container);
  dialog.appendChild(header);
  dialog.appendChild(body);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  overlay.addEventListener('mousedown', handleOverlayMouseDown);
  document.addEventListener('keydown', handleKeyDown, true);

  // Mount after insertion so renderers measure attached DOM. A throwing
  // section must never take the whole modal down with it.
  sections.forEach((section, index) => {
    try {
      section.renderInto(slots[index]);
    } catch (error) {
      console.error(
        `[Amai Lyrics] Failed to render settings section: ${section.settingsId}`,
        error,
      );
    }
  });

  closeButton.focus();
}

export function closeAmaiSettingsModal(): void {
  if (!overlay) return;

  const node = overlay;
  overlay = null;

  document.removeEventListener('keydown', handleKeyDown, true);
  node.remove();

  if (lastFocusedElement?.isConnected) {
    lastFocusedElement.focus();
    lastFocusedElement = null;
  }
}

export function isAmaiSettingsModalOpen(): boolean {
  return overlay !== null && overlay.isConnected;
}
