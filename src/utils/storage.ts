const prefix = 'SpicyLyrics-';

function set(key: string, value: string): void {
  Spicetify.LocalStorage.set(`${prefix}${key}`, value as string);
}

function get(key: string) {
  return Spicetify.LocalStorage.get(`${prefix}${key}`);
}

export default {
  set,
  get,
};
