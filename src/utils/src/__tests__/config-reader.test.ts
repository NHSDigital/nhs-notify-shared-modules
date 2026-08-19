import { configReaderBuilder } from '../config-reader';

process.env.AN_INT = '462';
process.env.A_NEGATIVE_INT = '-94';
process.env.A_FLOAT = '3.14159265359'; // 🥧
process.env.HAS_EXTRA_WHITESPACE = '     hello  ';

describe('configReader', () => {
  const config = configReaderBuilder().build();
  describe.each([config.getValue, config.getInt, config.getBoolean])(
    '%p',
    (func) => {
      it('will throw when it can not resolve the requested key', () => {
        expect(() => func('SOME_NONEXISTENT_VALUE')).toThrow(
          'SOME_NONEXISTENT_VALUE must be defined',
        );
      });
    },
  );

  describe.each([config.getValue, config.tryGetValue])('%p', (func) => {
    it('will trim whitespace from value', () => {
      expect(func('HAS_EXTRA_WHITESPACE')).toBe('hello');
    });
  });

  describe.each([config.tryGetValue, config.tryGetInt, config.tryGetBoolean])(
    '%p',
    (func) => {
      it('will return null when it can not resolve the requested key', () => {
        expect(func('SOME_NONEXISTENT_VALUE')).toBe(null);
      });
    },
  );

  describe.each([config.getInt, config.tryGetInt])('%p', (func) => {
    it('will convert a value to an integer', () => {
      expect(func('AN_INT')).toBe(462);
    });

    it('will convert a negative value to an integer', () => {
      expect(func('A_NEGATIVE_INT')).toBe(-94);
    });

    // It is safer to thrown for a malformed value as this is more likely to be a configuration
    // error than an attempt to no pass a value. Even for tryGetInt.
    it('will throw if value is not an int', () => {
      expect(() => func('A_FLOAT')).toThrow(
        'A_FLOAT is not valid. Expected an integer but got 3.14159265359',
      );
    });
  });

  describe.each([config.getBoolean, config.tryGetBoolean])('%p', (func) => {
    test.each(['true', 'True'])('will convert %p to true', (string) => {
      process.env.IS_TRUE = string;
      expect(func('IS_TRUE')).toBe(true);
    });

    test.each(['false', 'False'])('will convert %p to false', (string) => {
      process.env.IS_FALSE = string;
      expect(func('IS_FALSE')).toBe(false);
    });
  });

  describe('fluent interface', () => {
    it('can valdiate a minimun integer', () => {
      expect(() =>
        config.read('AN_INT').asInt().validateGreaterThan(500).value(),
      ).toThrow('AN_INT should be greater than 500 but got 462');
    });
  });
});

describe('prefixedConfigReader', () => {
  const prefixedConfig = configReaderBuilder().withPrefix('PREFIXED').build();

  describe.each([
    prefixedConfig.getValue,
    prefixedConfig.getInt,
    prefixedConfig.getBoolean,
  ])('%p', (func) => {
    it('will throw when it can not resolve the requested key', () => {
      expect(() => func('SOME_NONEXISTENT_VALUE')).toThrow(
        'PREFIXED_SOME_NONEXISTENT_VALUE must be defined',
      );
    });
  });

  describe.each([prefixedConfig.getValue, prefixedConfig.tryGetValue])(
    '%p',
    (func) => {
      it('will return the configured value', () => {
        process.env.PREFIXED_TEXT = 'hello';
        expect(func('TEXT')).toBe('hello');
      });
    },
  );

  describe.each([prefixedConfig.getInt, prefixedConfig.tryGetInt])(
    '%p',
    (func) => {
      it('will return the configured value', () => {
        process.env.PREFIXED_INT = '25633';
        expect(func('INT')).toBe(25_633);
      });
    },
  );

  describe.each([prefixedConfig.getBoolean, prefixedConfig.tryGetBoolean])(
    '%p',
    (func) => {
      test.each(['true', 'True'])('will convert %p to true', (string) => {
        process.env.PREFIXED_IS_TRUE = string;
        expect(func('IS_TRUE')).toBe(true);
      });
    },
  );

  describe('fluent interface', () => {
    it('can valdiate a minimun integer', () => {
      process.env.PREFIXED_INT = '45';
      expect(() =>
        prefixedConfig.read('INT').asInt().validateGreaterThan(50).value(),
      ).toThrow('PREFIXED_INT should be greater than 50 but got 45');
    });
  });
});
