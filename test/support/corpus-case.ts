import { it, expect } from "vitest";
import { ungarble } from "../../src/index.js";

export function testCase(c: {
  label: string;
  original: string;
  fixed: string;
  "fixed-encoding"?: string;
  expect: string;
}) {
  if (c.expect === "fail") return;

  it(c.label, () => {
    const expected = c["fixed-encoding"] ?? c.fixed;
    expect(ungarble.encoding(c.original)).toBe(expected);
  });
}
