import {
  generateDetailedReport,
  generateSummary,
  writeReports,
} from "src/report-generator";
import type { AnalysisResult, LambdaBundleInfo } from "src/types";

jest.mock("node:fs", () => ({
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

import { mkdirSync, writeFileSync } from "node:fs";

const mockMkdirSync = mkdirSync as jest.MockedFunction<typeof mkdirSync>;
const mockWriteFileSync = writeFileSync as jest.MockedFunction<typeof writeFileSync>;

function makeResult(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    comparisons: [],
    baselineDir: "/baseline",
    currentDir: "/current",
    ...overrides,
  };
}

function makeInfo(name: string, totalBytes: number, files: Record<string, number> = {}): LambdaBundleInfo {
  return { name, totalBytes, files: new Map(Object.entries(files)) };
}

describe("generateSummary", () => {
  it("renders a row for an increased lambda with 🔴", () => {
    const result = makeResult({
      comparisons: [
        {
          name: "my-lambda",
          baselineBytes: 1000,
          currentBytes: 1200,
          absoluteChange: 200,
          percentageChange: 20,
          status: "increased",
        },
      ],
    });

    const output = generateSummary(result, 5);

    expect(output).toContain("🔴");
    expect(output).toContain("my-lambda");
    expect(output).toContain("+200 B (+20.0%)");
  });

  it("renders a row for a decreased lambda with 🟢", () => {
    const result = makeResult({
      comparisons: [
        {
          name: "fn",
          baselineBytes: 1000,
          currentBytes: 800,
          absoluteChange: -200,
          percentageChange: -20,
          status: "decreased",
        },
      ],
    });

    const output = generateSummary(result, 5);

    expect(output).toContain("🟢");
    expect(output).toContain("-200 B (-20.0%)");
  });

  it("renders a row for an unchanged lambda with ⚪", () => {
    const result = makeResult({
      comparisons: [
        {
          name: "fn",
          baselineBytes: 1000,
          currentBytes: 1010,
          absoluteChange: 10,
          percentageChange: 1,
          status: "unchanged",
        },
      ],
    });

    const output = generateSummary(result, 5);

    expect(output).toContain("⚪");
  });

  it("renders a row for a new lambda with 🆕 and dashes for baseline/change", () => {
    const result = makeResult({
      comparisons: [
        {
          name: "fn",
          baselineBytes: undefined,
          currentBytes: 500,
          absoluteChange: undefined,
          percentageChange: undefined,
          status: "new",
        },
      ],
    });

    const output = generateSummary(result, 5);

    expect(output).toContain("🆕");
    expect(output).toContain("—");
  });

  it("renders a row for a removed lambda with 🗑️", () => {
    const result = makeResult({
      comparisons: [
        {
          name: "fn",
          baselineBytes: 500,
          currentBytes: undefined,
          absoluteChange: undefined,
          percentageChange: undefined,
          status: "removed",
        },
      ],
    });

    const output = generateSummary(result, 5);

    expect(output).toContain("🗑️");
  });

  it("includes the correct threshold in the legend", () => {
    const output = generateSummary(makeResult(), 10);

    expect(output).toContain("±10%");
  });

  it("contains the {{REPORT_LINK}} placeholder", () => {
    const output = generateSummary(makeResult(), 5);

    expect(output).toContain("{{REPORT_LINK}}");
  });

  it("formats bytes in B for values under 1000", () => {
    const result = makeResult({
      comparisons: [
        {
          name: "fn",
          baselineBytes: 999,
          currentBytes: 999,
          absoluteChange: 0,
          percentageChange: 0,
          status: "unchanged",
        },
      ],
    });

    const output = generateSummary(result, 5);

    expect(output).toContain("999 B");
  });

  it("formats bytes in kB for values between 1000 and 999999", () => {
    const result = makeResult({
      comparisons: [
        {
          name: "fn",
          baselineBytes: 5000,
          currentBytes: 5000,
          absoluteChange: 0,
          percentageChange: 0,
          status: "unchanged",
        },
      ],
    });

    const output = generateSummary(result, 5);

    expect(output).toContain("5.0 kB");
  });

  it("formats bytes in MB for values >= 1,000,000", () => {
    const result = makeResult({
      comparisons: [
        {
          name: "fn",
          baselineBytes: 2_000_000,
          currentBytes: 2_000_000,
          absoluteChange: 0,
          percentageChange: 0,
          status: "unchanged",
        },
      ],
    });

    const output = generateSummary(result, 5);

    expect(output).toContain("2.0 MB");
  });
});

describe("generateDetailedReport", () => {
  it("renders per-file breakdown sorted by size descending", () => {
    const result = makeResult({
      comparisons: [{ name: "fn", baselineBytes: 500, currentBytes: 500, absoluteChange: 0, percentageChange: 0, status: "unchanged" }],
    });
    const current = new Map([
      ["fn", makeInfo("fn", 300, { "src/a.ts": 200, "src/b.ts": 100 })],
    ]);

    const output = generateDetailedReport(result, current);

    const aIndex = output.indexOf("src/a.ts");
    const bIndex = output.indexOf("src/b.ts");
    expect(aIndex).toBeLessThan(bIndex);
    expect(output).toContain("66.7%");
    expect(output).toContain("33.3%");
  });

  it("shows a placeholder message for a removed lambda not in current", () => {
    const result = makeResult({
      comparisons: [
        {
          name: "removed-fn",
          baselineBytes: 500,
          currentBytes: undefined,
          absoluteChange: undefined,
          percentageChange: undefined,
          status: "removed",
        },
      ],
    });
    const current = new Map<string, LambdaBundleInfo>();

    const output = generateDetailedReport(result, current);

    expect(output).toContain("_Lambda not present in current build._");
  });

  it("handles a lambda with totalBytes of 0 without division errors", () => {
    const result = makeResult({
      comparisons: [{ name: "fn", baselineBytes: 0, currentBytes: 0, absoluteChange: 0, percentageChange: 0, status: "unchanged" }],
    });
    const current = new Map([
      ["fn", makeInfo("fn", 0, { "src/empty.ts": 0 })],
    ]);

    const output = generateDetailedReport(result, current);

    expect(output).toContain("0.0%");
  });

  it("groups pnpm node_modules files by root package", () => {
    const result = makeResult({
      comparisons: [{ name: "fn", baselineBytes: 0, currentBytes: 300, absoluteChange: 300, percentageChange: 0, status: "new" }],
    });
    const current = new Map([
      ["fn", makeInfo("fn", 300, {
        "../../node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/schemas.js": 200,
        "../../node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/api.js": 100,
      })],
    ]);

    const output = generateDetailedReport(result, current);

    expect(output).toContain("../../node_modules/.pnpm/zod@4.4.3");
    expect(output).not.toContain("schemas.js");
    expect(output).not.toContain("api.js");
    expect(output).toContain("300 B");
  });

  it("groups scoped flat node_modules by root package", () => {
    const result = makeResult({
      comparisons: [{ name: "fn", baselineBytes: 0, currentBytes: 150, absoluteChange: 150, percentageChange: 0, status: "new" }],
    });
    const current = new Map([
      ["fn", makeInfo("fn", 150, {
        "node_modules/@aws-sdk/client-sqs/dist/index.js": 100,
        "node_modules/@aws-sdk/client-sqs/dist/models.js": 50,
      })],
    ]);

    const output = generateDetailedReport(result, current);

    expect(output).toContain("node_modules/@aws-sdk/client-sqs");
    expect(output).not.toContain("index.js");
    expect(output).toContain("150 B");
  });

  it("groups unscoped flat node_modules by root package", () => {
    const result = makeResult({
      comparisons: [{ name: "fn", baselineBytes: 0, currentBytes: 80, absoluteChange: 80, percentageChange: 0, status: "new" }],
    });
    const current = new Map([
      ["fn", makeInfo("fn", 80, {
        "node_modules/lodash/array.js": 50,
        "node_modules/lodash/object.js": 30,
      })],
    ]);

    const output = generateDetailedReport(result, current);

    expect(output).toContain("node_modules/lodash");
    expect(output).not.toContain("array.js");
    expect(output).toContain("80 B");
  });

  it("keeps non-node_modules source files as individual entries", () => {
    const result = makeResult({
      comparisons: [{ name: "fn", baselineBytes: 0, currentBytes: 300, absoluteChange: 300, percentageChange: 0, status: "new" }],
    });
    const current = new Map([
      ["fn", makeInfo("fn", 300, {
        "src/handler.ts": 200,
        "src/services/store.ts": 100,
      })],
    ]);

    const output = generateDetailedReport(result, current);

    expect(output).toContain("src/handler.ts");
    expect(output).toContain("src/services/store.ts");
  });
});

describe("writeReports", () => {
  beforeEach(() => {
    mockMkdirSync.mockClear();
    mockWriteFileSync.mockClear();
  });

  it("creates the output directory and writes summary.md and detailed-report.md", () => {
    const result = makeResult();
    const current = new Map<string, LambdaBundleInfo>();

    writeReports(result, current, "/output", 5);

    expect(mockMkdirSync).toHaveBeenCalledWith("/output", { recursive: true });
    expect(mockWriteFileSync).toHaveBeenCalledTimes(2);

    const calls = mockWriteFileSync.mock.calls;
    const filePaths = calls.map((c) => c[0]);
    expect(filePaths).toContain("/output/summary.md");
    expect(filePaths).toContain("/output/detailed-report.md");
  });
});
