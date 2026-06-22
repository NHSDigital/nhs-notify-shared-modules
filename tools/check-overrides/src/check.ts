import { readFile } from "node:fs/promises";

import { gte } from "semver";

import {
  readResolvedVersion,
  regenerateLockfile,
  withOriginalFiles,
} from "src/resolve";
import {
  removeOverridesFromYaml,
  workspaceFilePath,
  writeWorkspaceFile,
} from "src/workspace-file";

import type {
  ChainCheckResult,
  Override,
  OverrideChain,
  ResolutionFailure,
} from "src/types";

type ScenarioOutcome = {
  satisfied: boolean;
  resolved: Record<string, string>;
  failures: ResolutionFailure[];
};

const runScenario = async (
  projectDir: string,
  overridesToRemove: Override[],
  overridesToVerify: Override[],
): Promise<ScenarioOutcome> =>
  withOriginalFiles(projectDir, async () => {
    const path = workspaceFilePath(projectDir);
    const current = await readFile(path, "utf8");
    const updated = removeOverridesFromYaml(
      current,
      overridesToRemove.map((o) => o.key),
    );
    await writeWorkspaceFile(projectDir, updated);

    const affectedPackages = [
      ...new Set(overridesToRemove.flatMap((o) => [o.package, o.parent ?? ""])),
    ].filter((name) => name.length > 0);
    await regenerateLockfile(projectDir, affectedPackages);

    const resolved: Record<string, string> = {};
    const failures: ResolutionFailure[] = [];

    for (const override of overridesToVerify) {
      const version = await readResolvedVersion(projectDir, override);
      if (version) {
        resolved[override.key] = version;
        if (!gte(version, override.minVersion)) {
          failures.push({
            override,
            resolved: version,
            reason: `resolved ${version} < required ${override.minVersion}`,
          });
        }
      } else {
        failures.push({
          override,
          reason: "package not resolved in lockfile",
        });
      }
    }

    return {
      satisfied: failures.length === 0,
      resolved,
      failures,
    };
  });

export const checkChain = async (
  projectDir: string,
  chain: OverrideChain,
): Promise<ChainCheckResult> => {
  const fullOutcome = await runScenario(
    projectDir,
    chain.overrides,
    chain.overrides,
  );
  if (fullOutcome.satisfied) {
    return {
      status: "removable",
      chain,
      resolved: fullOutcome.resolved,
    };
  }

  if (chain.overrides.length > 1) {
    const [root, ...leaves] = chain.overrides;

    const leafOutcome = await runScenario(projectDir, leaves, chain.overrides);
    if (leafOutcome.satisfied) {
      return {
        status: "simplifiable",
        chain,
        remove: leaves,
        keep: [root],
        resolved: leafOutcome.resolved,
      };
    }

    const rootOutcome = await runScenario(projectDir, [root], chain.overrides);
    if (rootOutcome.satisfied) {
      return {
        status: "simplifiable",
        chain,
        remove: [root],
        keep: leaves,
        resolved: rootOutcome.resolved,
      };
    }
  }

  return {
    status: "needed",
    chain,
    failures: fullOutcome.failures,
  };
};

export const checkAllChains = async (
  projectDir: string,
  chains: OverrideChain[],
): Promise<ChainCheckResult[]> => {
  const results: ChainCheckResult[] = [];
  for (const chain of chains) {
    results.push(await checkChain(projectDir, chain));
  }
  return results;
};
