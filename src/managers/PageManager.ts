import Global from '../components/Global/Global';
import { ButtonManager } from './ButtonManager';

export class PageManager {
  private buttonManager: ButtonManager;
  private lastLocation: { pathname: string } | null = null;

  constructor(buttonManager: ButtonManager) {
    this.buttonManager = buttonManager;
    this.setupPageNavigation();
  }

  private setupPageNavigation() {
    Spicetify.Platform.History.listen((location: { pathname: string }) => {
      this.loadPage(location);
    });

    if (Spicetify.Platform.History.location.pathname === '/AmaiLyrics') {
      Global.Event.listen('pagecontainer:available', () => {
        this.loadPage(Spicetify.Platform.History.location);
        this.buttonManager.setActive(true);
      });
    }
  }

  private async loadPage(location: { pathname: string }) {
    const { default: PageView } = await import('../components/Pages/PageView');

    if (location.pathname === '/AmaiLyrics') {
      PageView.Open();
      this.buttonManager.setActive(true);
    } else {
      if (this.lastLocation?.pathname === '/AmaiLyrics') {
        PageView.Destroy();
        this.buttonManager.setActive(false);
      }
    }
    this.lastLocation = location;
  }
}
