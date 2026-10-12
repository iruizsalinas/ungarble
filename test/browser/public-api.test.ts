import { describe, expect, it } from "vitest";
import { ungarble } from "../../dist/index.js";

describe("browser build", () => {
  it("runs with browser platform APIs", () => {
    expect(window).toBeDefined();
    expect(TextEncoder).toBeDefined();
    expect(TextDecoder).toBeDefined();
  });

  it("repairs mojibake from the published ESM build", () => {
    expect(ungarble("cafÃ©")).toBe("café");
    expect(ungarble("Itâ€™s 20â‚¬")).toBe("It’s 20€");
    expect(ungarble("FranÃƒÂ§ais")).toBe("Français");
  });

  it("preserves valid Unicode text", () => {
    const text = "Already valid: café ✓ 😀";
    expect(ungarble(text)).toBe(text);
  });

  it("enforces resource guards in the browser build", () => {
    const marks = "a" + "\u0301\u0316".repeat(129);
    expect(ungarble(marks)).toBe(marks);
    expect(() => ungarble("&amp;".repeat(1000), { chunk: 1 })).toThrow(RangeError);
    expect(() => ungarble("abcd", { limit: 3 })).toThrow(RangeError);
  });

  it("preserves chunked Unicode and explanation parity", () => {
    const input = "😀 caf&Atilde;&copy;\r\n";
    const options = { chunk: 1, normalization: "NFD" as const };
    expect(ungarble(input, options)).toBe("😀 cafe\u0301\n");
    expect(ungarble.explain(input, options).text).toBe(ungarble(input, options));
  });

  it("repairs cleanup interactions and keeps explicit undefined defaults", () => {
    const input = "cafÃ\0©\n\x1b]title\ncontinued\x1b\\done";
    for (const chunk of [1, 7, 14, 1_000_000]) {
      expect(ungarble(input, { chunk, encoding: undefined })).toBe("café\ndone");
      expect(ungarble.explain(input, { chunk }).text).toBe("café\ndone");
    }
  });
});
