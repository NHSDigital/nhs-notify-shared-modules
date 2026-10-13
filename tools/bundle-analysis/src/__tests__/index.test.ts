import { isMain, parseArgs, run } from "src/index";

jest.mock("src/metafile-reader");
jest.mock("src/size-comparator");
jest.mock("src/report-generator");

import { readMetafiles } from "src/metafile-reader";
import { compareBundles } from "src/size-comparator";
import { writeReports } from "src/report-generator";
import type { LambdaBundleInfo } from "src/types";

const mockReadMetafiles = readMetafiles as jest.MockedFunction<typeof readMetafiles>;
const mockCompareBundles = compareBundles as jest.MockedFunction<typeof compareBundles>;
const mockWriteReports = writeReports as jest.MockedFunction<typeof writeReports>;

const emptyMap = new Map<string, LambdaBundleInfo>();

describe("parseArgs", () => {
  let stderrSpy: jest.SpyInstance;

  beforeEach(() => {
    stderrSpy = jest.spyOn(process.stderr, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    stderrSpy.mockRestore();
  });

  it("returns options when all required args are provided", () => {
    const result = parseArgs([
      "node",
      "index.ts",
      "--baseline-dir=/fake/baseline",
      "--current-dir=/fake/current",
      "--output-dir=/fake/output",
    ]);

    expect(result).toEqual({
      baselineDir: "/fake/baseline",
      currentDir: "/fake/current",
      outputDir: "/fake/output",
      threshold: 5,
    });
  });

  it("uses a custom threshold when provided", () => {
    const result = parseArgs([
      "node",
      "index.ts",
      "--baseline-dir=/fake/baseline",
      "--current-dir=/fake/current",
      "--output-dir=/fake/output",
      "--threshold=10",
    ]);

    expect(result?.threshold).toBe(10);
  });

  it("returns undefined and prints usage when baseline-dir is missing", () => {
    const result = parseArgs([
      "node",
      "index.ts",
      "--current-dir=/fake/current",
      "--output-dir=/fake/output",
    ]);

    expect(result).toBeUndefined();
    expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining("Usage:"));
  });

  it("returns undefined and prints usage when current-dir is missing", () => {
    const result = parseArgs([
      "node",
      "index.ts",
      "--baseline-dir=/fake/baseline",
      "--output-dir=/fake/output",
    ]);

    expect(result).toBeUndefined();
    expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining("Usage:"));
  });

  it("returns undefined and prints usage when output-dir is missing", () => {
    const result = parseArgs([
      "node",
      "index.ts",
      "--baseline-dir=/fake/baseline",
      "--current-dir=/fake/current",
    ]);

    expect(result).toBeUndefined();
    expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining("Usage:"));
  });
});

describe("run", () => {
  let stdoutSpy: jest.SpyInstance;
  let stderrSpy: jest.SpyInstance;

  beforeEach(() => {
    stdoutSpy = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
    stderrSpy = jest.spyOn(process.stderr, "write").mockImplementation(() => true);
    mockReadMetafiles.mockReturnValue(emptyMap);
    mockCompareBundles.mockReturnValue([]);
    mockWriteReports.mockImplementation(() => undefined);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
  });

  it("runs the full pipeline when all args are provided", () => {
    run([
      "node",
      "index.ts",
      "--baseline-dir=/fake/baseline",
      "--current-dir=/fake/current",
      "--output-dir=/fake/output",
    ]);

    expect(mockReadMetafiles).toHaveBeenCalledWith("/fake/baseline");
    expect(mockReadMetafiles).toHaveBeenCalledWith("/fake/current");
    expect(mockCompareBundles).toHaveBeenCalledWith(emptyMap, emptyMap, 5);
    expect(mockWriteReports).toHaveBeenCalled();
    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining("Bundle analysis complete"));
  });

  it("exits early without running pipeline when args are missing", () => {
    run(["node", "index.ts"]);

    expect(mockReadMetafiles).not.toHaveBeenCalled();
    expect(mockWriteReports).not.toHaveBeenCalled();
    expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining("Usage:"));
  });
});

describe("isMain", () => {
  const originalArgv = process.argv;

  afterEach(() => {
    process.argv = originalArgv;
  });

  it("returns false when process.argv[1] is undefined", () => {
    process.argv = ["node"];
    expect(isMain()).toBe(false);
  });

  it("returns true when process.argv[1] ends with index.ts", () => {
    process.argv = ["node", "/path/to/index.ts"];
    expect(isMain()).toBe(true);
  });

  it("returns true when process.argv[1] ends with index.js", () => {
    process.argv = ["node", "/path/to/index.js"];
    expect(isMain()).toBe(true);
  });

  it("returns false when process.argv[1] does not match", () => {
    process.argv = ["node", "/path/to/other.ts"];
    expect(isMain()).toBe(false);
  });

  it("invokes run() when loaded as the entry point", () => {
    const stdoutSpy = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
    jest.spyOn(process.stderr, "write").mockImplementation(() => true);

    process.argv = [
      "node",
      "/path/to/index.ts",
      "--baseline-dir=/fake/baseline",
      "--current-dir=/fake/current",
      "--output-dir=/fake/output",
    ];

    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("src/index");
    });

    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining("Bundle analysis complete"));
    stdoutSpy.mockRestore();
  });
});
