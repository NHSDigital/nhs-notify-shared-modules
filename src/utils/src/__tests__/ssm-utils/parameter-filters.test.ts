import { nonNullParameterFilter } from '../../ssm-utils';

describe('parameterFilters', () => {
  test('nonNullParameterFilter returns true if parameter is not null or undefined', () => {
    expect(
      nonNullParameterFilter({ Name: 'some-name', Value: 'some-value' }),
    ).toBe(true);
  });
  test('nonNullParameterFilter returns false if parameter is undefined', () => {
    expect(
      nonNullParameterFilter({ Name: undefined, Value: 'some-value' }),
    ).toBe(false);
    expect(
      nonNullParameterFilter({ Name: 'some-name', Value: undefined }),
    ).toBe(false);
  });
});
