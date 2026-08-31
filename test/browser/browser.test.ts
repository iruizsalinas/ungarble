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
});
