// eventManager.js

const eventRegistry = new Map<
  string,
  Map<number, (...args: unknown[]) => void>
>();

let nextId = 1;

const listen = (
  eventName: string,
  callback: (...args: unknown[]) => void,
): number => {
  if (!eventRegistry.has(eventName)) {
    eventRegistry.set(
      eventName,
      new Map<number, (...args: unknown[]) => void>(),
    );
  }

  const id = nextId++;
  eventRegistry.get(eventName)!.set(id, callback);
  return id;
};

const unListen = (id: number): boolean => {
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

const evoke = (eventName: string, ...args: unknown[]) => {
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
  evoke,
};

export default Event;
