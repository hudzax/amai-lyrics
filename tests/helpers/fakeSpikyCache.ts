// In-memory fake at the SpikyCache package seam: one shared store per cache
// name, mirroring how real same-named SpikyCache instances share the disk cache.
const stores = new Map<string, Map<string, unknown>>();

export function storeFor(name: string): Map<string, unknown> {
  let store = stores.get(name);
  if (!store) {
    store = new Map();
    stores.set(name, store);
  }
  return store;
}

export class FakeSpikyCache {
  static instances: FakeSpikyCache[] = [];
  private name: string;

  constructor(options: { name: string }) {
    this.name = options.name;
    FakeSpikyCache.instances.push(this);
  }

  async get(key: string): Promise<unknown> {
    return storeFor(this.name).get(key) ?? null;
  }

  async set(key: string, value: unknown): Promise<void> {
    storeFor(this.name).set(key, value);
  }

  async remove(key: string): Promise<void> {
    storeFor(this.name).delete(key);
  }

  async destroy(): Promise<void> {
    storeFor(this.name).clear();
  }
}

export function resetFakeSpikyCache(): void {
  stores.clear();
  FakeSpikyCache.instances.length = 0;
}

// Mirrors the package's export name so tests can mock the module with this file wholesale.
export { FakeSpikyCache as SpikyCache };
