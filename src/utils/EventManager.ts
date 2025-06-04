// eventManager.js

const eventRegistry = new Map();

let nextId = 1;

const listen = (eventName: any, callback: any) => {
  if (!eventRegistry.has(eventName)) {
    eventRegistry.set(eventName, new Map());
  }

  const id = nextId++;
  eventRegistry.get(eventName).set(id, callback);
  return id;
};

const unListen = (id: any) => {
  for (const [eventName, listeners] of eventRegistry) {
    if (listeners.has(id)) {
      listeners.delete(id);
      if (listeners.size === 0) {
        eventRegistry.delete(eventName);
      }
      return true; // Listener removed
    }
  }
  return false; // Listener not found
};

const evoke = (eventName: any, ...args: any[]) => {
  const listeners = eventRegistry.get(eventName);
  if (listeners) {
    for (const callback of listeners.values()) {
      callback(...args);
    }
  }
};


const Event = {
    listen,
    unListen,
    evoke
}

export default Event;