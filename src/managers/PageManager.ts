import Global from '../components/Global/Global';
import { ButtonManager } from './ButtonManager';
import lifecycle from '../utils/lifecycle';
import { isLyricsRoute } from '../utils/PagePresence';

export class PageManager {
  private buttonManager: ButtonManager;
  private navigationGeneration = 0;
  private disposed = false;

  constructor(buttonManager: ButtonManager) {
    this.buttonManager = buttonManager;
    this.setupPageNavigation();
    lifecycle.trackCallback(() => this.dispose());
  }

  private dispose(): void {
    this.disposed = true;
    this.navigationGeneration++;
  }

  private isLatest(generation: number): boolean {
    return !this.disposed && generation === this.navigationGeneration;
  }

  private setupPageNavigation() {
    const unsubscribe = Spicetify.Platform.History.listen((location: { pathname: string }) => {
      void this.loadPage(location);
    });
    lifecycle.trackHistory(unsubscribe);

    if (isLyricsRoute(Spicetify.Platform.History.location.pathname)) {
      const id = Global.Event.listen('pagecontainer:available', () => {
        void this.loadPage(Spicetify.Platform.History.location);
      });
      lifecycle.trackGlobalEvent(id);
    }
  }

  private async loadPage(location: { pathname: string }) {
    const generation = ++this.navigationGeneration;
    const { default: PageView } = await import('../components/Pages/PageView');
    if (!this.isLatest(generation)) return;

    if (isLyricsRoute(location.pathname)) {
      await PageView.Open();
      if (!this.isLatest(generation)) return;
      this.buttonManager.setActive(true);
    } else {
      // Destroy is idempotent and also invalidates an open that has not reached
      // PageView.IsOpened yet. Only the latest navigation may update the button.
      await PageView.Destroy();
      if (!this.isLatest(generation)) return;
      this.buttonManager.setActive(false);
    }
  }
}
