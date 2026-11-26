import { setSettingsMenu } from '../utils/settings';
import Platform from '../components/Global/Platform';
import { invalidateLyrics } from '../utils/Lyrics/fetchLyrics';
import lifecycle from '../utils/lifecycle';
import { applyThemeSettings } from '../utils/ThemeSettings';
import { APP_BG_CONTAINER_CLASS, APP_BG_LOADED_CLASS } from '../components/DynamicBG/identity';

export class AppInitializer {
  public static async initializeCore(): Promise<boolean> {
    const generation = lifecycle.captureGeneration();

    // Clear lyrics cache on first startup only (a re-init must not wipe it).
    // Await the invalidation before latching startup complete: a concurrent
    // first fetch must not read the snapshot this pass is about to clear, and a
    // failed invalidation must remain retryable on the next injection.
    const windowRef = window as unknown as { __amaiCoreInitialized?: boolean };
    if (!windowRef.__amaiCoreInitialized) {
      await invalidateLyrics({ all: true });
      if (!lifecycle.isCurrentGeneration(generation)) return false;
      windowRef.__amaiCoreInitialized = true;
    }

    await this.injectGoogleFonts();
    if (!lifecycle.isCurrentGeneration(generation)) return false;
    return this.initializePlatformAndSettings(generation);
  }

  private static async injectGoogleFonts() {
    // Dedup: hot-reload re-runs main() → don't pile identical <link>s in <head>.
    // Use id rather than href match — href encoding variations would miss.
    if (document.getElementById('amai-google-fonts')) return;

    const href =
      'https://fonts.googleapis.com/css2?family=Noto+Sans+Display:ital,wght@0,100..900;1,100..900&display=swap';

    const fontLink = document.createElement('link');
    fontLink.id = 'amai-google-fonts';
    fontLink.rel = 'preload';
    fontLink.as = 'style';
    fontLink.href = href;
    // Preload without crossOrigin may warn; fonts are CORS-enabled.
    fontLink.crossOrigin = 'anonymous';
    document.head.appendChild(fontLink);

    fontLink.onload = () => {
      fontLink.rel = 'stylesheet';
    };
  }

  private static async initializePlatformAndSettings(generation: number): Promise<boolean> {
    await Platform.OnSpotifyReady;
    if (!lifecycle.isCurrentGeneration(generation)) return false;
    setSettingsMenu();
    // Publish the Amai Theme intensity/motion presets before any canvas can
    // paint (idempotent inline root vars + motion-off class — see ThemeSettings).
    applyThemeSettings();
    return true;
  }

  public static setupPostLoadOptimizations() {
    // Mark dynamic backgrounds as loaded after the page has fully loaded
    const onLoad = () => {
      const markLoaded = () => {
        document.querySelectorAll(`.${APP_BG_CONTAINER_CLASS}`).forEach((bg) => {
          bg.classList.add(APP_BG_LOADED_CLASS);
        });
      };
      if (typeof window.requestIdleCallback === 'function') {
        requestIdleCallback(markLoaded, { timeout: 2000 });
      } else {
        setTimeout(markLoaded, 1000);
      }
    };
    lifecycle.trackWindow('load', onLoad);
  }

  public static setupSkeletonStyles() {
    // Dedup: same keyframe name re-injected on every hot-reload would grow <head> forever.
    if (document.getElementById('amai-skeleton-style')) return;
    const skeletonStyle = document.createElement('style');
    skeletonStyle.id = 'amai-skeleton-style';
    skeletonStyle.textContent = `
        @keyframes skeleton {
          to {
            background-position-x: 0
          }
        }
    `;
    document.head.appendChild(skeletonStyle);
  }
}
