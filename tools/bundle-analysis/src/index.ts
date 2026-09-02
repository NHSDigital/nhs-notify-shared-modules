import { readMetafiles } from "src/metafile-reader";
import { compareBundles } from "src/size-comparator";
import { writeReports } from "src/report-generator";
import type { AnalysisOptions } from "src/types";

export function parseArgs(argv: string[]): AnalysisOptions | undefined {
  const args = argv.slice(2);
  const get = (flag: string): string | undefined => {
    for (const arg of args) {
      const prefix = `--${flag}=`;
      if (arg.startsWith(prefix)) return arg.slice(prefix.length);
    }
    return undefined;
  };

  const baselineDir = get("baseline-dir");
  const currentDir = get("current-dir");
  const outputDir = get("output-dir");
  const thresholdStr = get("threshold") ?? "5";

  if (!baselineDir || !currentDir || !outputDir) {
    process.stderr.write(
      "Usage: tsx ./src/index.ts --baseline-dir=<path> --current-dir=<path> --output-dir=<path> [--threshold=<number>]\n",
    );
    return undefined;
  }

  return {
    baselineDir,
    currentDir,
    outputDir,
    threshold: Number(thresholdStr),
  };
}

export function run(argv: string[]): void {
  const options = parseArgs(argv);

  if (options === undefined) {
    return;
  }

  const baseline = readMetafiles(options.baselineDir);
  const current = readMetafiles(options.currentDir);

  const comparisons = compareBundles(baseline, current, options.threshold);
  const result = {
    comparisons,
    baselineDir: options.baselineDir,
    currentDir: options.currentDir,
  };

  writeReports(result, current, options.outputDir, options.threshold);

  process.stdout.write(`Bundle analysis complete. Reports written to ${options.outputDir}\n`);
}

export function isMain(): boolean {
  const entryPoint = process.argv[1];
  if (!entryPoint) return false;
  return entryPoint.endsWith("index.ts") || entryPoint.endsWith("index.js");
}

if (isMain()) {
  run(process.argv);
}
