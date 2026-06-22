import {
  findGlobalResolvedVersion,
  findScopedResolvedVersion,
  lockfilePath,
  readLockfile,
} from "src/lockfile";

import { readFile } from "node:fs/promises";

jest.mock("node:fs/promises", () => ({ readFile: jest.fn() }));

const mockedReadFile = readFile as jest.MockedFunction<typeof readFile>;

const lockfile = {
  lockfileVersion: "9.0",
  snapshots: {
    "mid-pkg@5.7.3": {
      dependencies: {
        "leaf-pkg": "1.2.0",
        "extra-dep": "2.3.0",
      },
    },
    "mid-pkg@4.5.1": {
      dependencies: {
        "leaf-pkg": "1.0.5",
      },
    },
    "leaf-pkg@1.2.0": {},
    "leaf-pkg@1.0.5": {},
    "@scope/root-pkg@3.1039.0": {
      dependencies: {
        "mid-pkg": "5.7.3",
      },
    },
    "peer-dep-pkg@19.0.0(peer@1.0.0)": {},
  },
};

describe("findGlobalResolvedVersion", () => {
  it("returns the highest version of a package across snapshots", () => {
    expect(findGlobalResolvedVersion(lockfile, "mid-pkg")).toBe("5.7.3");
  });

  it("strips peer-dep suffixes from versions", () => {
    expect(findGlobalResolvedVersion(lockfile, "peer-dep-pkg")).toBe("19.0.0");
  });

  it("handles scoped package names", () => {
    expect(findGlobalResolvedVersion(lockfile, "@scope/root-pkg")).toBe(
      "3.1039.0",
    );
  });

  it("returns undefined when the package is absent", () => {
    expect(
      findGlobalResolvedVersion(lockfile, "not-installed"),
    ).toBeUndefined();
  });
});

describe("findScopedResolvedVersion", () => {
  it("returns the lowest resolved child version under a parent (worst-case floor)", () => {
    expect(findScopedResolvedVersion(lockfile, "mid-pkg", "leaf-pkg")).toBe(
      "1.0.5",
    );
  });

  it("returns the resolved version when only one parent snapshot exists", () => {
    expect(
      findScopedResolvedVersion(lockfile, "@scope/root-pkg", "mid-pkg"),
    ).toBe("5.7.3");
  });

  it("returns undefined when the parent has no such dependency", () => {
    expect(
      findScopedResolvedVersion(lockfile, "mid-pkg", "nonexistent"),
    ).toBeUndefined();
  });

  it("returns undefined when the parent is not in the lockfile", () => {
    expect(
      findScopedResolvedVersion(lockfile, "nonexistent", "leaf-pkg"),
    ).toBeUndefined();
  });

  it("skips snapshot keys that have no version separator", () => {
    const weird = {
      lockfileVersion: "9.0",
      snapshots: {
        "no-at-sign-here": { dependencies: { foo: "1.0.0" } },
        "mid-pkg@1.0.0": { dependencies: { foo: "2.0.0" } },
      },
    };
    expect(findScopedResolvedVersion(weird, "mid-pkg", "foo")).toBe("2.0.0");
    expect(findGlobalResolvedVersion(weird, "no-at-sign-here")).toBeUndefined();
  });
});

describe("lockfilePath", () => {
  it("joins the project directory with pnpm-lock.yaml", () => {
    expect(lockfilePath("/proj")).toBe("/proj/pnpm-lock.yaml");
  });
});

describe("readLockfile", () => {
  it("parses the lockfile YAML at the project path", async () => {
    mockedReadFile.mockResolvedValue(
      "lockfileVersion: '9.0'\nsnapshots:\n  foo@1.0.0: {}\n",
    );

    const result = await readLockfile("/proj");

    expect(result.lockfileVersion).toBe("9.0");
    expect(result.snapshots).toEqual({ "foo@1.0.0": {} });
    expect(mockedReadFile).toHaveBeenCalledWith("/proj/pnpm-lock.yaml", "utf8");
  });
});
