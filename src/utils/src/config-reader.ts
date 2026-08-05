/* eslint-disable @typescript-eslint/no-use-before-define */
type ConfigResult<T> = {
  readonly key: string;
  readonly status: 'success' | 'missing' | 'errored';
  value: () => T;
  valueOrNull: () => T | null;
};

function success<T>(key: string, value: T): ConfigResult<T> {
  return {
    key,
    status: 'success',
    value: () => value,
    valueOrNull: () => value,
  };
}

function missing<T>(key: string): ConfigResult<T> {
  return {
    key,
    status: 'missing',
    value: () => {
      throw new Error(`${key} must be defined`);
    },
    valueOrNull: () => null,
  };
}

function errored<T>(key: string, error: Error): ConfigResult<T> {
  return {
    key,
    status: 'errored',
    value: () => {
      throw error;
    },
    valueOrNull: () => {
      throw error;
    },
  };
}

function extendNumberResult(
  result: ConfigResult<number>,
): ConfigResult<number> & {
  validateGreaterThan: (
    bound: number,
  ) => ReturnType<typeof validateGreaterThan>;
} {
  return {
    ...result,
    validateGreaterThan: (bound: number) => validateGreaterThan(result, bound),
  };
}

function extendStringResult(
  result: ConfigResult<string>,
): ConfigResult<string> & {
  asInt: () => ReturnType<typeof extendNumberResult>;
  asBoolean: () => ReturnType<typeof asBoolean>;
} {
  return {
    ...result,
    asInt: () => extendNumberResult(asInt(result)),
    asBoolean: () => asBoolean(result),
  };
}

function read(key: string) {
  const value = process.env[key];

  const result: ConfigResult<string> =
    typeof value === 'string' ? success(key, value.trim()) : missing(key);

  return extendStringResult(result);
}

function asInt(result: ConfigResult<string>): ConfigResult<number> {
  if (result.status === 'success') {
    const { key } = result;
    const value = result.value();

    if (/^[+-]?(\d+)$/.test(value)) {
      return success(key, Number(value));
    }

    return errored(
      key,
      new Error(`${key} is not valid. Expected an integer but got ${value}`),
    );
  }

  return result as unknown as ConfigResult<number>;
}

function asBoolean(result: ConfigResult<string>): ConfigResult<boolean> {
  if (result.status === 'success') {
    const { key } = result;
    const value = result.value();

    switch (value.toLowerCase()) {
      case 'true': {
        return success(key, true);
      }
      case 'false': {
        return success(key, false);
      }
      default: {
        return errored(
          key,
          new Error(
            `${key} is not valid. Expected true or false but got ${value}`,
          ),
        );
      }
    }
  }

  return result as unknown as ConfigResult<boolean>;
}

function validateGreaterThan(
  result: ConfigResult<number>,
  bound: number,
): ConfigResult<number> {
  if (result.status === 'success') {
    const { key } = result;
    const value = result.value();

    if (value < bound) {
      return errored(
        key,
        new Error(`${key} should be greater than ${bound} but got ${value}`),
      );
    }
  }

  return result;
}

function createConfigReader(preprocessKey: (key: string) => string) {
  const preprocessedRead = (key: string) => read(preprocessKey(key));

  return {
    read: preprocessedRead,
    tryGetValue: (key: string) => preprocessedRead(key).valueOrNull(),
    getValue: (key: string) => preprocessedRead(key).value(),
    tryGetInt: (key: string) => preprocessedRead(key).asInt().valueOrNull(),
    getInt: (key: string) => preprocessedRead(key).asInt().value(),
    tryGetBoolean: (key: string) =>
      preprocessedRead(key).asBoolean().valueOrNull(),
    getBoolean: (key: string) => preprocessedRead(key).asBoolean().value(),
  };
}

export function configReaderBuilder() {
  let builderPrefix: string;
  return {
    withPrefix(prefix: string) {
      builderPrefix = prefix;
      return this;
    },
    build(): ConfigReader {
      return createConfigReader((key: string) =>
        builderPrefix ? `${builderPrefix}_${key}` : key,
      );
    },
  };
}

export const defaultConfigReader = configReaderBuilder().build();

export type ConfigReader = ReturnType<typeof createConfigReader>;
export type ConfigReaderBuilder = ReturnType<typeof configReaderBuilder>;
