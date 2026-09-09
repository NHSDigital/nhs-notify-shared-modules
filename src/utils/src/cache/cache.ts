import { defaultConfigReader as config } from '../config-reader';

const DEFAULT_CACHE_TIME_MILLISECONDS = 60_000 * 10; // 10 minutes

type Result<T> = {
  value: T;
  cacheTime?: number;
};

const newCache = <KeyType, ValueType>(
  getCurrentTime: () => Date,
  fetch: (k: KeyType) => Promise<Result<ValueType>>,
) => {
  const cacheTimeMilliSec =
    config.tryGetInt('DEFAULT_CACHE_TIME_MILLISECONDS') ??
    DEFAULT_CACHE_TIME_MILLISECONDS;

  type Holder = {
    value: ValueType;
    timestamp: Date | undefined;
  };

  type State = Record<string, Holder>;

  let state: State = {};

  let stateCacheTime = 0;

  async function getCachedAsync(key: KeyType): Promise<ValueType> {
    const flatKey: string = typeof key === 'string' ? key : JSON.stringify(key);

    const currentTime = getCurrentTime();
    const holder: Holder = state[flatKey];
    if (
      holder?.timestamp &&
      // eslint-disable-next-line sonarjs/different-types-comparison
      stateCacheTime !== undefined &&
      currentTime.getTime() - holder.timestamp.getTime() < stateCacheTime
    ) {
      return holder.value;
    }

    // value not cached or expired, so fetch a new value from upstream
    const result: Result<ValueType> = await fetch(key);

    const cacheTime = result.cacheTime ?? cacheTimeMilliSec;

    if (cacheTime) {
      stateCacheTime = cacheTime;
    }

    state[flatKey] = {
      value: result.value,
      timestamp: currentTime,
    };
    return result.value;
  }

  function clear() {
    state = {};
  }

  return { getCachedAsync, clear };
};

export { newCache };
