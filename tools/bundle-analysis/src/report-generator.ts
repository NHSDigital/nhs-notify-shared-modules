import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { AnalysisResult, BundleComparison, LambdaBundleInfo } from "src/types";

function formatBytes(bytes: number): string {
  if (bytes < 1000) return `${bytes} B`;
  if (bytes < 1_000_000) return `${(bytes / 1000).toFixed(1)} kB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

function statusIcon(status: BundleComparison["status"]): string {
  switch (status) {
    case "increased": { return "🔴";
    }
    case "decreased": { return "🟢";
    }
    case "unchanged": { return "⚪";
    }
    case "new": { return "🆕";
    }
    case "removed": { return "🗑️";
    }
  }
}

function formatChange(comparison: BundleComparison): string {
  if (comparison.absoluteChange === undefined || comparison.percentageChange === undefined) {
    return "—";
  }
  const sign = comparison.absoluteChange >= 0 ? "+" : "";
  return `${sign}${formatBytes(comparison.absoluteChange)} (${sign}${comparison.percentageChange.toFixed(1)}%)`;
}

export function generateSummary(result: AnalysisResult, threshold: number): string {
  const rows = result.comparisons.map((c) => {
    const baseline = c.baselineBytes === undefined ? "—" : formatBytes(c.baselineBytes);
    const current = c.currentBytes === undefined ? "—" : formatBytes(c.currentBytes);
    const change = formatChange(c);
    const icon = statusIcon(c.status);
    return `| ${c.name} | ${baseline} | ${current} | ${change} | ${icon} |`;
  });

  return [
    "## 📦 Bundle Size Analysis",
    "",
    "| Lambda | Baseline | Current | Change | Status |",
    "|--------|----------|---------|--------|--------|",
    ...rows,
    "",
    `🟢 Decreased  ⚪ Within threshold (±${threshold}%)  🔴 Increased  🆕 New  🗑️ Removed`,
    "",
    "📊 [View detailed report]({{REPORT_LINK}})",
  ].join("\n");
}

function rootPackageKey(filePath: string): string {
  // pnpm virtual store: .../node_modules/.pnpm/<package@version>/...
  const pnpmMatch = /^(.*node_modules\/.pnpm\/[^/]+)\//.exec(filePath);
  if (pnpmMatch) return pnpmMatch[1];

  // scoped package in flat node_modules: .../node_modules/@scope/name/...
  const scopedMatch = /^(.*node_modules\/@[^/]+\/[^/]+)\//.exec(filePath);
  if (scopedMatch) return scopedMatch[1];

  // regular package in flat node_modules: .../node_modules/name/...
  const regularMatch = /^(.*node_modules\/[^@/][^/]*)\//.exec(filePath);
  if (regularMatch) return regularMatch[1];

  return filePath;
}

function groupFilesByPackage(files: Map<string, number>): Map<string, number> {
  const grouped = new Map<string, number>();
  for (const [filePath, bytes] of files) {
    const key = rootPackageKey(filePath);
    grouped.set(key, (grouped.get(key) ?? 0) + bytes);
  }
  return grouped;
}

export function generateDetailedReport(
  result: AnalysisResult,
  current: Map<string, LambdaBundleInfo>,
): string {
  const sections: string[] = ["# Bundle Analysis — Detailed Report", ""];

  for (const comparison of result.comparisons) {
    sections.push(`## ${comparison.name}`, "");

    const info = current.get(comparison.name);
    if (info === undefined) {
      sections.push("_Lambda not present in current build._", "");
      continue;
    }

    const grouped = groupFilesByPackage(info.files);
    const sorted = [...grouped.entries()].toSorted(([, a], [, b]) => b - a);
    const total = info.totalBytes;

    sections.push("| File / Package | Size | % of total |", "|----------------|------|-----------|");

    for (const [key, bytes] of sorted) {
      const pct = total === 0 ? "0.0" : ((bytes / total) * 100).toFixed(1);
      sections.push(`| \`${key}\` | ${formatBytes(bytes)} | ${pct}% |`);
    }

    sections.push("");
  }

  return sections.join("\n");
}

export function writeReports(
  result: AnalysisResult,
  current: Map<string, LambdaBundleInfo>,
  outputDir: string,
  threshold: number,
): void {
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(path.join(outputDir, "summary.md"), generateSummary(result, threshold), "utf8");
  writeFileSync(path.join(outputDir, "detailed-report.md"), generateDetailedReport(result, current), "utf8");
}
