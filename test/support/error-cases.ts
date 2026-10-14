import type { UngarbleConfig } from "../../src/index.js";

export const errorCases: Array<{ name: string; input: string; options: UngarbleConfig; error: Error }> = [
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
