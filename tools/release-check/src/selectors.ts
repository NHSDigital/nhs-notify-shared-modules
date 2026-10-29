const escapeRegex = (value: string): string =>
  value.replaceAll(/[|\\{}()[\]^$+?.]/g, String.raw`\$&`);

export const hasGlobPattern = (value: string): boolean =>
  value.includes('*') || value.includes('?');

export const matchesGlobPattern = (value: string, pattern: string): boolean => {
  const regex = new RegExp(
    `^${[...pattern]
      .map((character) => {
        if (character === '*') {
          return '.*';
        }
        if (character === '?') {
          return '.';
        }
        return escapeRegex(character);
      })
      .join('')}$`,
  );
  return regex.test(value);
};

export const parseSelectorList = (value: string): string[] => {
  const selectors = value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (selectors.length === 0) {
    throw new Error('Selector list must not be empty.');
  }

  return selectors;
};
