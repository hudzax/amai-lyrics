import { SpikyCache } from '@hudzax/web-modules/SpikyCache';

export interface BoundedCacheOptions {
  name: string;
  maxEntries: number;
  ttlMs: number;
  windowKey: string;
}

export interface BoundedCache<T> {
  get(key: string): Promise<T | null>;
  set(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  destroy(): Promise<void>;
}

const ENVELOPE_MARKER = 1;

interface Envelope<T> {
  __amaiBoundedCache: typeof ENVELOPE_MARKER;
  expiresAt: number;
  value: T;
}

function isEnvelope<T>(raw: unknown): raw is Envelope<T> {
  if (!raw || typeof raw !== 'object') return false;
  // SAFETY: raw is narrowed to a non-null object; only the envelope tag fields are read.
  const candidate = raw as Partial<Envelope<T>>;
  return (
    candidate.__amaiBoundedCache === ENVELOPE_MARKER &&
    typeof candidate.expiresAt === 'number' &&
    'value' in candidate
  );
}

export function createBoundedCache<T>(options: BoundedCacheOptions): BoundedCache<T> {
  const store = new SpikyCache({ name: options.name });
  // SAFETY: window augmentation for hot-reload persistence; the namespace is caller-supplied and isolated
  const windowRef = window as unknown as Record<string, string[] | undefined>;
  const keyOrder: string[] = windowRef[options.windowKey] ?? [];
  windowRef[options.windowKey] = keyOrder;

  function noteWrite(key: string): void {
    forget(key);
    keyOrder.push(key);
    // A persisted order may arrive longer than the current cap (lowered cap or
    // a foreign array under the window key), so trim until the bound holds.
    while (keyOrder.length > options.maxEntries) {
      const oldest = keyOrder.shift();
      // Fire-and-forget eviction — don't block the critical cache-write path
      if (oldest) store.remove(oldest).catch(() => {});
    }
  }

  function forget(key: string): void {
    const idx = keyOrder.indexOf(key);
    if (idx !== -1) keyOrder.splice(idx, 1);
  }

  return {
    async get(key: string): Promise<T | null> {
      try {
        const raw: unknown = await store.get(key);
        if (raw === null || raw === undefined) return null;
        // Another format or expired: evict and let the caller re-fetch.
        if (!isEnvelope<T>(raw) || raw.expiresAt < Date.now()) {
          forget(key);
          await store.remove(key);
          return null;
        }
        return raw.value;
      } catch {
        // A corrupt entry is a miss, not an error the caller must handle.
        return null;
      }
    },

    async set(key: string, value: T): Promise<void> {
      const envelope: Envelope<T> = {
        __amaiBoundedCache: ENVELOPE_MARKER,
        expiresAt: Date.now() + options.ttlMs,
        value,
      };
      await store.set(key, envelope);
      noteWrite(key);
    },

    async remove(key: string): Promise<void> {
      forget(key);
      await store.remove(key);
    },

    async destroy(): Promise<void> {
      await store.destroy();
      keyOrder.length = 0;
    },
  };
}
