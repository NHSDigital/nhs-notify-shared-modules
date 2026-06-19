import { readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";

import {
  findGlobalResolvedVersion,
  findScopedResolvedVersion,
  lockfilePath,
  readLockfile,
} from "src/lockfile";
import {
  removeOverridesFromYaml,
  workspaceFilePath,
  writeWorkspaceFile,
} from "src/workspace-file";

import type { Override } from "src/types";

export const regenerateLockfile = async (
  projectDir: string,
  packagesToUpdate: string[],
): Promise<void> => {
  if (packagesToUpdate.length === 0) {
    return;
  }
  const args = ["update", "--lockfile-only", "-r", ...packagesToUpdate];
  await new Promise<void>((resolve, reject) => {
    const child = spawn("pnpm", args, {
      cwd: projectDir,
      stdio: ["ignore", "ignore", "pipe"],
    });
    const stderrChunks: Buffer[] = [];
    child.stderr.on("data", (chunk: Buffer) => stderrChunks.push(chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      const stderr = Buffer.concat(stderrChunks).toString("utf8");
      reject(
        new Error(
          `pnpm ${args.join(" ")} failed with exit code ${code}\n${stderr}`,
        ),
      );
    });
  });
};

export const readResolvedVersion = async (
  projectDir: string,
  override: Override,
): Promise<string | undefined> => {
  const lockfile = await readLockfile(projectDir);
  return override.parent
    ? findScopedResolvedVersion(lockfile, override.parent, override.package)
    : findGlobalResolvedVersion(lockfile, override.package);
};

export const withOriginalFiles = async <T>(
  projectDir: string,
  fn: () => Promise<T>,
): Promise<T> => {
  const workspacePath = workspaceFilePath(projectDir);
  const lockPath = lockfilePath(projectDir);
  const [originalWorkspace, originalLock] = await Promise.all([
    readFile(workspacePath, "utf8"),
    readFile(lockPath, "utf8"),
  ]);
  try {
    return await fn();
  } finally {
    await Promise.all([
      writeFile(workspacePath, originalWorkspace, "utf8"),
      writeFile(lockPath, originalLock, "utf8"),
    ]);
  }
};

export const applyRemovals = async (
  projectDir: string,
  overridesToRemove: Override[],
): Promise<void> => {
  if (overridesToRemove.length === 0) {
    return;
  }
  const workspacePath = workspaceFilePath(projectDir);
  const current = await readFile(workspacePath, "utf8");
  const updated = removeOverridesFromYaml(
    current,
    overridesToRemove.map((o) => o.key),
  );
  await writeWorkspaceFile(projectDir, updated);
  const affectedPackages = [
    ...new Set(overridesToRemove.flatMap((o) => [o.package, o.parent ?? ""])),
  ].filter((name) => name.length > 0);
  await regenerateLockfile(projectDir, affectedPackages);
};
