import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { LambdaBundleInfo } from "src/types";

interface EsbuildOutput {
  bytes: number;
}

interface EsbuildInput {
  bytes: number;
}

interface EsbuildMetafile {
  inputs: Record<string, EsbuildInput>;
  outputs: Record<string, EsbuildOutput>;
}

function hasNumericBytes(record: Record<string, unknown>): boolean {
  return Object.values(record).every(
    (entry) => typeof entry === "object" && entry !== null && typeof (entry as Record<string, unknown>)["bytes"] === "number",
  );
}

function isEsbuildMetafile(value: unknown): value is EsbuildMetafile {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (typeof obj["inputs"] !== "object" || obj["inputs"] === null) return false;
  if (typeof obj["outputs"] !== "object" || obj["outputs"] === null) return false;
  return (
    hasNumericBytes(obj["inputs"] as Record<string, unknown>) &&
    hasNumericBytes(obj["outputs"] as Record<string, unknown>)
  );
}

export function readMetafiles(dir: string): Map<string, LambdaBundleInfo> {
  const result = new Map<string, LambdaBundleInfo>();

  if (!existsSync(dir)) {
    process.stderr.write(`Warning: directory does not exist: ${dir}\n`);
    return result;
  }

  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const lambdaName = entry.name;
    const metafilePath = path.join(dir, lambdaName, "meta.json");

    if (!existsSync(metafilePath)) {
      process.stderr.write(`Warning: metafile not found: ${metafilePath}\n`);
      continue;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(metafilePath, "utf8"));
    } catch {
      process.stderr.write(`Warning: failed to parse metafile: ${metafilePath}\n`);
      continue;
    }

    if (!isEsbuildMetafile(parsed)) {
      process.stderr.write(`Warning: invalid metafile format: ${metafilePath}\n`);
      continue;
    }

    const totalBytes = Object.values(parsed.outputs).reduce(
      (sum, output) => sum + output.bytes,
      0,
    );

    const files = new Map<string, number>(
      Object.entries(parsed.inputs).map(([filePath, input]) => [filePath, input.bytes]),
    );

    result.set(lambdaName, { name: lambdaName, totalBytes, files });
  }

  return result;
}
