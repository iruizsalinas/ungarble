import { describe, expect, it } from "vitest";
import { findUtf8MojibakeSequences, hasUtf8MojibakeSequence } from "../../../src/detection/utf8-pattern.js";
import { badness, isBad } from "../../../src/detection/badness.js";

describe("detector isolation", () => {
  it("keeps nested iterator cursors independent", () => {
    const text = "cafÃ© and cafÃ©";
    const outer = findUtf8MojibakeSequences(text);
    expect(outer.next().value?.index).toBe(3);
    expect([...findUtf8MojibakeSequences(text)].map(match => match.index)).toEqual([3, 13]);
    expect(hasUtf8MojibakeSequence(text)).toBe(true);
    expect(outer.next().value?.index).toBe(13);
    expect(outer.next().done).toBe(true);
  });

  it("does not let boolean checks consume a scoring cursor", () => {
    for (const text of ["", "clean", "cafÃ©", "\u0080\u0081", "Ã© Ã©"] ) {
      const expected = badness(text);
      expect(isBad(text)).toBe(expected > 0);
      expect(badness(text)).toBe(expected);
      isBad("other");
      expect(badness(text)).toBe(expected);
    }
  });
});
