import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { parseDocument } from "yaml";

const WORKSPACE_FILE = "pnpm-workspace.yaml";

export const workspaceFilePath = (projectDir: string): string =>
  path.join(projectDir, WORKSPACE_FILE);

export const readWorkspaceOverrides = async (
  projectDir: string,
): Promise<Record<string, string>> => {
  const content = await readFile(workspaceFilePath(projectDir), "utf8");
  const doc = parseDocument(content);
  const overrides = doc.get("overrides");
  if (!overrides) {
    return {};
  }
  const overridesJs = (overrides as { toJSON: () => unknown }).toJSON();
  if (!overridesJs || typeof overridesJs !== "object") {
    return {};
  }
  return overridesJs as Record<string, string>;
};

export const removeOverridesFromYaml = (
  yamlContent: string,
  keysToRemove: string[],
): string => {
  const doc = parseDocument(yamlContent);
  const overrides = doc.get("overrides");
  if (!overrides) {
    return yamlContent;
  }
  for (const key of keysToRemove) {
    (overrides as { delete: (k: string) => void }).delete(key);
  }
  const remaining = (overrides as { toJSON: () => unknown }).toJSON();
  if (
    !remaining ||
    (typeof remaining === "object" && Object.keys(remaining).length === 0)
  ) {
    doc.delete("overrides");
  }
  return doc.toString();
};

export const writeWorkspaceFile = async (
  projectDir: string,
  content: string,
): Promise<void> => {
  await writeFile(workspaceFilePath(projectDir), content, "utf8");
};
