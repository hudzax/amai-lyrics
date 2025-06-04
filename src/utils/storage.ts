const prefix = 'SpicyLyrics-';

let currentlyFetching = false;

function set(key: 'currentlyFetching', value: boolean): void;
function set(key: string, value: string): void;
function set(key: string, value: boolean | string) {
  if (key === 'currentlyFetching') {
    currentlyFetching = value as boolean;
    return;
  }
  Spicetify.LocalStorage.set(`${prefix}${key}`, value as string);
}

function get(key: string) {
  if (key === 'currentlyFetching') {
    return currentlyFetching;
  }
  return Spicetify.LocalStorage.get(`${prefix}${key}`);
}

export default {
  set,
  get,
};
