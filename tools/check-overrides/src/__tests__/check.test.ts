/* eslint-disable jest/no-conditional-expect */

import { checkAllChains, checkChain } from "src/check";
import { buildChains, parseOverrides } from "src/parse-overrides";

import type { OverrideChain } from "src/types";

jest.mock("src/resolve", () => {
  const actual = jest.requireActual<object>("src/resolve");
  return {
    ...actual,
    regenerateLockfile: jest.fn().mockResolvedValue(undefined),
    readResolvedVersion: jest.fn(),
    withOriginalFiles: jest.fn(
      async (_dir: string, fn: () => Promise<unknown>) => fn(),
    ),
  };
});

jest.mock("src/workspace-file", () => {
  const actual = jest.requireActual<object>("src/workspace-file");
  return {
    ...actual,
    writeWorkspaceFile: jest.fn().mockResolvedValue(undefined),
  };
});

jest.mock("node:fs/promises", () => ({
  readFile: jest.fn().mockResolvedValue(""),
}));

const resolve = jest.requireMock<typeof import("src/resolve")>("src/resolve");

const buildSingleChain = (key: string, spec: string): OverrideChain => {
  const overrides = parseOverrides({ [key]: spec });
  return buildChains(overrides)[0];
};

const buildTwoLinkChain = (): OverrideChain => {
  const overrides = parseOverrides({
    "@scope/root-pkg>mid-pkg": "^5.7.0",
    "mid-pkg>leaf-pkg": "^1.1.7",
  });
  return buildChains(overrides)[0];
};

describe("checkChain", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns removable when a standalone override resolves to >= minimum", async () => {
    const chain = buildSingleChain("solo-pkg", "^3.4.0");
    (resolve.readResolvedVersion as jest.Mock).mockResolvedValue("3.5.0");

    const result = await checkChain("/proj", chain);

    expect(result.status).toBe("removable");
    if (result.status === "removable") {
      expect(result.resolved["solo-pkg"]).toBe("3.5.0");
    }
  });

  it("returns needed when a standalone override resolves below minimum", async () => {
    const chain = buildSingleChain("solo-pkg", "^3.4.0");
    (resolve.readResolvedVersion as jest.Mock).mockResolvedValue("3.3.0");

    const result = await checkChain("/proj", chain);

    expect(result.status).toBe("needed");
  });

  it("returns needed when the package is absent from the lockfile", async () => {
    const chain = buildSingleChain("solo-pkg", "^3.4.0");
    (resolve.readResolvedVersion as jest.Mock).mockResolvedValue(undefined);

    const result = await checkChain("/proj", chain);

    expect(result.status).toBe("needed");
    if (result.status === "needed") {
      expect(result.failures[0].reason).toContain("not resolved");
    }
  });

  it("returns removable for a chain where full removal satisfies all overrides", async () => {
    const chain = buildTwoLinkChain();
    (resolve.readResolvedVersion as jest.Mock)
      .mockResolvedValueOnce("5.8.0")
      .mockResolvedValueOnce("1.2.0");

    const result = await checkChain("/proj", chain);

    expect(result.status).toBe("removable");
  });

  it("returns simplifiable (remove leaf) when leaf is naturally safe but root still needs override", async () => {
    const chain = buildTwoLinkChain();
    (resolve.readResolvedVersion as jest.Mock)
      .mockResolvedValueOnce("4.5.0")
      .mockResolvedValueOnce("1.2.0")
      .mockResolvedValueOnce("5.7.3")
      .mockResolvedValueOnce("1.2.0");

    const result = await checkChain("/proj", chain);

    expect(result.status).toBe("simplifiable");
    if (result.status === "simplifiable") {
      expect(result.remove[0].key).toBe("mid-pkg>leaf-pkg");
      expect(result.keep[0].key).toBe("@scope/root-pkg>mid-pkg");
    }
  });

  it("returns simplifiable (remove root) when root is naturally safe but leaf still needs override", async () => {
    const chain = buildTwoLinkChain();
    (resolve.readResolvedVersion as jest.Mock)
      .mockResolvedValueOnce("5.8.0")
      .mockResolvedValueOnce("1.0.5")
      .mockResolvedValueOnce("5.8.0")
      .mockResolvedValueOnce("1.0.5")
      .mockResolvedValueOnce("5.8.0")
      .mockResolvedValueOnce("1.2.0");

    const result = await checkChain("/proj", chain);

    expect(result.status).toBe("simplifiable");
    if (result.status === "simplifiable") {
      expect(result.remove[0].key).toBe("@scope/root-pkg>mid-pkg");
      expect(result.keep[0].key).toBe("mid-pkg>leaf-pkg");
    }
  });

  it("returns needed when no scenario satisfies the chain", async () => {
    const chain = buildTwoLinkChain();
    (resolve.readResolvedVersion as jest.Mock).mockResolvedValue("1.0.0");

    const result = await checkChain("/proj", chain);

    expect(result.status).toBe("needed");
  });
});

describe("checkAllChains", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns one result per chain in order", async () => {
    const chains = buildChains(
      parseOverrides({
        "solo-pkg": "^3.4.0",
        "parent-a>child-a": "^3.1.2",
      }),
    );
    (resolve.readResolvedVersion as jest.Mock)
      .mockResolvedValueOnce("3.5.0")
      .mockResolvedValueOnce("3.2.0");

    const results = await checkAllChains("/proj", chains);

    expect(results).toHaveLength(2);
    expect(results[0].status).toBe("removable");
    expect(results[1].status).toBe("removable");
  });
});
