import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  closeAmaiSettingsModal,
  isAmaiSettingsModalOpen,
  openAmaiSettingsModal,
} from '../src/components/Pages/SettingsModal';
import { getAmaiSettingsSections } from '../src/utils/settings';
import type { SettingsSection } from '../src/edited_packages/spcr-settings/settingsSection';

const renderIntoMock = vi.fn();

vi.mock('../src/utils/settings', () => ({
  getAmaiSettingsSections: vi.fn(() => [
    { settingsId: 'amai-settings', renderInto: renderIntoMock },
    { settingsId: 'amai-dev-settings', renderInto: renderIntoMock },
    { settingsId: 'amai-info', renderInto: renderIntoMock },
  ]),
}));

const getSectionsMock = vi.mocked(getAmaiSettingsSections);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const spicetify = globalThis.Spicetify as any;

const defaultSections = (): SettingsSection[] =>
  ['amai-settings', 'amai-dev-settings', 'amai-info'].map(
    (settingsId) => ({ settingsId, renderInto: renderIntoMock }) as unknown as SettingsSection,
  );

function overlay(): HTMLElement | null {
  return document.querySelector<HTMLElement>('.amai-settings-overlay');
}

describe('openAmaiSettingsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSectionsMock.mockReturnValue(defaultSections());
    document.body.innerHTML = '';
    spicetify.Platform.History.push = vi.fn();
    spicetify.showNotification = vi.fn();
  });

  it('mounts every Amai settings section into a custom overlay instead of navigating', () => {
    openAmaiSettingsModal();

    expect(spicetify.Platform.History.push).not.toHaveBeenCalled();
    expect(isAmaiSettingsModalOpen()).toBe(true);

    const node = overlay();
    expect(node).not.toBeNull();

    const dialog = node!.querySelector('[role="dialog"]');
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(dialog?.getAttribute('aria-label')).toBe('Amai Lyrics Settings');
    expect(node!.querySelector('.amai-settings-dialog-title')?.textContent).toBe(
      'Amai Lyrics Settings',
    );
    expect(node!.querySelector('.amai-settings-dialog-close')).not.toBeNull();

    const slots = [...node!.querySelectorAll('.amai-settings-modal > div')] as HTMLElement[];
    expect(slots.map((slot) => slot.id)).toEqual([
      'amai-settings',
      'amai-dev-settings',
      'amai-info',
    ]);
    expect(renderIntoMock).toHaveBeenCalledTimes(3);
    slots.forEach((slot) => expect(renderIntoMock).toHaveBeenCalledWith(slot));
  });

  it('reopening replaces the previous overlay so section ids stay unique', () => {
    openAmaiSettingsModal();
    openAmaiSettingsModal();

    expect(document.querySelectorAll('.amai-settings-overlay')).toHaveLength(1);
  });

  it('keeps the overlay open when a section renderer throws', () => {
    renderIntoMock.mockImplementationOnce(() => {
      throw new Error('renderer boom');
    });

    expect(() => openAmaiSettingsModal()).not.toThrow();
    expect(isAmaiSettingsModalOpen()).toBe(true);
    expect(renderIntoMock).toHaveBeenCalledTimes(3);
  });

  it('notifies instead of dying silently when no sections are registered', () => {
    getSectionsMock.mockReturnValue([]);

    openAmaiSettingsModal();

    expect(overlay()).toBeNull();
    expect(spicetify.showNotification).toHaveBeenCalledWith(
      'Amai settings are not ready yet',
      true,
      2000,
    );
  });
});

describe('closeAmaiSettingsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSectionsMock.mockReturnValue(defaultSections());
    document.body.innerHTML = '';
  });

  it('removes the overlay via the close button and restores focus', () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();

    openAmaiSettingsModal();
    expect(isAmaiSettingsModalOpen()).toBe(true);

    (overlay()!.querySelector('.amai-settings-dialog-close') as HTMLButtonElement).click();

    expect(overlay()).toBeNull();
    expect(isAmaiSettingsModalOpen()).toBe(false);
    expect(document.activeElement).toBe(opener);
  });

  it('dismisses on backdrop mousedown but not on dialog clicks', () => {
    openAmaiSettingsModal();
    const node = overlay()!;

    node
      .querySelector('.amai-settings-dialog')!
      .dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(isAmaiSettingsModalOpen()).toBe(true);

    node.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(isAmaiSettingsModalOpen()).toBe(false);
  });

  it('dismisses on Escape but ignores other keys', () => {
    openAmaiSettingsModal();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(isAmaiSettingsModalOpen()).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(isAmaiSettingsModalOpen()).toBe(false);
  });

  it('close without an open modal is a no-op', () => {
    expect(() => closeAmaiSettingsModal()).not.toThrow();
  });
});
