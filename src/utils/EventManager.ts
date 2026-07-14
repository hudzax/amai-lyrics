// eventManager.js

// The bus is persisted on `window` so it survives Spicetify script
// re-injection (watch/reload). A fresh module evaluation would otherwise
// create a new registry, leaving teardown's `unListen` targeting the wrong
// (orphaned) bus. Backing it with `window` keeps a single shared bus whose
// listeners are genuinely removed on teardown.
type EventRegistry = Map<string, Map<number, (...args: unknown[]) => void>>;

const windowRef = window as unknown as {
  __amaiEventRegistry?: EventRegistry;
  __amaiEventNextId?: number;
};

const eventRegistry: EventRegistry =
  windowRef.__amaiEventRegistry ?? new Map<string, Map<number, (...args: unknown[]) => void>>();
windowRef.__amaiEventRegistry = eventRegistry;

let nextId: number = windowRef.__amaiEventNextId ?? 1;

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
  windowRef.__amaiEventNextId = nextId;
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
