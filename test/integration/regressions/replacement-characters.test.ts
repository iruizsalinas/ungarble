import { describe, expect, it } from "vitest";
import { ungarble } from "../../../src/index.js";

// U+FFFD marks bytes that were already lost. Sloppy codecs encode it as byte
// 1A; decoding that byte as the SUB control let cleanup delete the marker.
describe("replacement characters", () => {
  it.each(["\ufffd\ufffd", "Gr\ufffd\ufffde", "a\ufffd\ufffdb", "x \ufffd\ufffd\ufffd y"])(
    "keeps %j unchanged",
    (input) => {
      expect(ungarble(input)).toBe(input);
      expect(ungarble.encoding(input)).toBe(input);
    },
  );

  it.each([
    ["caf\u00c3\u00a9\ufffd", "caf\u00e9\ufffd"],
    ["\ufffd\u00c3\u00a9", "\ufffd\u00e9"],
    ["\ufffd\ufffd caf\u00c3\u00a9", "\ufffd\ufffd caf\u00e9"],
    // A damaged UTF-8 sequence still becomes a single U+FFFD.
    ["It\u00e2\u20ac\ufffds", "It\ufffds"],
    ["na\u00c3\ufffdve", "na\ufffdve"],
  ])("repairs %j without deleting replacement characters", (input, expected) => {
    expect(ungarble(input)).toBe(expected);
  });

  it("repairs a lone surrogate like the U+FFFD that replaces it, in one call", () => {
    for (const [input, expected] of [["\u00e2\u20ac\ud800s", "\ufffds"], ["na\u00c3\ud800ve", "na\ufffdve"]] as const) {
      expect(ungarble(input)).toBe(expected);
      expect(ungarble(expected)).toBe(expected);
      expect(ungarble.explain(input).text).toBe(expected);
    }
  });
});
