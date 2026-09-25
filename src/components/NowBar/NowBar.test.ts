import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// A controllable adapter at the fullscreen seam, standing in for the page-DOM
// implementation: NowBar must follow the mode's notifications and its
// synchronous query — never a peer's mutable flag. The real mode module is
// exercised in Utils/Fullscreen.test.ts.
const mode = vi.hoisted(() => {
  let fullscreen = true;
  const subscribers = new Set<(fullscreen: boolean) => void>();
  return {
    isPageFullscreen: () => fullscreen,
    subscribe(subscriber: (fullscreen: boolean) => void) {
      subscribers.add(subscriber);
      return () => {
        subscribers.delete(subscriber);
      };
    },
    set(value: boolean) {
      fullscreen = value;
      for (const subscriber of [...subscribers]) subscriber(value);
    },
  };
});
vi.mock('../Utils/Fullscreen', () => ({
  default: {
    isPageFullscreen: mode.isPageFullscreen,
    subscribe: mode.subscribe,
    enter: () => mode.set(true),
    leave: () => mode.set(false),
    toggle: () => mode.set(!mode.isPageFullscreen()),
  },
}));
vi.mock('../../utils/API/SpicyFetch', () => ({ default: vi.fn() }));
const playback = vi.hoisted(() => ({
  position: vi.fn(() => 12000),
  playing: vi.fn(() => true),
  release: vi.fn(),
  track: vi.fn(),
}));
vi.mock('../../utils/Gets/GetProgress', () => ({
  default: () => playback.position(),
  getPositionFor: playback.position,
  resolveIsPlaying: playback.playing,
  syncPlaybackPosition: vi.fn(),
  requestPositionTracking: () => {
    playback.track();
    return playback.release;
  },
}));

import {
  OpenNowBar,
  CloseNowBar,
  UpdateNowBar,
  Session_OpenNowBar,
  InvalidateNowBar,
} from './NowBar';
import Global from '../Global/Global';
import { SpotifyPlayer } from '../Global/SpotifyPlayer';
import Fullscreen from '../Utils/Fullscreen';
import lifecycle from '../../utils/lifecycle';

function page() {
  document.body.innerHTML = `<div id="AmaiLyricsPage"><div class="ContentBox">
    <div class="NowBar LeftSide"><div class="Header">
      <div class="Metadata"><div class="Artists"><span></span></div>
        <div class="SongName"><span></span></div></div>
      <div class="MediaBox"><img class="MediaImage" /><div class="MediaContent"></div></div>
      <div class="ViewControls"></div>
    </div></div><div class="DropZone LeftSide"></div><div class="DropZone RightSide"></div>
  </div></div>`;
}

beforeEach(() => {
  vi.useFakeTimers();
  page();
  mode.set(true);
  SpotifyPlayer.IsPlaying = true;
  SpotifyPlayer.LoopType = 'none';
  SpotifyPlayer.ShuffleType = 'none';
  playback.position.mockReturnValue(12000);
  playback.playing.mockReturnValue(true);
  playback.track.mockClear();
  playback.release.mockClear();
  vi.spyOn(SpotifyPlayer, 'GetArtists').mockResolvedValue(['Artist']);
  vi.spyOn(SpotifyPlayer, 'GetSongName').mockResolvedValue('Song');
  vi.spyOn(SpotifyPlayer, 'GetAlbumName').mockReturnValue('Album');
  vi.spyOn(SpotifyPlayer, 'GetTrackDuration').mockReturnValue(120000);
  vi.spyOn(SpotifyPlayer.Artwork, 'Get').mockResolvedValue('spotify:image:test');
});

