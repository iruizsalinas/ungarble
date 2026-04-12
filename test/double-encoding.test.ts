import { describe, it, expect } from "vitest";
import { ungarble } from "../src/index.js";

describe("double and triple encoding", () => {
  it("fixes double-encoded text (né)", () => {
    expect(ungarble("Iggy Pop (nÃƒÂ© Jim Osterberg)"))
      .toBe("Iggy Pop (né Jim Osterberg)");
  });

  it("fixes triple-encoded text (doesn't)", () => {
    expect(ungarble("The Mona Lisa doesnÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢t have eyebrows."))
      .toBe("The Mona Lisa doesn\u2019t have eyebrows.");
  });

  it("fixes double-encoded Malay text", () => {
    expect(ungarble("Times New Ã¢â\u201a¬Å\u201c RomanceÃ¢â\u201a¬Â\u009d."))
      .toBe('Times New \u201c Romance\u201d.');
  });

  it("fixes double-encoded quotes", () => {
    expect(ungarble.encoding("Ã¢â\u201a¬Å\u201c")).toBe("\u201c");
  });
});
