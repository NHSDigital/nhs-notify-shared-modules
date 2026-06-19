/* eslint-disable unicorn/prefer-event-target */

import { EventEmitter } from "node:events";

import {
  applyRemovals,
  readResolvedVersion,
  regenerateLockfile,
  withOriginalFiles,
} from "src/resolve";

import type { Override } from "src/types";

jest.mock("node:child_process", () => ({
  spawn: jest.fn(),
}));

jest.mock("node:fs/promises", () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
}));

jest.mock("src/lockfile", () => ({
  lockfilePath: jest.fn((dir: string) => `${dir}/pnpm-lock.yaml`),
  readLockfile: jest.fn(),
  findGlobalResolvedVersion: jest.fn(),
  findScopedResolvedVersion: jest.fn(),
}));

jest.mock("src/workspace-file", () => ({
  workspaceFilePath: jest.fn((dir: string) => `${dir}/pnpm-workspace.yaml`),
  writeWorkspaceFile: jest.fn().mockResolvedValue(undefined),
  removeOverridesFromYaml: jest.fn((content: string) => `${content}#stripped`),
}));

const { spawn } =
  jest.requireMock<typeof import("node:child_process")>("node:child_process");
const fsPromises =
  jest.requireMock<typeof import("node:fs/promises")>("node:fs/promises");
const lockfile =
  jest.requireMock<typeof import("src/lockfile")>("src/lockfile");
const workspaceFile =
  jest.requireMock<typeof import("src/workspace-file")>("src/workspace-file");

type FakeChild = EventEmitter & {
  stderr: EventEmitter;
};

const makeChild = (
  exitCode: number,
  stderrText = "",
  errorToEmit?: Error,
): FakeChild => {
  const stderr = new EventEmitter();
  const child = Object.assign(new EventEmitter(), { stderr }) as FakeChild;
  setImmediate(() => {
    if (errorToEmit) {
      child.emit("error", errorToEmit);
      return;
    }
    if (stderrText) {
      stderr.emit("data", Buffer.from(stderrText, "utf8"));
    }
    child.emit("close", exitCode);
  });
  return child;
};

describe("regenerateLockfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("is a no-op when no packages need updating", async () => {
    await regenerateLockfile("/proj", []);
    expect(spawn).not.toHaveBeenCalled();
  });

  it("spawns pnpm update with the named packages and resolves on exit 0", async () => {
    (spawn as jest.Mock).mockReturnValue(makeChild(0));

    await regenerateLockfile("/proj", ["foo", "bar"]);

    expect(spawn).toHaveBeenCalledWith(
      "pnpm",
      ["update", "--lockfile-only", "-r", "foo", "bar"],
      expect.objectContaining({ cwd: "/proj" }),
    );
  });

  it("rejects with stderr included when exit code is non-zero", async () => {
    (spawn as jest.Mock).mockReturnValue(makeChild(1, "boom"));

    await expect(regenerateLockfile("/proj", ["foo"])).rejects.toThrow(
      /exit code 1[\s\S]*boom/,
    );
  });

  it("rejects when the spawned process emits an error", async () => {
    (spawn as jest.Mock).mockReturnValue(makeChild(0, "", new Error("ENOENT")));

    await expect(regenerateLockfile("/proj", ["foo"])).rejects.toThrow(
      /ENOENT/,
    );
  });
});

describe("readResolvedVersion", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (lockfile.readLockfile as jest.Mock).mockResolvedValue({});
  });

  it("reads a global resolution when the override has no parent", async () => {
    (lockfile.findGlobalResolvedVersion as jest.Mock).mockReturnValue("3.5.0");
    const override: Override = {
      key: "solo-pkg",
      package: "solo-pkg",
      versionSpec: "^3.4.0",
      minVersion: "3.4.0",
    };

    const result = await readResolvedVersion("/proj", override);

    expect(result).toBe("3.5.0");
    expect(lockfile.findGlobalResolvedVersion).toHaveBeenCalled();
    expect(lockfile.findScopedResolvedVersion).not.toHaveBeenCalled();
  });

  it("reads a scoped resolution when the override has a parent", async () => {
    (lockfile.findScopedResolvedVersion as jest.Mock).mockReturnValue("5.8.0");
    const override: Override = {
      key: "@scope/root-pkg>mid-pkg",
      parent: "@scope/root-pkg",
      package: "mid-pkg",
      versionSpec: "^5.7.0",
      minVersion: "5.7.0",
    };

    const result = await readResolvedVersion("/proj", override);

    expect(result).toBe("5.8.0");
    expect(lockfile.findScopedResolvedVersion).toHaveBeenCalledWith(
      {},
      "@scope/root-pkg",
      "mid-pkg",
    );
  });
});

describe("withOriginalFiles", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("restores both files after fn resolves", async () => {
    (fsPromises.readFile as jest.Mock)
      .mockResolvedValueOnce("ws-original")
      .mockResolvedValueOnce("lock-original");

    const fn = jest.fn().mockResolvedValue("ok");
    const result = await withOriginalFiles("/proj", fn);

    expect(result).toBe("ok");
    expect(fsPromises.writeFile).toHaveBeenCalledWith(
      "/proj/pnpm-workspace.yaml",
      "ws-original",
      "utf8",
    );
    expect(fsPromises.writeFile).toHaveBeenCalledWith(
      "/proj/pnpm-lock.yaml",
      "lock-original",
      "utf8",
    );
  });

  it("still restores both files when fn throws", async () => {
    (fsPromises.readFile as jest.Mock)
      .mockResolvedValueOnce("ws-original")
      .mockResolvedValueOnce("lock-original");

    const fn = jest.fn().mockRejectedValue(new Error("boom"));

    await expect(withOriginalFiles("/proj", fn)).rejects.toThrow("boom");
    expect(fsPromises.writeFile).toHaveBeenCalledTimes(2);
  });
});

describe("applyRemovals", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("is a no-op when there are no overrides to remove", async () => {
    await applyRemovals("/proj", []);
    expect(fsPromises.readFile).not.toHaveBeenCalled();
    expect(workspaceFile.writeWorkspaceFile).not.toHaveBeenCalled();
    expect(spawn).not.toHaveBeenCalled();
  });

  it("rewrites the workspace file and regenerates the lockfile", async () => {
    (fsPromises.readFile as jest.Mock).mockResolvedValue("ws-content");
    (spawn as jest.Mock).mockReturnValue(makeChild(0));

    const overrides: Override[] = [
      {
        key: "solo-pkg",
        package: "solo-pkg",
        versionSpec: "^3.4.0",
        minVersion: "3.4.0",
      },
      {
        key: "@scope/root-pkg>mid-pkg",
        parent: "@scope/root-pkg",
        package: "mid-pkg",
        versionSpec: "^5.7.0",
        minVersion: "5.7.0",
      },
    ];

    await applyRemovals("/proj", overrides);

    expect(workspaceFile.removeOverridesFromYaml).toHaveBeenCalledWith(
      "ws-content",
      ["solo-pkg", "@scope/root-pkg>mid-pkg"],
    );
    expect(workspaceFile.writeWorkspaceFile).toHaveBeenCalledWith(
      "/proj",
      "ws-content#stripped",
    );
    expect(spawn).toHaveBeenCalledWith(
      "pnpm",
      [
        "update",
        "--lockfile-only",
        "-r",
        "solo-pkg",
        "mid-pkg",
        "@scope/root-pkg",
      ],
      expect.objectContaining({ cwd: "/proj" }),
    );
  });
});
