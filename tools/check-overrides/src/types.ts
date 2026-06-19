export type Override = {
  /** The full key as it appears in pnpm-workspace.yaml, e.g. "fast-xml-parser>fast-xml-builder" */
  key: string;
  /** The parent package selector if scoped, e.g. "fast-xml-parser" */
  parent?: string;
  /** The package being overridden, e.g. "fast-xml-builder" */
  package: string;
  /** The version selector from the key, e.g. "<11.1.1" for "uuid@<11.1.1" */
  versionSelector?: string;
  /** The full semver spec, e.g. "^1.1.7" */
  versionSpec: string;
  /** The minimum acceptable version extracted from the spec, e.g. "1.1.7" */
  minVersion: string;
};

export type OverrideChain = {
  /** Stable identifier for the chain, derived from the keys */
  id: string;
  /** Overrides in the chain, ordered root → leaf */
  overrides: Override[];
};

export type ResolutionFailure = {
  override: Override;
  resolved?: string;
  reason: string;
};

export type RemovableResult = {
  status: "removable";
  chain: OverrideChain;
  resolved: Record<string, string>;
};

export type SimplifiableResult = {
  status: "simplifiable";
  chain: OverrideChain;
  remove: Override[];
  keep: Override[];
  resolved: Record<string, string>;
};

export type NeededResult = {
  status: "needed";
  chain: OverrideChain;
  failures: ResolutionFailure[];
};

export type ChainCheckResult =
  | RemovableResult
  | SimplifiableResult
  | NeededResult;

export type OverrideReport = {
  generatedAt: string;
  results: ChainCheckResult[];
  hasChanges: boolean;
};
