import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

import { checkAllChains } from "src/check";
import { buildChains, parseOverrides } from "src/parse-overrides";
import { applyRemovals } from "src/resolve";
import {
  overridesToRemove,
  renderHumanSummary,
  renderPrBody,
  reportPath,
} from "src/report";
import { readWorkspaceOverrides } from "src/workspace-file";

import type { OverrideReport } from "src/types";

type CliOptions = {
  projectDir: string;
  apply: boolean;
};

const parseCliArgs = (argv: string[]): CliOptions => {
  const { values } = parseArgs({
    args: argv,
    options: {
      apply: { type: "boolean", default: false },
      "project-dir": { type: "string" },
    },
  });
  return {
    apply: values.apply ?? false,
    projectDir: path.resolve(values["project-dir"] ?? process.cwd()),
  };
};

const writeReportFiles = async (
  projectDir: string,
  report: OverrideReport,
): Promise<void> => {
  const jsonPath = reportPath(projectDir);
  await mkdir(path.dirname(jsonPath), { recursive: true });
  await writeFile(jsonPath, JSON.stringify(report, undefined, 2), "utf8");
  const prBodyPath = path.join(projectDir, ".tmp", "pr-body.md");
  await writeFile(prBodyPath, renderPrBody(report), "utf8");
};

export const run = async (argv: string[]): Promise<void> => {
  const options = parseCliArgs(argv);

  const overridesMap = await readWorkspaceOverrides(options.projectDir);
  const overrides = parseOverrides(overridesMap);
  const chains = buildChains(overrides);

  const results = await checkAllChains(options.projectDir, chains);
  const removals = overridesToRemove(results);

  const report: OverrideReport = {
    generatedAt: new Date().toISOString(),
    results,
    hasChanges: removals.length > 0,
  };

  process.stdout.write(`${JSON.stringify(report, undefined, 2)}\n`);
  process.stderr.write(`${renderHumanSummary(report)}\n`);

  await writeReportFiles(options.projectDir, report);

  if (options.apply && removals.length > 0) {
    process.stderr.write(
      `\nApplying ${removals.length} removal(s) to pnpm-workspace.yaml...\n`,
    );
    await applyRemovals(options.projectDir, removals);
    process.stderr.write("Apply complete.\n");
  }
};

const isMain = (): boolean => {
  const entryPoint = process.argv[1];
  if (!entryPoint) {
    return false;
  }
  return entryPoint.endsWith("index.ts") || entryPoint.endsWith("index.js");
};

if (isMain()) {
  run(process.argv.slice(2)).catch((error: unknown) => {
    process.stderr.write(`${(error as Error).stack ?? String(error)}\n`);
    process.exit(1);
  });
}
