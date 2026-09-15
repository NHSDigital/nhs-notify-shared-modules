import type { BundleComparison, ChangeStatus, LambdaBundleInfo } from "src/types";

function classifyStatus(percentageChange: number, threshold: number): ChangeStatus {
  if (percentageChange > threshold) return "increased";
  if (percentageChange < -threshold) return "decreased";
  return "unchanged";
}

function buildComparison(
  name: string,
  baselineInfo: LambdaBundleInfo,
  currentInfo: LambdaBundleInfo,
  threshold: number,
): BundleComparison {
  const absoluteChange = currentInfo.totalBytes - baselineInfo.totalBytes;
  const percentageChange =
    baselineInfo.totalBytes === 0
      ? 0
      : (absoluteChange / baselineInfo.totalBytes) * 100;

  return {
    name,
    baselineBytes: baselineInfo.totalBytes,
    currentBytes: currentInfo.totalBytes,
    absoluteChange,
    percentageChange,
    status: classifyStatus(percentageChange, threshold),
  };
}

function compareOne(
  name: string,
  baselineInfo: LambdaBundleInfo | undefined,
  currentInfo: LambdaBundleInfo | undefined,
  threshold: number,
): BundleComparison {
  if (baselineInfo === undefined && currentInfo !== undefined) {
    return {
      name,
      baselineBytes: undefined,
      currentBytes: currentInfo.totalBytes,
      absoluteChange: undefined,
      percentageChange: undefined,
      status: "new",
    };
  }

  if (baselineInfo !== undefined && currentInfo === undefined) {
    return {
      name,
      baselineBytes: baselineInfo.totalBytes,
      currentBytes: undefined,
      absoluteChange: undefined,
      percentageChange: undefined,
      status: "removed",
    };
  }

  return buildComparison(name, baselineInfo!, currentInfo!, threshold);
}

export function compareBundles(
  baseline: Map<string, LambdaBundleInfo>,
  current: Map<string, LambdaBundleInfo>,
  threshold = 5,
): BundleComparison[] {
  const allNames = new Set([...baseline.keys(), ...current.keys()]);

  return [...allNames]
    .map((name) => compareOne(name, baseline.get(name), current.get(name), threshold))
    .toSorted((a, b) => a.name.localeCompare(b.name));
}
