import { newCache } from '../../cache';

describe('newCache', () => {
  const date = new Date('2020-01-01');

  test('caches calls to an async function', async () => {
    const fetchFn = jest.fn(async () => ({ value: 'value' }));

    const cache = newCache<string, string>(() => date, fetchFn);

    expect(await cache.getCachedAsync('key')).toBe('value');
    expect(await cache.getCachedAsync('key')).toBe('value');

    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  test('can be cleared', async () => {
    const fetchFn = jest.fn(async () => ({ value: 'value' }));

    const cache = newCache<string, string>(() => date, fetchFn);

    expect(await cache.getCachedAsync('key')).toBe('value');

    cache.clear();

    expect(await cache.getCachedAsync('key')).toBe('value');

    expect(fetchFn).toHaveBeenCalledTimes(2);
  });
});
