import { createRequire } from "node:module";
import { describe, expect, expectTypeOf, it } from "vitest";
import * as esm from "../../../dist/index.js";
import { ungarble, type UngarbleConfig, type FixResult, type ExplanationStep } from "../../../src/index.js";

describe("public package contract", () => {
  it("exports only the documented runtime API in ESM and CommonJS", () => {
    const cjs = createRequire(import.meta.url)("../../../dist/index.cjs");
    expect(Object.keys(esm)).toEqual(["ungarble"]);
    expect(Object.keys(cjs)).toEqual(["ungarble"]);
    const methods = ["explain", "encoding", "detect", "score", "html", "quotes", "ligatures", "width", "lines", "surrogates", "escapes", "controls", "c1"].sort();
    for (const api of [ungarble, esm.ungarble, cjs.ungarble]) {
      expect(Object.keys(api).sort()).toEqual(methods);
      expect(api("cafÃ©")).toBe("café");
      expect(api.explain("cafÃ©")).toEqual({ text: "café", steps: [
        { action: "encode", detail: "latin-1" }, { action: "decode", detail: "utf-8" },
      ] });
    }
  });

  it("preserves configuration and result types", () => {
    const options: UngarbleConfig = { encoding: true, html: "auto", normalization: false, chunk: 16, limit: 100 };
    expectTypeOf(ungarble("text", options)).toEqualTypeOf<string>();
    expectTypeOf(ungarble.explain("text", options)).toEqualTypeOf<FixResult>();
    expectTypeOf(ungarble.detect("text")).toEqualTypeOf<boolean>();
    expectTypeOf(ungarble.score("text")).toEqualTypeOf<number>();
    expectTypeOf<FixResult["steps"][number]>().toEqualTypeOf<ExplanationStep>();
    expectTypeOf<esm.UngarbleConfig>().toEqualTypeOf<UngarbleConfig>();
  });

  it("does not mutate frozen options or reuse explanation arrays", () => {
    const options = Object.freeze({ html: "auto" as const, chunk: 3 });
    const first = ungarble.explain("cafÃ©", options);
    first.steps.length = 0;
    expect(ungarble.explain("cafÃ©", options).steps.length).toBeGreaterThan(0);
    expect(options).toEqual({ html: "auto", chunk: 3 });
  });

  it("keeps repeated and interleaved detector calls independent", () => {
    for (let i = 0; i < 50; i++) {
      expect(ungarble.detect("cafÃ©")).toBe(true);
      expect(ungarble.score("cafÃ©")).toBe(1);
      expect(ungarble.encoding("cafÃ©")).toBe("café");
      expect(ungarble.detect("clean")).toBe(false);
      expect(ungarble.score("clean")).toBe(0);
    }
  });
});
