import { compareBundles } from "src/size-comparator";
import type { LambdaBundleInfo } from "src/types";

function makeInfo(name: string, totalBytes: number): LambdaBundleInfo {
  return { name, totalBytes, files: new Map() };
}

describe("compareBundles", () => {
  it("marks a lambda as increased when change exceeds threshold", () => {
    const baseline = new Map([["fn", makeInfo("fn", 1000)]]);
    const current = new Map([["fn", makeInfo("fn", 1200)]]);

    const [result] = compareBundles(baseline, current, 5);

    expect(result.status).toBe("increased");
    expect(result.absoluteChange).toBe(200);
    expect(result.percentageChange).toBeCloseTo(20);
  });

  it("marks a lambda as decreased when change exceeds threshold in negative direction", () => {
    const baseline = new Map([["fn", makeInfo("fn", 1000)]]);
    const current = new Map([["fn", makeInfo("fn", 800)]]);

    const [result] = compareBundles(baseline, current, 5);

    expect(result.status).toBe("decreased");
    expect(result.absoluteChange).toBe(-200);
    expect(result.percentageChange).toBeCloseTo(-20);
  });

  it("marks a lambda as unchanged when change is within threshold", () => {
    const baseline = new Map([["fn", makeInfo("fn", 1000)]]);
    const current = new Map([["fn", makeInfo("fn", 1030)]]);

    const [result] = compareBundles(baseline, current, 5);

    expect(result.status).toBe("unchanged");
  });

  it("marks a lambda as unchanged when change is exactly at the positive threshold boundary", () => {
    const baseline = new Map([["fn", makeInfo("fn", 1000)]]);
    const current = new Map([["fn", makeInfo("fn", 1050)]]);

    const [result] = compareBundles(baseline, current, 5);

    expect(result.status).toBe("unchanged");
  });

  it("marks a lambda as unchanged when change is exactly at the negative threshold boundary", () => {
    const baseline = new Map([["fn", makeInfo("fn", 1000)]]);
    const current = new Map([["fn", makeInfo("fn", 950)]]);

    const [result] = compareBundles(baseline, current, 5);

    expect(result.status).toBe("unchanged");
  });

  it("marks a new lambda with status new and undefined baseline", () => {
    const baseline = new Map<string, LambdaBundleInfo>();
    const current = new Map([["fn", makeInfo("fn", 500)]]);

    const [result] = compareBundles(baseline, current, 5);

    expect(result.status).toBe("new");
    expect(result.baselineBytes).toBeUndefined();
    expect(result.currentBytes).toBe(500);
    expect(result.absoluteChange).toBeUndefined();
    expect(result.percentageChange).toBeUndefined();
  });

  it("marks a removed lambda with status removed and undefined current", () => {
    const baseline = new Map([["fn", makeInfo("fn", 500)]]);
    const current = new Map<string, LambdaBundleInfo>();

    const [result] = compareBundles(baseline, current, 5);

    expect(result.status).toBe("removed");
    expect(result.currentBytes).toBeUndefined();
    expect(result.baselineBytes).toBe(500);
    expect(result.absoluteChange).toBeUndefined();
    expect(result.percentageChange).toBeUndefined();
  });

  it("returns percentage change of 0 when baseline size is 0", () => {
    const baseline = new Map([["fn", makeInfo("fn", 0)]]);
    const current = new Map([["fn", makeInfo("fn", 100)]]);

    const [result] = compareBundles(baseline, current, 5);

    expect(result.percentageChange).toBe(0);
    expect(result.status).toBe("unchanged");
  });

  it("respects a custom threshold", () => {
    const baseline = new Map([["fn", makeInfo("fn", 1000)]]);
    const current = new Map([["fn", makeInfo("fn", 1080)]]);

    const [result] = compareBundles(baseline, current, 5);
    expect(result.status).toBe("increased");

    const [resultLoose] = compareBundles(baseline, current, 10);
    expect(resultLoose.status).toBe("unchanged");
  });

  it("sorts results alphabetically by name", () => {
    const baseline = new Map([
      ["zebra", makeInfo("zebra", 1000)],
      ["apple", makeInfo("apple", 1000)],
      ["mango", makeInfo("mango", 1000)],
    ]);
    const current = new Map([
      ["zebra", makeInfo("zebra", 1000)],
      ["apple", makeInfo("apple", 1000)],
      ["mango", makeInfo("mango", 1000)],
    ]);

    const results = compareBundles(baseline, current);

    expect(results.map((r) => r.name)).toEqual(["apple", "mango", "zebra"]);
  });

  it("populates baseline and current bytes correctly for present lambdas", () => {
    const baseline = new Map([["fn", makeInfo("fn", 1000)]]);
    const current = new Map([["fn", makeInfo("fn", 1200)]]);

    const [result] = compareBundles(baseline, current);

    expect(result.baselineBytes).toBe(1000);
    expect(result.currentBytes).toBe(1200);
  });
});
