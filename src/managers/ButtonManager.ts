import { Icons } from '../components/Styling/Icons';
import Session from '../components/Global/Session';
import Whentil from '../utils/Whentil';

export class ButtonManager {
  private button: Spicetify.Playbar.Button;
  private buttonRegistered = false;

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

    button.tippy.setContent('Amai Lyrics');
    return button;
  }

  private setupEventListeners() {
    // Set up listener to automatically update button registration when track type changes
    Whentil.When(
      () => Spicetify.Player.data.item?.type,
      () => this.updateRegistration(),
    );
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

  public getButton(): Spicetify.Playbar.Button {
    return this.button;
  }

  public setActive(active: boolean) {
    this.button.active = active;
  }
}