afterEach(() => {
  CloseNowBar();
  document.body.innerHTML = '';
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('NowBar lifetime', () => {
  it('does not mount controls after closing during pending metadata', async () => {
    let resolveArtists!: (artists: string[]) => void;
    vi.mocked(SpotifyPlayer.GetArtists).mockReturnValue(
      new Promise<string[]>((resolve) => (resolveArtists = resolve)),
    );
    const opening = OpenNowBar();
    CloseNowBar();
    resolveArtists(['Late artist']);
    await opening;
    await vi.advanceTimersByTimeAsync(300);

    expect(document.querySelector('.PlaybackControls')).toBeNull();
    expect(document.querySelector('.Timeline')).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('cleans resources even when the page has already been detached', async () => {
    await OpenNowBar();
    await vi.advanceTimersByTimeAsync(300);
    document.body.innerHTML = '';
    CloseNowBar();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('repeated opens leave one timeline and no timers after close', async () => {
    await Promise.all([OpenNowBar(), OpenNowBar()]);
    await vi.advanceTimersByTimeAsync(300);
    expect(document.querySelectorAll('.Timeline')).toHaveLength(1);
    expect(document.querySelectorAll('.PlaybackControls')).toHaveLength(1);
    CloseNowBar();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('owns exactly one position consumer, updates paused seeks to zero, and releases tracking', async () => {
    await Promise.all([OpenNowBar(), OpenNowBar()]);
    await vi.advanceTimersByTimeAsync(300);
    expect(playback.track).toHaveBeenCalledTimes(1);
    expect(document.querySelector('.Time.Position')?.textContent).toBe('0:12');
    playback.playing.mockReturnValue(false);
    playback.position.mockReturnValue(0);
    await vi.advanceTimersByTimeAsync(100);
    expect(document.querySelector('.Time.Position')?.textContent).toBe('0:00');
    expect(playback.release).toHaveBeenCalledTimes(1);
    CloseNowBar();
    expect(playback.release).toHaveBeenCalledTimes(1);
  });

  it('retains vinyl updates after fullscreen exit without a progress loop', async () => {
    await OpenNowBar();
    await vi.advanceTimersByTimeAsync(100);
    Fullscreen.leave();
    expect(document.querySelector('.Timeline')).toBeNull();
    expect(document.querySelector('.ArtistData')).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
    SpotifyPlayer.IsPlaying = false;
    Global.Event.evoke('playback:playpause', { isPaused: true });
    expect(document.querySelector('.MediaImage')?.classList.contains('Playing')).toBe(false);
    SpotifyPlayer.IsPlaying = true;
    Global.Event.evoke('playback:playpause', {});
    expect(document.querySelector('.MediaImage')?.classList.contains('Playing')).toBe(true);
    Fullscreen.enter();
    await vi.advanceTimersByTimeAsync(100);
    expect(document.querySelectorAll('.Timeline')).toHaveLength(1);
    expect(playback.track).toHaveBeenCalledTimes(2);
  });

  it('renders commands optimistically without changing player observations', async () => {
    const pause = vi.spyOn(SpotifyPlayer, 'Pause').mockImplementation(() => {});
    const repeat = vi.spyOn(Spicetify.Player, 'setRepeat');
    const shuffle = vi.spyOn(Spicetify.Player, 'setShuffle');
    await OpenNowBar();
    const click = (selector: string) => document.querySelector<HTMLElement>(selector)!.click();
    click('.PlayStateToggle');
    expect(pause).toHaveBeenCalledOnce();
    expect(SpotifyPlayer.IsPlaying).toBe(true);
    expect(document.querySelector('.PlayStateToggle')?.classList.contains('Paused')).toBe(true);
    click('.LoopToggle');
    click('.LoopToggle');
    expect(repeat).toHaveBeenLastCalledWith(2);
    expect(SpotifyPlayer.LoopType).toBe('none');
    expect(document.querySelectorAll('.LoopToggle svg')).toHaveLength(1);
    click('.ShuffleToggle');
    expect(shuffle).toHaveBeenCalledWith(true);
    expect(SpotifyPlayer.ShuffleType).toBe('none');
    // Observations win on refresh, regardless of the forwarded raw event's shape.
    Global.Event.evoke('playback:playpause', { data: { isPaused: true } });
    expect(document.querySelector('.PlayStateToggle')?.classList.contains('Playing')).toBe(true);
    expect(document.querySelector('.LoopToggle')?.classList.contains('Enabled')).toBe(false);
    CloseNowBar();
  });

  it('preserves seeking and removes click listeners from detached controls', async () => {
    const seek = vi.spyOn(SpotifyPlayer, 'Seek').mockImplementation(() => {});
    await OpenNowBar();
    const slider = document.querySelector<HTMLElement>('.SliderBar')!;
    vi.spyOn(slider, 'getBoundingClientRect').mockReturnValue({ left: 0, width: 100 } as DOMRect);
    slider.dispatchEvent(new MouseEvent('click', { clientX: 50 }));
    expect(seek).toHaveBeenCalledWith(60000);
    expect(document.querySelector('.Time.Position')?.textContent).toBe('1:00');
    CloseNowBar();
    slider.dispatchEvent(new MouseEvent('click', { clientX: 25 }));
    expect(seek).toHaveBeenCalledTimes(1);
  });

  it('ignores metadata from the replaced page and from superseded refreshes', async () => {
    let resolveOld!: (artists: string[]) => void;
    vi.mocked(SpotifyPlayer.GetArtists).mockReturnValueOnce(
      new Promise<string[]>((resolve) => (resolveOld = resolve)),
    );
    const first = OpenNowBar();
    const oldPage = document.getElementById('AmaiLyricsPage')!;
    page();
    await OpenNowBar();
    resolveOld(['Stale']);
    await first;
    expect(oldPage.querySelector('.PlaybackControls')).toBeNull();
    expect(document.querySelector('.Artists span')?.textContent).toBe('Artist');
    let resolveSlow!: (artists: string[]) => void;
    vi.mocked(SpotifyPlayer.GetArtists).mockReturnValueOnce(
      new Promise<string[]>((resolve) => (resolveSlow = resolve)),
    );
    const slow = UpdateNowBar();
    vi.mocked(SpotifyPlayer.GetArtists).mockResolvedValue(['Newest']);
    await UpdateNowBar();
    resolveSlow(['Old']);
    await slow;
    expect(document.querySelector('.Artists span')?.textContent).toBe('Newest');
  });

  it('cancels pending drag styling and detaches drop listeners on close', async () => {
    await OpenNowBar();
    const drag = document.querySelector('.MediaContent')!;
    const zone = document.querySelector('.DropZone.RightSide')!;
    const root = document.querySelector('.NowBar')!;
    drag.dispatchEvent(new Event('dragstart'));
    CloseNowBar();
    await vi.advanceTimersByTimeAsync(10);
    expect(document.querySelector('.SomethingDragging')).toBeNull();
    zone.dispatchEvent(new Event('drop', { cancelable: true }));
    expect(root.classList.contains('LeftSide')).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('ignores fullscreen setup and open attempts after page destroy begins', async () => {
    let resolveArtists!: (artists: string[]) => void;
    vi.mocked(SpotifyPlayer.GetArtists).mockReturnValue(
      new Promise<string[]>((resolve) => (resolveArtists = resolve)),
    );
    const opening = OpenNowBar();
    CloseNowBar();
    resolveArtists(['Late artist']);
    await opening;
    // Page destroy begins (InvalidateNowBar), then a stale fullscreen setup completes.
    InvalidateNowBar();
    Fullscreen.leave();
    Fullscreen.enter();
    await vi.advanceTimersByTimeAsync(300);
    expect(document.querySelector('.PlaybackControls')).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
    // A new page open re-enables NowBar (latch reset).
    page();
    Session_OpenNowBar();
    await vi.advanceTimersByTimeAsync(300);
    expect(document.querySelector('.PlaybackControls')).not.toBeNull();
  });

  it('renders title and artists even when artwork lookup fails, and clears stale cover', async () => {
    vi.mocked(SpotifyPlayer.Artwork.Get).mockRejectedValueOnce(new Error('no cover'));
    await OpenNowBar();
    expect(document.querySelector('.SongName span')?.textContent).toBe('Song');
    expect(document.querySelector('.Artists span')?.textContent).toBe('Artist');
    await OpenNowBar();
    expect(document.querySelector('.MediaImage')?.getAttribute('src')).toBe('spotify:image:test');
    // Next track has no artwork: previous cover must not linger.
    vi.mocked(SpotifyPlayer.Artwork.Get).mockResolvedValueOnce('');
    await UpdateNowBar();
    const image = document.querySelector('.MediaImage')!;
    expect(image.getAttribute('src')).toBeNull();
    expect(image.hasAttribute('data-high-res')).toBe(false);
  });

  it('teardown invalidates an opening that is still awaiting metadata', async () => {
    let resolveArtists!: (artists: string[]) => void;
    vi.mocked(SpotifyPlayer.GetArtists).mockReturnValue(
      new Promise<string[]>((resolve) => (resolveArtists = resolve)),
    );
    const opening = OpenNowBar();
    lifecycle.disposeAll();
    resolveArtists(['Late artist']);
    await opening;
    await vi.advanceTimersByTimeAsync(300);
    expect(document.querySelector('.PlaybackControls')).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });
});
