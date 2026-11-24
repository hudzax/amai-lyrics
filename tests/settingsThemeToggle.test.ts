import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  setThemeEnabled: vi.fn(async () => undefined),
  themeToggle: undefined as (() => void) | undefined,
  fieldValues: {} as Record<string, string | boolean>,
}));

vi.mock('../src/edited_packages/spcr-settings/settingsSection', () => ({
  SettingsSection: class {
    public settingsId: string;

    constructor(_name: string, settingsId: string) {
      this.settingsId = settingsId;
    }

    addButton() {}
    addInput() {}
    addDropDown() {}
    setFieldsVisible() {}
    pushSettings() {}

    addToggle(id: string, _label: string, value: boolean, callback: () => void) {
      mocks.fieldValues[id] = value;
      if (id === 'enableAppBackground') mocks.themeToggle = callback;
    }

    getFieldValue(id: string) {
      return mocks.fieldValues[id];
    }
  },
}));
vi.mock('../src/utils/Lyrics/fetchLyrics', () => ({
  invalidateLyrics: vi.fn(async () => undefined),
}));
vi.mock('../src/components/Global/Defaults', () => ({
  default: { Version: 'test' },
}));
vi.mock('../src/utils/externalNavigation', () => ({
  openTrustedExternalUrl: vi.fn(),
}));
vi.mock('../src/utils/ThemeSettings', () => ({
  applyThemeSettings: vi.fn(),
  getGlIntensity: vi.fn(),
  getGlMotionSpeed: vi.fn(),
}));
vi.mock('../src/utils/ArtworkColors', () => ({
  refreshAccents: vi.fn(),
  isHexColor: vi.fn(() => true),
}));
vi.mock('../src/utils/Lyrics/LyricsFontSizes', () => ({
  applyLyricsFontSizes: vi.fn(),
}));
vi.mock('../src/components/DynamicBG/ArtworkSurfaces', () => ({
  artworkSurfacesSingleton: { setThemeEnabled: mocks.setThemeEnabled },
}));
vi.mock('../src/components/DynamicBG/AppBackground', () => ({
  appBackgroundSingleton: {
    apply: vi.fn(),
    remove: vi.fn(),
    applyIntensitySetting: vi.fn(),
    applyMotionSetting: vi.fn(),
  },
  syncAppBgMarker: vi.fn(),
}));
vi.mock('../src/components/DynamicBG/identity', () => ({
  syncLibraryGridState: vi.fn(),
}));

import { setSettingsMenu } from '../src/utils/settings';
import settingsValues from '../src/utils/settingsValues';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.themeToggle = undefined;
  mocks.fieldValues = {};
  settingsValues.set('enableAppBackground', false);
  setSettingsMenu();
});

describe('theme settings toggle', () => {
  it('stores enable intent and delegates the mode transition', async () => {
    mocks.fieldValues['enableAppBackground'] = true;
    mocks.themeToggle?.();

    expect(settingsValues.get('enableAppBackground')).toBe(true);
    await vi.waitFor(() => expect(mocks.setThemeEnabled).toHaveBeenCalledWith(true));
  });

  it('stores disable intent and delegates the mode transition', async () => {
    settingsValues.set('enableAppBackground', true);
    mocks.fieldValues['enableAppBackground'] = false;
    mocks.themeToggle?.();

    expect(settingsValues.get('enableAppBackground')).toBe(false);
    await vi.waitFor(() => expect(mocks.setThemeEnabled).toHaveBeenCalledWith(false));
  });
});
