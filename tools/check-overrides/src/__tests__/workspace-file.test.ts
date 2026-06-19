import { removeOverridesFromYaml } from "src/workspace-file";

const sampleYaml = `packages:
  - "tools/*"

catalogs:
  app:
    some-normal-package: "^17.7.2"

overrides:
  "parent-a>child-a": "^3.1.2"
  loner-pkg: "^1.0.3"
  "mid-pkg>leaf-pkg": "^1.1.7"
trustPolicy: no-downgrade
`;

describe("removeOverridesFromYaml", () => {
  it("removes a single named override and leaves the rest intact", () => {
    const result = removeOverridesFromYaml(sampleYaml, ["loner-pkg"]);

    expect(result).toContain('"parent-a>child-a": "^3.1.2"');
    expect(result).toContain('"mid-pkg>leaf-pkg": "^1.1.7"');
    expect(result).not.toContain("loner-pkg");
  });

  it("removes multiple overrides", () => {
    const result = removeOverridesFromYaml(sampleYaml, [
      "loner-pkg",
      "parent-a>child-a",
    ]);

    expect(result).not.toContain("loner-pkg");
    expect(result).not.toContain("parent-a>child-a");
    expect(result).toContain('"mid-pkg>leaf-pkg": "^1.1.7"');
  });

  it("removes the overrides block entirely when emptied", () => {
    const result = removeOverridesFromYaml(sampleYaml, [
      "parent-a>child-a",
      "loner-pkg",
      "mid-pkg>leaf-pkg",
    ]);

    expect(result).not.toContain("overrides:");
  });

  it("preserves the catalogs and packages sections", () => {
    const result = removeOverridesFromYaml(sampleYaml, ["loner-pkg"]);

    expect(result).toContain("packages:");
    expect(result).toContain('"tools/*"');
    expect(result).toContain("catalogs:");
    expect(result).toContain('some-normal-package: "^17.7.2"');
  });

  it("is a no-op when there is no overrides block", () => {
    const noOverrides = `packages:\n  - "tools/*"\n`;
    expect(removeOverridesFromYaml(noOverrides, ["foo"])).toBe(noOverrides);
  });

  it("ignores keys that are not present in overrides", () => {
    const result = removeOverridesFromYaml(sampleYaml, ["does-not-exist"]);

    expect(result).toContain('"parent-a>child-a": "^3.1.2"');
    expect(result).toContain("loner-pkg");
  });
});
