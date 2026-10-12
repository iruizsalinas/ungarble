import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { ungarble, type UngarbleConfig } from "../../../src/index.js";
import { ungarble as esm } from "../../../dist/index.js";

const cjs: typeof ungarble = createRequire(import.meta.url)("../../../dist/index.cjs").ungarble;
const cases: Array<{ name: string; input: string; options: UngarbleConfig; error: Error }> = [
  {
    name: "invalid limit type", input: "text", options: { limit: "4" } as unknown as UngarbleConfig,
    error: new TypeError('Option "limit" must be a number.'),
  },
  ...[-1, NaN, -Infinity].map(limit => ({
    name: `invalid limit value ${limit}`, input: "text", options: { limit },
    error: new RangeError('Option "limit" must be a non-negative finite number or Infinity.'),
  })),
  {
    name: "input length", input: "😀", options: { limit: 1.9 },
    error: new RangeError("Input length 2 exceeds the configured limit of 1 UTF-16 code units."),
  },
  {
    name: "chunk lookahead", input: "&amp;".repeat(1000), options: { chunk: 1 },
    error: new RangeError("Chunk boundary exceeds the allowed lookahead of 4096 UTF-16 code units."),
  },
];

describe("error message contract", () => {
  for (const [format, api] of [["source", ungarble], ["ESM", esm], ["CommonJS", cjs]] as const) {
    it.each(cases)(`${format}: $name`, ({ input, options, error }) => {
      for (const call of [api, api.explain]) {
        let caught: unknown;
        try { call(input, options); } catch (failure) { caught = failure; }
        expect(caught).toBeInstanceOf(error.constructor);
        expect((caught as Error).message).toBe(error.message);
        expect((caught as Error).message).toMatch(/^[A-Z][^\n]*\.$/);
      }
    });
  }
});
