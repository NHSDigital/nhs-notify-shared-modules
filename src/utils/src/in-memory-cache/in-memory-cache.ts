import { Mutex } from 'async-mutex';
import { logger } from '../logger';
import { CacheItem } from './cache-item';

export type LockReleaser = () => void;

type CacheOptions = {
  /**
   * ms to persist the item in the cache.
   * If omitted or given as a non-positive value, the item will not expire
   */
  ttl?: number;
};

type TTL = number | null;

export interface ICache {
  acquireLock(): Promise<LockReleaser>;
  entries<T = unknown>(): Promise<[string, T][]>;
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, opts?: CacheOptions): Promise<void>;
  setAll<T>(cache: Map<string, T>, opts?: CacheOptions): Promise<void>;
  delete(key: string): Promise<void>;
}

export class InMemoryCache implements ICache {
  private cache = new Map<string, CacheItem>();

  private readonly lock = new Mutex();

  private readonly logger = logger;

  private readonly ttl: TTL;

  constructor(opts: CacheOptions = {}) {
    this.ttl = InMemoryCache.parseTtl(opts.ttl);
  }

  /**
   * Acquire the mutex lock protecting this cache.
   * This MUST be called before accessing the cache.
   * Returns a releaser function which MUST be called once access to the cache is complete.
   * Failure to release the lock can cause deadlock issues for other processes trying to access the cache.
   */
  async acquireLock(): Promise<LockReleaser> {
    return this.lock.acquire();
  }

  async directGet<T>(key: string): Promise<T | null> {
    const found = this.cache.get(key);

    if (found) {
      this.logger.debug(`In-memory cache hit for key "${key}"`);

      if (found.isExpired) {
        await this.delete(key);
        this.logger.debug(
          `Cached item expired. Deleted cached item for key "${key}"`,
        );
      } else {
        return found.data as T;
      }
    }

    this.logger.debug(`In-memory cache missed for key "${key}"`);

    return null;
  }

  async get<T>(key: string): Promise<T | null> {
    await this.checkLock();

    return this.directGet(key);
  }

  async entries<T = unknown>(): Promise<[string, T][]> {
    await this.checkLock();

    return [...this.cache.entries()]
      .filter(([, v]) => !v.isExpired)
      .map(([k, v]) => [k, v.data]) as [string, T][];
  }

  async set<T>(key: string, value: T, opts: CacheOptions = {}): Promise<void> {
    const ttl = InMemoryCache.parseTtl(opts.ttl);

    await this.checkLock();
    this.cache.set(key, new CacheItem(value, this.getItemTtl(ttl)));
    this.logger.debug(`Key "${key}" set in in-memory cache`);
  }

  async delete(key: string): Promise<void> {
    await this.checkLock();

    this.cache.delete(key);
    this.logger.debug(`Key "${key}" deleted from in-memory cache`);
  }

  async setAll<T>(
    cache: Map<string, T>,
    opts: CacheOptions = {},
  ): Promise<void> {
    const ttl = InMemoryCache.parseTtl(opts.ttl);

    await this.checkLock();

    const items = [...cache.entries()].map(
      ([key, value]) =>
        [key, new CacheItem(value, this.getItemTtl(ttl))] as [
          string,
          CacheItem<T>,
        ],
    );

    this.cache = new Map([...this.cache.entries(), ...items]);
  }

  private async checkLock() {
    let attempts = 1;

    while (attempts <= 3) {
      if (this.lock.isLocked()) {
        return;
      }
      await new Promise((resolve) => {
        setTimeout(resolve, 1000);
      });
      this.logger.warn(`Check ${attempts} of in-memory cache lock failed.`);
      attempts += 1;
    }

    throw new Error(
      'Cannot access in-memory cache without first obtaining mutex lock',
    );
  }

  private static parseTtl(ttl?: number): TTL {
    return typeof ttl === 'number' ? ttl : null;
  }

  private getItemTtl(ttl: TTL) {
    if (ttl !== null) return ttl;

    if (this.ttl !== null) return this.ttl;

    return null;
  }
}
