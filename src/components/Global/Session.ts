import Global from './Global';

interface Location {
  pathname: string;
  search?: string;
  hash?: string;
  state?: Record<string, unknown>;
}

let sessionHistory: Location[] = [];

const Session = {
  Navigate: (data: Location) => {
    Spicetify.Platform.History.push(data);
    //Session.PushToHistory(data);
  },
  GoBack: () => {
    if (sessionHistory.length > 1) {
      Session.Navigate(sessionHistory[sessionHistory.length - 2]);
    } else {
      Session.Navigate({ pathname: '/' });
    }
  },
  GetPreviousLocation: () => {
    if (sessionHistory.length > 1) {
      return sessionHistory[sessionHistory.length - 2];
    }
    return null;
  },
  RecordNavigation: (data: Location) => {
    Session.PushToHistory(data);
    Global.Event.evoke('session:navigation', data);
  },
  FilterOutTheSameLocation: (data: Location) => {
    sessionHistory = sessionHistory.filter(
      (location) =>
        location.pathname !== data.pathname &&
        location.search !== data?.search &&
        location.hash !== data?.hash,
    );
  },
  PushToHistory: (data: Location) => {
    sessionHistory.push(data);
  },
};

window._spicy_lyrics_session = Session;

export default Session;
