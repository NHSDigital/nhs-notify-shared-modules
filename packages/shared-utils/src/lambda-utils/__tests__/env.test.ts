import { type EnvSchema, EnvValidationError, parseEnv } from '../env';

interface Config {
  tableName: string;
  ttlSeconds: number;
}

function createSchema(overrides: Partial<Config> = {}): EnvSchema<Config> {
  return {
    safeParse: (data) => {
      const source = data as Record<string, string | undefined>;
      const tableName = overrides.tableName ?? source.TABLE_NAME;
      const ttlSecondsRaw = source.TTL_SECONDS;

      const issues = [];
      if (!tableName) {
        issues.push({ path: ['TABLE_NAME'], message: 'Required' });
      }
      if (!ttlSecondsRaw || Number.isNaN(Number(ttlSecondsRaw))) {
        issues.push({ path: ['TTL_SECONDS'], message: 'Expected number' });
      }

      if (issues.length > 0) {
        return { success: false, error: { issues } };
      }

      return {
        success: true,
        data: {
          tableName: tableName as string,
          ttlSeconds: Number(ttlSecondsRaw),
        },
      };
    },
  };
}

describe('parseEnv', () => {
  it('returns the parsed value when the schema validates', () => {
    const schema = createSchema();
    const result = parseEnv(schema, {
      TABLE_NAME: 'my-table',
      TTL_SECONDS: '60',
    });
    expect(result).toEqual({ tableName: 'my-table', ttlSeconds: 60 });
  });

  it('defaults the source to process.env', () => {
    const ORIGINAL_ENV = { ...process.env };
    process.env.TABLE_NAME = 'from-process-env';
    process.env.TTL_SECONDS = '30';

    expect(parseEnv(createSchema())).toEqual({
      tableName: 'from-process-env',
      ttlSeconds: 30,
    });

    process.env = { ...ORIGINAL_ENV };
  });

  it('throws EnvValidationError with formatted issues when validation fails', () => {
    const schema = createSchema();
    expect(() => parseEnv(schema, {})).toThrow(EnvValidationError);
    expect(() => parseEnv(schema, {})).toThrow(
      'Invalid environment configuration — TABLE_NAME: Required; TTL_SECONDS: Expected number',
    );
  });
});
