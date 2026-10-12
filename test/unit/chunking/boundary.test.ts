import { describe, expect, it } from "vitest";
import { safeChunkEnd } from "../../../src/chunking/boundary.js";
import { normalizedMaxDecodeLength } from "../../../src/chunking/budget.js";
import { MAX_BOUNDARY_LOOKAHEAD } from "../../../src/security/budgets.js";

describe("chunk boundary invariants", () => {
  it("always advances without splitting surrogate pairs", () => {
    for (const text of ["abc😀def", "&amp;&#169;😀", "\x1b[31mred\x1b[0m", "cafÃ©", "\ud800x\udc00"]) {
      for (const chunk of [1, 2, 3, 4, 8, 32]) {
        for (const enabled of [true, false]) {
          let pos = 0;
          while (pos < text.length) {
            const end = safeChunkEnd(text, pos, chunk, { encoding: enabled, html: enabled, escapes: enabled });
            expect(end).toBeGreaterThan(pos);
            expect(end).toBeLessThanOrEqual(Math.min(text.length, pos + chunk + MAX_BOUNDARY_LOOKAHEAD));
            const splitPair = /[\ud800-\udbff]/.test(text[end - 1]!) && /[\udc00-\udfff]/.test(text[end] ?? "");
            expect(splitPair).toBe(false);
            pos = end;
          }
        }
      }
    }
  });

  it.each([[NaN, 10], [Infinity, 10], [-Infinity, 10], [-1, 1], [0, 1], [0.5, 1], [2.9, 2]])
    ("normalizes chunk %s to %s", (value, expected) => {
      expect(normalizedMaxDecodeLength(value, 10)).toBe(expected);
    });

  it("accepts the exact lookahead limit and rejects one unit beyond it", () => {
    const config = { encoding: false, html: false, escapes: true };
    const exact = "\x1b]" + "a".repeat(MAX_BOUNDARY_LOOKAHEAD - 2) + "\x07";
    expect(safeChunkEnd(exact, 0, 1, config)).toBe(exact.length);
    expect(() => safeChunkEnd(exact.replace("\x07", "a\x07"), 0, 1, config)).toThrow(RangeError);
  });
});
