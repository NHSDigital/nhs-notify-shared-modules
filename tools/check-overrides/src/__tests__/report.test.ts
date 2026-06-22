import {
  overridesToRemove,
  renderHumanSummary,
  renderPrBody,
  reportPath,
} from "src/report";

import type { ChainCheckResult, Override, OverrideReport } from "src/types";

const rootOverride: Override = {
  key: "@scope/root-pkg>mid-pkg",
  parent: "@scope/root-pkg",
  package: "mid-pkg",
  versionSpec: "^5.7.0",
  minVersion: "5.7.0",
};

const leafOverride: Override = {
  key: "mid-pkg>leaf-pkg",
  parent: "mid-pkg",
  package: "leaf-pkg",
  versionSpec: "^1.1.7",
  minVersion: "1.1.7",
};

const soloOverride: Override = {
  key: "solo-pkg",
  package: "solo-pkg",
  versionSpec: "^3.4.0",
  minVersion: "3.4.0",
};

const buildReport = (results: ChainCheckResult[]): OverrideReport => ({
  generatedAt: "2026-05-18T00:00:00.000Z",
  results,
  hasChanges: overridesToRemove(results).length > 0,
});

describe("overridesToRemove", () => {
  it("collects all overrides from a removable chain", () => {
    const removals = overridesToRemove([
      {
        status: "removable",
        chain: { id: "chain", overrides: [rootOverride, leafOverride] },
        resolved: {},
      },
    ]);

    expect(removals).toEqual([rootOverride, leafOverride]);
  });

  it("collects only the `remove` set from a simplifiable chain", () => {
    const removals = overridesToRemove([
      {
        status: "simplifiable",
        chain: { id: "chain", overrides: [rootOverride, leafOverride] },
        remove: [leafOverride],
        keep: [rootOverride],
        resolved: {},
      },
    ]);

    expect(removals).toEqual([leafOverride]);
  });

  it("ignores chains that are still needed", () => {
    const removals = overridesToRemove([
      {
        status: "needed",
        chain: { id: "chain", overrides: [soloOverride] },
        failures: [],
      },
    ]);

    expect(removals).toEqual([]);
  });
});

describe("renderHumanSummary", () => {
  it("reports when no overrides are found", () => {
    expect(renderHumanSummary(buildReport([]))).toContain("No overrides found");
  });

  it("includes the chain id, status and resolved versions for a removable chain", () => {
    const report = buildReport([
      {
        status: "removable",
        chain: { id: "solo-pkg", overrides: [soloOverride] },
        resolved: { "solo-pkg": "3.5.0" },
      },
    ]);

    const summary = renderHumanSummary(report);
    expect(summary).toContain("solo-pkg");
    expect(summary).toContain("REMOVABLE");
    expect(summary).toContain("3.5.0");
    expect(summary).toContain("Actionable findings");
  });

  it("reports still-needed chains with their failure reasons", () => {
    const report = buildReport([
      {
        status: "needed",
        chain: { id: "solo-pkg", overrides: [soloOverride] },
        failures: [
          {
            override: soloOverride,
            resolved: "3.3.0",
            reason: "resolved 3.3.0 < required 3.4.0",
          },
        ],
      },
    ]);

    const summary = renderHumanSummary(report);
    expect(summary).toContain("STILL NEEDED");
    expect(summary).toContain("resolved 3.3.0 < required 3.4.0");
    expect(summary).toContain("all overrides are still required");
  });

  it("reports simplifiable chains with remove/keep sets", () => {
    const report = buildReport([
      {
        status: "simplifiable",
        chain: { id: "chain", overrides: [rootOverride, leafOverride] },
        remove: [leafOverride],
        keep: [rootOverride],
        resolved: {},
      },
    ]);

    const summary = renderHumanSummary(report);
    expect(summary).toContain("SIMPLIFIABLE");
    expect(summary).toContain("mid-pkg>leaf-pkg");
    expect(summary).toContain("@scope/root-pkg>mid-pkg");
  });
});

describe("renderPrBody", () => {
  it("renders markdown sections for removable, simplifiable, and still-needed", () => {
    const report = buildReport([
      {
        status: "removable",
        chain: { id: "solo-pkg", overrides: [soloOverride] },
        resolved: { "solo-pkg": "3.5.0" },
      },
      {
        status: "simplifiable",
        chain: { id: "chain", overrides: [rootOverride, leafOverride] },
        remove: [leafOverride],
        keep: [rootOverride],
        resolved: {},
      },
      {
        status: "needed",
        chain: { id: "needed-chain", overrides: [soloOverride] },
        failures: [
          {
            override: soloOverride,
            resolved: "3.3.0",
            reason: "below minimum",
          },
        ],
      },
    ]);

    const body = renderPrBody(report);
    expect(body).toContain("## Changes");
    expect(body).toContain("### Removable: solo-pkg");
    expect(body).toContain("### Simplifiable: chain");
    expect(body).toContain("## Overrides still required");
    expect(body).toContain("### Still needed: needed-chain");
  });

  it("omits the Changes section when there are no actionable findings", () => {
    const report = buildReport([
      {
        status: "needed",
        chain: { id: "solo-pkg", overrides: [soloOverride] },
        failures: [],
      },
    ]);

    const body = renderPrBody(report);
    expect(body).not.toContain("## Changes");
    expect(body).toContain("## Overrides still required");
  });

  it("falls back to '?' when a removable chain entry has no resolved version", () => {
    const report = buildReport([
      {
        status: "removable",
        chain: { id: "solo-pkg", overrides: [soloOverride] },
        resolved: {},
      },
    ]);

    const body = renderPrBody(report);
    expect(body).toContain("`?`");
  });
});

describe("reportPath", () => {
  it("joins the project directory with .tmp/override-report.json", () => {
    expect(reportPath("/proj")).toBe("/proj/.tmp/override-report.json");
  });
});
