import { setSettingsMenu } from '../utils/settings';
import Platform from '../components/Global/Platform';
import { lyricsCache } from '../utils/Lyrics/cache';
import lifecycle from '../utils/lifecycle';

export class AppInitializer {
  public static async initializeCore() {
    // Clear lyrics cache on first startup only (a re-init must not wipe it).
    const windowRef = window as unknown as { __amaiCoreInitialized?: boolean };
    if (!windowRef.__amaiCoreInitialized) {
      lyricsCache.destroy();
      windowRef.__amaiCoreInitialized = true;
    }

    await this.injectGoogleFonts();
    await this.initializePlatformAndSettings();
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

  private static async initializePlatformAndSettings() {
    await Platform.OnSpotifyReady;
    setSettingsMenu();
  }

  public static setupPostLoadOptimizations() {
    // Mark dynamic backgrounds as loaded after the page has fully loaded
    const onLoad = () => {
      if (window.requestIdleCallback) {
        requestIdleCallback(
          () => {
            document.querySelectorAll('.sweet-dynamic-bg').forEach((bg) => {
              bg.classList.add('sweet-dynamic-bg-loaded');
            });
          },
          { timeout: 2000 },
        );
      } else {
        setTimeout(() => {
          document.querySelectorAll('.sweet-dynamic-bg').forEach((bg) => {
            bg.classList.add('sweet-dynamic-bg-loaded');
          });
        }, 1000);
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
