import { readMetafiles } from "src/metafile-reader";

jest.mock("node:fs", () => ({
  existsSync: jest.fn(),
  readdirSync: jest.fn(),
  readFileSync: jest.fn(),
}));

import { existsSync, readdirSync, readFileSync } from "node:fs";

const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;
const mockReaddirSync = readdirSync as jest.MockedFunction<typeof readdirSync>;
const mockReadFileSync = readFileSync as jest.MockedFunction<typeof readFileSync>;

function makeDirent(name: string, isDir: boolean) {
  return { name, isDirectory: () => isDir };
}

const validMetafile = JSON.stringify({
  inputs: {
    "src/index.ts": { bytes: 100 },
    "node_modules/foo/index.js": { bytes: 50 },
  },
  outputs: {
    "dist/index.js": { bytes: 5000 },
    "dist/index.js.map": { bytes: 1000 },
  },
});

describe("readMetafiles", () => {
  let stderrSpy: jest.SpyInstance;

  beforeEach(() => {
    stderrSpy = jest.spyOn(process.stderr, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    stderrSpy.mockRestore();
  });

  it("returns an empty map and warns when the directory does not exist", () => {
    mockExistsSync.mockReturnValue(false);

    const result = readMetafiles("/non-existent");

    expect(result.size).toBe(0);
    expect(stderrSpy).toHaveBeenCalledWith(
      "Warning: directory does not exist: /non-existent\n",
    );
  });

  it("returns an empty map for an empty directory", () => {
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue([] as any);

    const result = readMetafiles("/empty-dir");

    expect(result.size).toBe(0);
  });

  it("skips entries that are not directories", () => {
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue([makeDirent("some-file.txt", false)] as any);

    const result = readMetafiles("/dir");

    expect(result.size).toBe(0);
  });

  it("warns when meta.json is missing for a lambda directory", () => {
    mockExistsSync.mockImplementation((p) => p === "/dir");
    mockReaddirSync.mockReturnValue([makeDirent("my-lambda", true)] as any);

    const result = readMetafiles("/dir");

    expect(result.size).toBe(0);
    expect(stderrSpy).toHaveBeenCalledWith(
      "Warning: metafile not found: /dir/my-lambda/meta.json\n",
    );
  });

  it("warns and skips when meta.json contains malformed JSON", () => {
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue([makeDirent("my-lambda", true)] as any);
    mockReadFileSync.mockReturnValue("not valid json" as any);

    const result = readMetafiles("/dir");

    expect(result.size).toBe(0);
    expect(stderrSpy).toHaveBeenCalledWith(
      "Warning: failed to parse metafile: /dir/my-lambda/meta.json\n",
    );
  });

  it("warns and skips when meta.json is missing the inputs field", () => {
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue([makeDirent("my-lambda", true)] as any);
    mockReadFileSync.mockReturnValue(
      JSON.stringify({ outputs: { "dist/index.js": { bytes: 1000 } } }) as any,
    );

    const result = readMetafiles("/dir");

    expect(result.size).toBe(0);
    expect(stderrSpy).toHaveBeenCalledWith(
      "Warning: invalid metafile format: /dir/my-lambda/meta.json\n",
    );
  });

  it("warns and skips when meta.json is missing the outputs field", () => {
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue([makeDirent("my-lambda", true)] as any);
    mockReadFileSync.mockReturnValue(
      JSON.stringify({ inputs: { "src/index.ts": { bytes: 100 } } }) as any,
    );

    const result = readMetafiles("/dir");

    expect(result.size).toBe(0);
    expect(stderrSpy).toHaveBeenCalledWith(
      "Warning: invalid metafile format: /dir/my-lambda/meta.json\n",
    );
  });

  it("warns and skips when meta.json value is not an object", () => {
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue([makeDirent("my-lambda", true)] as any);
    mockReadFileSync.mockReturnValue(JSON.stringify(null) as any);

    const result = readMetafiles("/dir");

    expect(result.size).toBe(0);
    expect(stderrSpy).toHaveBeenCalledWith(
      "Warning: invalid metafile format: /dir/my-lambda/meta.json\n",
    );
  });

  it("warns and skips when outputs entries are missing bytes field", () => {
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue([makeDirent("my-lambda", true)] as any);
    mockReadFileSync.mockReturnValue(
      JSON.stringify({
        inputs: { "src/index.ts": { bytes: 100 } },
        outputs: { "dist/index.js": {} },
      }) as any,
    );

    const result = readMetafiles("/dir");

    expect(result.size).toBe(0);
    expect(stderrSpy).toHaveBeenCalledWith(
      "Warning: invalid metafile format: /dir/my-lambda/meta.json\n",
    );
  });

  it("warns and skips when inputs entries are missing bytes field", () => {
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue([makeDirent("my-lambda", true)] as any);
    mockReadFileSync.mockReturnValue(
      JSON.stringify({
        inputs: { "src/index.ts": {} },
        outputs: { "dist/index.js": { bytes: 5000 } },
      }) as any,
    );

    const result = readMetafiles("/dir");

    expect(result.size).toBe(0);
    expect(stderrSpy).toHaveBeenCalledWith(
      "Warning: invalid metafile format: /dir/my-lambda/meta.json\n",
    );
  });

  it("parses a valid metafile and returns correct bundle info", () => {
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue([makeDirent("my-lambda", true)] as any);
    mockReadFileSync.mockReturnValue(validMetafile as any);

    const result = readMetafiles("/dir");

    expect(result.size).toBe(1);
    const info = result.get("my-lambda");
    expect(info).toBeDefined();
    expect(info!.name).toBe("my-lambda");
    expect(info!.totalBytes).toBe(6000); // 5000 + 1000
    expect(info!.files.get("src/index.ts")).toBe(100);
    expect(info!.files.get("node_modules/foo/index.js")).toBe(50);
  });

  it("parses multiple lambda directories", () => {
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue([
      makeDirent("lambda-a", true),
      makeDirent("lambda-b", true),
    ] as any);
    mockReadFileSync.mockReturnValue(validMetafile as any);

    const result = readMetafiles("/dir");

    expect(result.size).toBe(2);
    expect(result.has("lambda-a")).toBe(true);
    expect(result.has("lambda-b")).toBe(true);
  });
});
