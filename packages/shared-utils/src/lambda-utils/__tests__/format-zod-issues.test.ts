import { formatZodIssues } from '../format-zod-issues';

describe('formatZodIssues', () => {
  it('returns an empty string for an empty issue list', () => {
    expect(formatZodIssues([])).toBe('');
  });

  it('formats a single issue with a dotted path', () => {
    expect(
      formatZodIssues([{ path: ['channelId'], message: 'Required' }]),
    ).toBe('channelId: Required');
  });

  it('joins a nested path with dots and coerces numeric segments', () => {
    expect(
      formatZodIssues([
        { path: ['items', 0, 'id'], message: 'Expected string' },
      ]),
    ).toBe('items.0.id: Expected string');
  });

  it('omits the path prefix when the issue path is empty', () => {
    expect(formatZodIssues([{ path: [], message: 'Invalid input' }])).toBe(
      'Invalid input',
    );
  });

  it('joins multiple issues with a semicolon separator', () => {
    expect(
      formatZodIssues([
        { path: ['a'], message: 'first' },
        { path: [], message: 'second' },
      ]),
    ).toBe('a: first; second');
  });
});
