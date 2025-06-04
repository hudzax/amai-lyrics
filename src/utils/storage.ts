const prefix = "SpicyLyrics-";

let currentlyFetching = false;

function set(key: string, value: any) {
    if (key === "currentlyFetching") {
        currentlyFetching = value;
        return;
    }
    Spicetify.LocalStorage.set(`${prefix}${key}`, value);
}

function get(key: string) {
    if (key === "currentlyFetching") {
        return currentlyFetching;
    }
    return Spicetify.LocalStorage.get(`${prefix}${key}`)
}

export default {
    set,
    get
}