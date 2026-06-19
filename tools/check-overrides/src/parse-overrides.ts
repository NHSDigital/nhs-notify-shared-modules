import { minVersion } from "semver";

import type { Override, OverrideChain } from "src/types";

const stripVersionSelector = (
  raw: string,
): { name: string; versionSelector?: string } => {
  const startSearch = raw.startsWith("@") ? 1 : 0;
  const atIndex = raw.indexOf("@", startSearch);
  if (atIndex === -1) {
    return { name: raw };
  }
  return {
    name: raw.slice(0, atIndex),
    versionSelector: raw.slice(atIndex + 1),
  };
};

const parseKey = (
  key: string,
): { parent?: string; package: string; versionSelector?: string } => {
  const separatorIndex = key.lastIndexOf(">");
  if (separatorIndex === -1) {
    const { name, versionSelector } = stripVersionSelector(key);
    return { package: name, versionSelector };
  }
  const rawParent = key.slice(0, separatorIndex);
  const rawPackage = key.slice(separatorIndex + 1);
  const { name: parentName } = stripVersionSelector(rawParent);
  const { name, versionSelector } = stripVersionSelector(rawPackage);
  return {
    parent: parentName,
    package: name,
    versionSelector,
  };
};

const NON_EVALUABLE_PREFIXES = [
  "npm:",
  "link:",
  "file:",
  "workspace:",
  "catalog:",
];

const isEvaluableSpec = (versionSpec: string): boolean => {
  if (versionSpec === "-" || versionSpec.startsWith("$")) {
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
  const { package: pkg, parent, versionSelector } = parseKey(key);
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

export const buildChains = (overrides: Override[]): OverrideChain[] => {
  const childByParent = new Map<string, Override>();
  for (const override of overrides) {
    if (override.parent) {
      childByParent.set(override.parent, override);
    }
  }

  const visited = new Set<string>();
  const chains: OverrideChain[] = [];

  for (const override of overrides) {
    if (visited.has(override.key)) {
      continue;
    }

    let root = override;
    const findParentOf = (child: Override): Override | undefined =>
      overrides.find((o) => o.package === child.parent);
    let parentOverride = findParentOf(root);
    while (parentOverride && !visited.has(parentOverride.key)) {
      root = parentOverride;
      parentOverride = findParentOf(root);
    }

    const chainOverrides: Override[] = [];
    let current: Override | undefined = root;
    while (current && !visited.has(current.key)) {
      chainOverrides.push(current);
      visited.add(current.key);
      current = childByParent.get(current.package);
    }

    chains.push({
      id: chainOverrides.map((o) => o.key).join(" → "),
      overrides: chainOverrides,
    });
  }

  return chains;
};
