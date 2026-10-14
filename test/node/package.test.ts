import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { ungarble as esm } from "../../dist/index.js";
import { errorCases } from "../support/error-cases.js";

const cjs = createRequire(import.meta.url)("../../dist/index.cjs");

describe("CommonJS package contract", () => {
  it("matches the ESM exports, methods and repair explanations", () => {
    expect(Object.keys(cjs)).toEqual(["ungarble"]);
    expect(Object.keys(cjs.ungarble).sort()).toEqual(Object.keys(esm).sort());
    expect(cjs.ungarble("cafÃ©")).toBe("café");
    expect(cjs.ungarble.explain("cafÃ©")).toEqual(esm.explain("cafÃ©"));
  });

  it.each(errorCases)("CommonJS: $name", ({ input, options, error }) => {
    for (const call of [cjs.ungarble, cjs.ungarble.explain]) {
      let caught: unknown;
      try { call(input, options); } catch (failure) { caught = failure; }
      expect(caught).toBeInstanceOf(error.constructor);
      expect((caught as Error).message).toBe(error.message);
      expect((caught as Error).message).toMatch(/^[A-Z][^\n]*\.$/);
    }
  });
});
