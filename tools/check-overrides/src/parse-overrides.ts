import { minVersion, validRange } from 'semver';

import type { Override, OverrideChain } from 'src/types';

// A ">" is the parent>child delimiter only when it is not part of
// a range comparator, so "some-pkg@>=0.27.3 <0.28.1" is a single package selector.
const PARENT_DELIMITER = /[^ @|]>/;

const stripVersionSelector = (
  raw: string,
): { name: string; versionSelector?: string } => {
  const startSearch = raw.startsWith('@') ? 1 : 0;
  const atIndex = raw.indexOf('@', startSearch);
  if (atIndex === -1) {
    return { name: raw };
  }
  return {
    name: raw.slice(0, atIndex),
    versionSelector: raw.slice(atIndex + 1),
  };
};

type ParsedKey = {
  parent?: string;
  parentVersionSelector?: string;
  package: string;
  versionSelector?: string;
};

const parseKey = (key: string): ParsedKey => {
  const delimiter = PARENT_DELIMITER.exec(key);
  if (!delimiter) {
    const { name, versionSelector } = stripVersionSelector(key);
    return { package: name, versionSelector };
  }
  const separatorIndex = delimiter.index + 1;
  const parent = stripVersionSelector(key.slice(0, separatorIndex));
  const child = stripVersionSelector(key.slice(separatorIndex + 1));
  return {
    parent: parent.name,
    parentVersionSelector: parent.versionSelector,
    package: child.name,
    versionSelector: child.versionSelector,
  };
};

const assertValidSelector = (key: string, selector?: string): void => {
  if (selector !== undefined && validRange(selector) === null) {
    throw new Error(
      `Cannot parse version selector for override "${key}": "${selector}"`,
    );
  }
};

const NON_EVALUABLE_PREFIXES = [
  'npm:',
  'link:',
  'file:',
  'workspace:',
  'catalog:',
];

const isEvaluableSpec = (versionSpec: string): boolean => {
  if (versionSpec === '-' || versionSpec.startsWith('$')) {
    return false;
  }
  return !NON_EVALUABLE_PREFIXES.some((prefix) =>
    versionSpec.startsWith(prefix),
  );
};

const toOverride = (key: string, versionSpec: string): Override | undefined => {
  if (!isEvaluableSpec(versionSpec)) {
    return undefined;
  }
  const {
    package: pkg,
    parent,
    parentVersionSelector,
    versionSelector,
  } = parseKey(key);
  assertValidSelector(key, parentVersionSelector);
  assertValidSelector(key, versionSelector);
  let minSemver;
  try {
    minSemver = minVersion(versionSpec);
  } catch {
    minSemver = null;
  }
  if (!minSemver) {
    throw new Error(
      `Cannot determine minimum version for override "${key}": "${versionSpec}"`,
    );
  }
  return {
    key,
    parent,
    parentVersionSelector,
    package: pkg,
    versionSelector,
    versionSpec,
    minVersion: minSemver.version,
  };
};

export const parseOverrides = (
  overridesMap: Record<string, string>,
): Override[] =>
  Object.entries(overridesMap)
    .map(([key, spec]) => toOverride(key, spec))
    .filter((override): override is Override => override !== undefined);

const findChainRoot = (
  start: Override,
  firstByPackage: Map<string, Override>,
  visited: Set<string>,
): Override => {
  const findParentOf = (child: Override): Override | undefined =>
    child.parent ? firstByPackage.get(child.parent) : undefined;
  let root = start;
  let parentOverride = findParentOf(root);
  while (parentOverride && !visited.has(parentOverride.key)) {
    root = parentOverride;
    parentOverride = findParentOf(root);
  }
  return root;
};

const collectChain = (
  root: Override,
  childByParent: Map<string, Override>,
  visited: Set<string>,
): Override[] => {
  const chainOverrides: Override[] = [];
  let current: Override | undefined = root;
  while (current && !visited.has(current.key)) {
    chainOverrides.push(current);
    visited.add(current.key);
    current = childByParent.get(current.package);
  }
  return chainOverrides;
};

export const buildChains = (overrides: Override[]): OverrideChain[] => {
  const childByParent = new Map<string, Override>();
  const firstByPackage = new Map<string, Override>();
  for (const override of overrides) {
    if (override.parent) {
      childByParent.set(override.parent, override);
    }
    if (!firstByPackage.has(override.package)) {
      firstByPackage.set(override.package, override);
    }
  }

  const visited = new Set<string>();
  const chains: OverrideChain[] = [];

  for (const override of overrides) {
    if (!visited.has(override.key)) {
      const root = findChainRoot(override, firstByPackage, visited);
      const chainOverrides = collectChain(root, childByParent, visited);
      chains.push({
        id: chainOverrides.map((o) => o.key).join(' → '),
        overrides: chainOverrides,
      });
    }
  }

  return chains;
};
