import { Worker } from "node:worker_threads";
import { describe, expect, it } from "vitest";
import { ungarble } from "../../src/index.js";
import { safeChunkEnd } from "../../src/chunking/boundary.js";

describe("adversarial input", () => {
  for (const format of ["esm", "cjs"]) {
    it(`bounds CPU and memory for attack payloads and seeded fuzz (${format})`, async () => {
      // A test timeout alone cannot interrupt a blocked synchronous regex.
      const worker = new Worker(new URL("../fixtures/security-worker.mjs", import.meta.url), {
        workerData: format,
        resourceLimits: { maxOldGenerationSizeMb: 192, stackSizeMb: 4 },
      });
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        await new Promise<void>((resolve, reject) => {
          timer = setTimeout(() => reject(new Error("Security worker exceeded its 5 second budget")), 5000);
          worker.once("message", result => result.ok ? resolve() : reject(new Error(result.error)));
          worker.once("error", reject);
          worker.once("exit", code => reject(new Error(`Security worker exited before completion: ${code}`)));
        });
      } finally {
        clearTimeout(timer);
        await worker.terminate();
      }
    }, 10000);
  }

  for (const normalization of ["NFC", "NFD", "NFKC", "NFKD"] as const) {
    it(`bounds decomposed mark runs for ${normalization}`, () => {
      const input = "a" + "\u0315".repeat(128) + "\u0300".repeat(128);
      expect(ungarble(input, { normalization })).toBe(input.normalize(normalization));
      expect(() => ungarble(input + "\u0300", { normalization })).toThrow(RangeError);
      // U+0344 decomposes into two marks. Check after decomposition too.
      expect(() => ungarble("\u0344".repeat(129), { normalization })).toThrow(RangeError);
      expect(() => ungarble.explain(input + "\u0300", { normalization })).toThrow(RangeError);
      expect(ungarble(("a" + "\u0300".repeat(200)).repeat(5), { normalization }))
        .toBe(("a" + "\u0300".repeat(200)).repeat(5).normalize(normalization));
    });
  }

  it("checks marks introduced by HTML decoding", () => {
    expect(() => ungarble("&#x315;".repeat(257))).toThrow(RangeError);
    expect(ungarble("&#x315;".repeat(257), { normalization: false })).toBe("\u0315".repeat(257));
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
