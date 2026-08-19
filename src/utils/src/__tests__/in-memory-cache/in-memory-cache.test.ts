import { InMemoryCache } from '../../in-memory-cache';

function setup() {
  const cache = new InMemoryCache();

  return { cache };
}

describe('cache', () => {
  it('get returns null if the key is not set', async () => {
    const { cache } = setup();

    await cache.acquireLock();

    const result = await cache.get('foo');

    expect(result).toBe(null);
  });

  it('get returns the cached value if the key is set', async () => {
    const { cache } = setup();

    const key = 'foo';
    const value = { foo: 'bar' };

    await cache.acquireLock();

    await cache.set(key, value);

    const result = await cache.get(key);

    expect(result).toBe(value);
  });

  it('delete removes the cached value', async () => {
    const { cache } = setup();

    const key = 'foo';
    const value = { foo: 'bar' };

    await cache.acquireLock();

    await cache.set(key, value);

    await cache.delete(key);

    const result = await cache.get(key);

    expect(result).toBe(null);
  });

  describe('setAll', () => {
    it('should set the cache to the value provided when the cache is initially empty', async () => {
      const { cache } = setup();
      await cache.acquireLock();

      const updates = new Map<string, string>();
      updates.set('key1', 'value1');
      updates.set('key2', 'value2');

      await cache.setAll(updates);

      const res1 = await cache.get<string>('key1');
      expect(res1).toEqual('value1');

      const res2 = await cache.get<string>('key2');
      expect(res2).toEqual('value2');
    });

    it('should set merge the cache provided with the cache in mem', async () => {
      const { cache } = setup();

      await cache.acquireLock();
      await cache.set<string>('key1', 'value1');
      await cache.set<string>('key2', 'value2');

      const updates = new Map<string, string>();
      updates.set('key2', 'updated value2');
      updates.set('key3', 'value3');

      await cache.setAll<string>(updates);

      const res1 = await cache.get<string>('key1');
      expect(res1).toEqual('value1');

      const res2 = await cache.get<string>('key2');
      expect(res2).toEqual('updated value2');

      const res3 = await cache.get<string>('key3');
      expect(res3).toEqual('value3');
    });
  });

  describe('entries', () => {
    it('returns an array of all key-value pairs in the cache', async () => {
      const { cache } = setup();
      await cache.acquireLock();

      const updates = new Map<string, string>();
      updates.set('key1', 'value1');
      updates.set('key2', 'value2');

      await cache.setAll(updates);

      const result = await cache.entries();

      expect(result).toHaveLength(2);
      expect(result).toContainEqual(['key1', 'value1']);
      expect(result).toContainEqual(['key2', 'value2']);
    });
  });
});

describe('lock', () => {
  beforeAll(() => {
    jest.useFakeTimers({ advanceTimers: true });
    jest.spyOn(globalThis, 'setTimeout');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('errors if the lock is not acquired when calling get', async () => {
    expect.hasAssertions();

    const { cache } = setup();

    await expect(cache.get('foo')).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Cannot access in-memory cache without first obtaining mutex lock"`,
    );

    expect(setTimeout).toHaveBeenCalledTimes(3);
  });

  it('errors if the lock is not acquired when calling set', async () => {
    expect.hasAssertions();

    const { cache } = setup();

    await expect(
      cache.set('foo', 'bar'),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Cannot access in-memory cache without first obtaining mutex lock"`,
    );

    expect(setTimeout).toHaveBeenCalledTimes(3);
  });

  it('errors if the lock is not acquired when calling delete', async () => {
    expect.hasAssertions();

    const { cache } = setup();

    await expect(
      cache.delete('foo'),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Cannot access in-memory cache without first obtaining mutex lock"`,
    );

    expect(setTimeout).toHaveBeenCalledTimes(3);
  });

  it('prevents further access to the cache until released', async () => {
    expect.hasAssertions();

    const { cache } = setup();

    // two processes trying to acquire the lock and access the cache at the same time
    const p1 = (async () => {
      const r = await cache.acquireLock();

      await cache.set('foo', 'bar');

      return r;
    })();

    const p2 = (async () => {
      const r = await cache.acquireLock();
      const result = await cache.get('foo');
      r();
      return result;
    })();

    const release = await p1;

    setTimeout(() => {
      release();
    }, 1000);

    jest.advanceTimersByTime(1000);

    // assert that the second promise does not resolve until the first has released the lock
    // and that the value is consistent with the value set by first process
    await expect(p2).resolves.toBe('bar');
  });
});

describe('ttl', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-07-18T15:07:52.000Z'));
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns the item if the global ttl has not expired', async () => {
    const cache = new InMemoryCache({ ttl: 1000 });

    await cache.acquireLock();

    await cache.set('foo', 'bar');

    await jest.advanceTimersByTimeAsync(999);

    const result = await cache.get('foo');

    expect(result).toBe('bar');
  });

  it('returns null if the global ttl has expired', async () => {
    const cache = new InMemoryCache({ ttl: 1000 });

    await cache.acquireLock();

    await cache.set('foo', 'bar');

    await jest.advanceTimersByTimeAsync(1000);

    const result = await cache.get('foo');

    expect(result).toBe(null);
  });

  it('returns the item if the local ttl has not expired', async () => {
    const cache = new InMemoryCache({ ttl: 1000 });

    await cache.acquireLock();

    await cache.set('foo', 'bar', { ttl: 500 });

    await jest.advanceTimersByTimeAsync(499);

    const result = await cache.get('foo');

    expect(result).toBe('bar');
  });

  it('returns null if the local ttl has expired', async () => {
    const cache = new InMemoryCache({ ttl: 1000 });

    await cache.acquireLock();

    await cache.set('foo', 'bar', { ttl: 500 });

    await jest.advanceTimersByTimeAsync(500);

    const result = await cache.get('foo');

    expect(result).toBe(null);
  });

  it('returns the value if the local ttl has not expired but global has', async () => {
    const cache = new InMemoryCache({ ttl: 1000 });

    await cache.acquireLock();

    await cache.set('foo', 'bar', { ttl: 1500 });

    await jest.advanceTimersByTimeAsync(1499);

    const result = await cache.get('foo');

    expect(result).toBe('bar');
  });

  it('can disable ttl on individual items when a global is set', async () => {
    const cache = new InMemoryCache({ ttl: 1000 });

    await cache.acquireLock();

    await cache.set('foo', 'bar', { ttl: 0 });

    await jest.advanceTimersByTimeAsync(1000);

    const result = await cache.get('foo');

    expect(result).toBe('bar');
  });

  it('entries does not return expired items', async () => {
    const cache = new InMemoryCache({ ttl: 1000 });

    await cache.acquireLock();

    await cache.set('foo', 'bar');
    await cache.set('foo2', 'bar2', { ttl: 500 });
    await cache.set('foo3', 'bar3', { ttl: 1500 });

    await jest.advanceTimersByTimeAsync(1000);

    const result = await cache.entries();

    expect(result).toHaveLength(1);
    expect(result).toContainEqual(['foo3', 'bar3']);
  });
});
