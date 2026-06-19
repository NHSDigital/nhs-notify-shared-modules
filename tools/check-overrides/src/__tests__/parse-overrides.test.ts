import { buildChains, parseOverrides } from "src/parse-overrides";

describe("parseOverrides", () => {
  it("parses unscoped overrides", () => {
    const result = parseOverrides({
      "loner-pkg": "^1.0.3",
      "solo-pkg": "^3.4.0",
    });

    expect(result).toEqual([
      {
        key: "loner-pkg",
        parent: undefined,
        package: "loner-pkg",
        versionSelector: undefined,
        versionSpec: "^1.0.3",
        minVersion: "1.0.3",
      },
      {
        key: "solo-pkg",
        parent: undefined,
        package: "solo-pkg",
        versionSelector: undefined,
        versionSpec: "^3.4.0",
        minVersion: "3.4.0",
      },
    ]);
  });

  it("parses scoped overrides with parent>child syntax", () => {
    const result = parseOverrides({
      "parent-a>child-a": "^3.1.2",
      "mid-pkg>leaf-pkg": "^1.1.7",
    });

    expect(result[0]).toMatchObject({
      key: "parent-a>child-a",
      parent: "parent-a",
      package: "child-a",
      minVersion: "3.1.2",
    });
    expect(result[1]).toMatchObject({
      key: "mid-pkg>leaf-pkg",
      parent: "mid-pkg",
      package: "leaf-pkg",
      minVersion: "1.1.7",
    });
  });

  it("parses scoped parents (e.g. @scope/root-pkg>mid-pkg)", () => {
    const [result] = parseOverrides({
      "@scope/root-pkg>mid-pkg": "^5.7.0",
    });

    expect(result).toMatchObject({
      key: "@scope/root-pkg>mid-pkg",
      parent: "@scope/root-pkg",
      package: "mid-pkg",
      minVersion: "5.7.0",
    });
  });

  it("treats exact pins as the minimum version", () => {
    const [result] = parseOverrides({
      "host-pkg>peer-dep-pkg": "19.0.0",
    });

    expect(result.minVersion).toBe("19.0.0");
  });

  it("throws if a version spec has no parseable minimum", () => {
    expect(() => parseOverrides({ foo: "not-a-version" })).toThrow(
      /Cannot determine minimum/,
    );
  });

  it("parses overrides with a version selector in the key", () => {
    const result = parseOverrides({
      "uuid@<11.1.1": ">=11.1.1",
    });

    expect(result).toEqual([
      {
        key: "uuid@<11.1.1",
        parent: undefined,
        package: "uuid",
        versionSelector: "<11.1.1",
        versionSpec: ">=11.1.1",
        minVersion: "11.1.1",
      },
    ]);
  });

  it("parses scoped package with a version selector", () => {
    const [result] = parseOverrides({
      "@scope/pkg@<2.0.0": ">=2.0.0",
    });

    expect(result).toMatchObject({
      key: "@scope/pkg@<2.0.0",
      parent: undefined,
      package: "@scope/pkg",
      versionSelector: "<2.0.0",
      minVersion: "2.0.0",
    });
  });

  it("parses parent>child with a version selector on the child", () => {
    const [result] = parseOverrides({
      "parent-pkg>uuid@<11.1.1": ">=11.1.1",
    });

    expect(result).toMatchObject({
      key: "parent-pkg>uuid@<11.1.1",
      parent: "parent-pkg",
      package: "uuid",
      versionSelector: "<11.1.1",
      minVersion: "11.1.1",
    });
  });

  it("strips version selectors from the parent", () => {
    const [result] = parseOverrides({
      "qar@1>zoo": "^2.0.0",
    });

    expect(result).toMatchObject({
      key: "qar@1>zoo",
      parent: "qar",
      package: "zoo",
      minVersion: "2.0.0",
    });
  });

  it("strips version selectors from a scoped parent", () => {
    const [result] = parseOverrides({
      "@scope/qar@^1.0.0>zoo": "^2.0.0",
    });

    expect(result).toMatchObject({
      key: "@scope/qar@^1.0.0>zoo",
      parent: "@scope/qar",
      package: "zoo",
      minVersion: "2.0.0",
    });
  });

  it("skips removal overrides (dash value)", () => {
    const result = parseOverrides({
      "foo@1.0.0>bar": "-",
      "real-pkg": "^1.0.0",
    });

    expect(result).toHaveLength(1);
    expect(result[0].package).toBe("real-pkg");
  });

  it("skips $-reference overrides", () => {
    const result = parseOverrides({
      bar: "$foo",
      "real-pkg": "^2.0.0",
    });

    expect(result).toHaveLength(1);
    expect(result[0].package).toBe("real-pkg");
  });

  it("skips npm: alias overrides", () => {
    const result = parseOverrides({
      quux: "npm:@myorg/quux@^1.0.0",
      "real-pkg": "^3.0.0",
    });

    expect(result).toHaveLength(1);
    expect(result[0].package).toBe("real-pkg");
  });

  it("skips link: and file: protocol overrides", () => {
    const result = parseOverrides({
      "link-pkg": "link:../local",
      "file-pkg": "file:../local.tgz",
      "real-pkg": "^1.0.0",
    });

    expect(result).toHaveLength(1);
    expect(result[0].package).toBe("real-pkg");
  });

  it("skips workspace: and catalog: protocol overrides", () => {
    const result = parseOverrides({
      "ws-pkg": "workspace:*",
      "cat-pkg": "catalog:default",
      "real-pkg": "^1.0.0",
    });

    expect(result).toHaveLength(1);
    expect(result[0].package).toBe("real-pkg");
  });
});
