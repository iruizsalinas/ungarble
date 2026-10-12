import { expect, it } from "vitest";
import { ungarble } from "../../../src/index.js";

it("preserves chunk parity and stable output across seeded mixed-text workflows", () => {
  let seed = 0x5eed;
  const random = () => seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  const atoms = [
    "café", "cafÃ©", "FranÃƒÂ§ais", "😀", "Привет", "日本語", "&amp;", "&Atilde;&copy;",
    "\x1b[31mred\x1b[0m", "\x1b]0;one\ntwo\x07", "e\u0301", "Ã\0©", "\r\n", " ",
  ];
  for (let i = 0; i < 300; i++) {
    let input = "";
    for (let j = 0, count = 1 + random() % 12; j < count; j++) input += atoms[random() % atoms.length] + " ";
    const expected = ungarble(input);
    const options = { chunk: 1 + random() % 30 };
    expect(ungarble(input, options), JSON.stringify({ input, options })).toBe(expected);
    expect(ungarble.explain(input, options).text).toBe(expected);
    expect(ungarble(expected)).toBe(expected);
  }
});
