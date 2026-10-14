import { describe, expect, it } from "vitest";
import { ungarble } from "../../src/index.js";
import { safeChunkEnd } from "../../src/chunking/boundary.js";

describe("adversarial input", () => {
  for (const normalization of ["NFC", "NFD", "NFKC", "NFKD"] as const) {
    it(`keeps overlong decomposed mark runs as they are for ${normalization}`, () => {
      const input = "a" + "\u0315".repeat(128) + "\u0300".repeat(128);
      expect(ungarble(input, { normalization })).toBe(input.normalize(normalization));
      // One more mark would make native reordering quadratic. Keep that
      // combining sequence unchanged, without throwing on ordinary Zalgo text,
      // and still normalize the text around it.
      const long = input + "\u0300";
      expect(ungarble(long, { normalization })).toBe(long);
      expect(ungarble.explain(long, { normalization }).text).toBe(long);
      expect(ungarble("e\u0301 " + long + " e\u0301", { normalization }))
        .toBe("e\u0301 ".normalize(normalization) + long + " e\u0301".normalize(normalization));
      // U+0344 decomposes into two marks. Check after decomposition too.
      expect(ungarble("\u0344".repeat(129), { normalization })).toBe("\u0344".repeat(129));
      expect(ungarble(("a" + "\u0300".repeat(200)).repeat(5), { normalization }))
        .toBe(("a" + "\u0300".repeat(200)).repeat(5).normalize(normalization));
    });
  }

  it("checks marks introduced by HTML decoding", () => {
    // Normalizing would reorder these marks; the overlong run stays as decoded.
    expect(ungarble("&#x301;&#x316;".repeat(129))).toBe("\u0301\u0316".repeat(129));
    expect(ungarble("&#x301;&#x316;".repeat(128))).toBe("\u0316".repeat(128) + "\u0301".repeat(128));
  });

  it("preserves spaced initials while repairing ordinary altered spaces", () => {
    expect(ungarble("C O N C L U S \u00c3 O")).toBe("C O N C L U S \u00c3 O");
    expect(ungarble("A B \u00c3 Z \u0100")).toBe("A B \u00c3 Z \u0100");
    expect(ungarble("A B x \u00c3 z \u0100")).toBe("A B x \u00e0 z \u0100");
  });

  it("preserves ordinary composition, Hangul, supplementary marks and invalid forms", () => {
    for (const input of ["e\u0301", "\u1100\u1161\u11a8", "\ufb03", "x\u{1d165}\u0300", "\uff76\uff9e"]) {
      for (const normalization of ["NFC", "NFD", "NFKC", "NFKD"] as const) {
        expect(ungarble(input, { normalization, encoding: false })).toBe(input.normalize(normalization));
      }
    }
    expect(ungarble("e\u0301", { normalization: "invalid" as "NFC" })).toBe("e\u0301");
  });

  it("rejects boundary lookahead beyond its budget without splitting tokens", () => {
    const config = { encoding: true, html: true, escapes: true } as const;
    for (const input of ["&amp;".repeat(10000), "a\u00c2\u00a9".repeat(10000) + "\u0100", "\x1b]" + "a".repeat(30000) + "\x07", "\x1b]" + "a".repeat(30000)]) {
      const chunk = input.startsWith("a") ? 16 : 1;
      expect(() => safeChunkEnd(input, 0, chunk, config)).toThrow(RangeError);
      expect(() => ungarble(input, { chunk: 1 })).toThrow(RangeError);
    }
    expect(ungarble("caf&Atilde;&copy;", { chunk: 1 })).toBe("café");
  });

  it("normalizes decoded line breaks and respects opt-out", () => {
    expect(ungarble("&#13;&#10;Injected: yes")).toBe("\nInjected: yes");
    expect(ungarble("&#13;&#10;", { lines: false })).toBe("\r\n");
    expect(ungarble.explain("&#13;&#10;").text).toBe("\n");
  });

  it("enforces input limits before decoding and ignores prototype keys", () => {
    expect(() => ungarble("&#x315;".repeat(1000), { limit: 10 })).toThrow(/Input length/);
    expect(ungarble("text", JSON.parse('{"__proto__":{"polluted":true}}'))).toBe("text");
    expect(Object.hasOwn(Object.prototype, "polluted")).toBe(false);
  });
});
