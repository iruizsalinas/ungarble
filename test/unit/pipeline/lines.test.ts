import { describe, expect, it } from "vitest";
import { ungarble } from "../../../src/index.js";

describe("line orchestration", () => {
  it.each(["", "\n", "\n\n", "\na\n", "a\nb", "a\n\nb\n", "\n".repeat(10000)])
    ("preserves empty and trailing lines", text => {
      expect(ungarble(text)).toBe(text);
      expect(ungarble.explain(text)).toEqual({ text, steps: [] });
    });

  it("keeps explanations in input order across lines", () => {
    const result = ungarble.explain("cafÃ©\n&amp;\n", { normalization: false });
    expect(result).toEqual({ text: "café\n&\n", steps: [
      { action: "encode", detail: "latin-1" },
      { action: "decode", detail: "utf-8" },
      { action: "apply", detail: "html" },
    ] });
  });
});
