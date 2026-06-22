import { readFile, writeFile } from "node:fs/promises";

import {
  readWorkspaceOverrides,
  workspaceFilePath,
  writeWorkspaceFile,
} from "src/workspace-file";

jest.mock("node:fs/promises", () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
}));

const mockedReadFile = readFile as jest.MockedFunction<typeof readFile>;
const mockedWriteFile = writeFile as jest.MockedFunction<typeof writeFile>;

describe("workspaceFilePath", () => {
  it("joins the project directory with pnpm-workspace.yaml", () => {
    expect(workspaceFilePath("/my/proj")).toBe("/my/proj/pnpm-workspace.yaml");
  });
});

describe("readWorkspaceOverrides", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the overrides map from pnpm-workspace.yaml", async () => {
    mockedReadFile.mockResolvedValue(
      `overrides:\n  solo-pkg: "^3.4.0"\n  "parent-a>child-a": "^3.1.2"\n`,
    );

    const result = await readWorkspaceOverrides("/proj");

    expect(result).toEqual({
      "solo-pkg": "^3.4.0",
      "parent-a>child-a": "^3.1.2",
    });
  });

  it("returns an empty object when there is no overrides block", async () => {
    mockedReadFile.mockResolvedValue(`packages:\n  - "tools/*"\n`);

    const result = await readWorkspaceOverrides("/proj");

    expect(result).toEqual({});
  });

  it("returns an empty object when the overrides block is empty", async () => {
    mockedReadFile.mockResolvedValue(`overrides:\n`);

    const result = await readWorkspaceOverrides("/proj");

    expect(result).toEqual({});
  });
});

describe("writeWorkspaceFile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("writes UTF-8 content to pnpm-workspace.yaml in the project dir", async () => {
    await writeWorkspaceFile("/proj", 'overrides:\n  solo-pkg: "^3.4.0"\n');

    expect(mockedWriteFile).toHaveBeenCalledWith(
      "/proj/pnpm-workspace.yaml",
      'overrides:\n  solo-pkg: "^3.4.0"\n',
      "utf8",
    );
  });
});
