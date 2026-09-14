import { Icons } from '../components/Styling/Icons';
import Session from '../components/Global/Session';
import Whentil from '../utils/Whentil';
import lifecycle from '../utils/lifecycle';

export class ButtonManager {
  private button: Spicetify.Playbar.Button;
  private buttonRegistered = false;
  /** Our replacement tooltip (themed); destroyed with the manager. */
  private playbarTippy: { destroy: () => void } | null = null;

  constructor() {
    this.button = this.createButton();
    this.setupEventListeners();
  }

  private createButton(): Spicetify.Playbar.Button {
    const button = new Spicetify.Playbar.Button(
      'Amai Lyrics',
      Icons.LyricsPage,
      (self) => {
        if (!self.active) {
          Session.Navigate({ pathname: '/AmaiLyrics' });
        } else {
          Session.GoBack();
        }
      },
      false as boolean,
      false as boolean,
    );

    // Spicetify builds the button's tooltip internally with TippyProps'
    // custom render, which Spotify leaves completely unstyled (bare text, no
    // bubble) — and `theme` is a no-op with that render. On top of that,
    // Spicetify.Tippy itself loads asynchronously, so if it isn't ready yet
    // the button ends up with no tippy at all (native `title` fallback).
    // Once Tippy exists we therefore swap in our own instance (default
    // render → `.tippy-box[data-theme='amai-lyrics']`, styled in
    // src/css/Tooltips.css) and point the button at it, so any later
    // internal `label` update still lands on our tooltip.
    const tooltipWhen = Whentil.When(
      () => Spicetify.Tippy,
      () => {
        try {
          button.tippy?.destroy?.();
        } catch {
          /* internal tooltip already gone — nothing to clean up */
        }
        button.element.removeAttribute('title');
        this.playbarTippy = Spicetify.Tippy(button.element, {
          content: 'Amai Lyrics',
          theme: 'amai-lyrics',
          animation: 'amai',
          arrow: false,
          delay: [200, 0],
          placement: 'top',
        });
        button.tippy = this.playbarTippy;
      },
    );
    lifecycle.trackWhentil(tooltipWhen);

    return button;
  }

  private setupEventListeners() {
    // Set up listener to automatically update button registration when track type changes
    const when = Whentil.When(
      () => Spicetify.Player.data.item?.type,
      () => this.updateRegistration(),
    );
    lifecycle.trackWhentil(when);
  }

  /** Remove the playbar button and release its subscription on teardown. */
  public dispose() {
    try {
      this.playbarTippy?.destroy();
    } catch {
      /* tooltip already gone */
    }
    this.playbarTippy = null;
    try {
      this.button.deregister();
    } catch {
      /* button may already be gone */
    }
  }

  public updateRegistration() {
    const IsSomethingElseThanTrack = Spicetify.Player.data.item?.type !== 'track';
    if (IsSomethingElseThanTrack) {
      this.button.deregister();
      this.buttonRegistered = false;
    } else {
      if (!this.buttonRegistered) {
        this.button.register();
        this.buttonRegistered = true;
      }
    }
  }

  public setActive(active: boolean) {
    this.button.active = active;
  }
}
