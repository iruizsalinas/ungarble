import { describe, expect, it } from "vitest";
import { badnessPatterns, contextRules } from "../../../src/detection/badness-patterns.js";
import { badness, existenceSource, isBad, leadClassBody } from "../../../src/detection/badness.js";

const plain = new RegExp(badnessPatterns.join("|"), "u");
const plainGlobal = new RegExp(badnessPatterns.join("|"), "gu");

describe("badness existence test", () => {
  it("starts every rule with a non-ASCII class behind one lookahead", () => {
    const rules = badnessPatterns.map((rule) => contextRules.get(rule) ?? rule);
    expect(rules.map(leadClassBody)).not.toContain(null);
    expect(existenceSource(rules)).toMatch(/^\(\?=\[/);
    // The counting rules themselves are unchanged.
    expect([...contextRules.keys()].every((rule) => badnessPatterns.includes(rule))).toBe(true);
  });

  it("falls back to the plain alternation when a rule has no known lead", () => {
    expect(leadClassBody("[a-z]x")).toBeNull();
    expect(leadClassBody("\\sx")).toBeNull();
    expect(leadClassBody("[^\u00e9]x")).toBeNull();
    expect(leadClassBody("(?<=[a-z]\\s?)[\u00c3\u00c2][ ]")).toBe("\u00c3\u00c2");
    expect(existenceSource(["[a-z]x", "\u00e9"])).toBe("[a-z]x|\u00e9");
  });

  it("agrees with the plain alternation on seeded random text", () => {
    let seed = 11;
    const rand = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0);
    const pool = [..."aZz.,?! \n\u00a0\u00c3\u00c2\u00e2\u00ce\u00d0\u00d8\u00d9\u00d7\u00e0\u00e9\u00a9\u00ae" +
      "\u2122\u20ac\u0153\u2019\u201c\u201d\u00bb\u0432\u0402\u0412\u03b2\u0392\u221a\u2248\u201a\u00c4\u0101" +
      "\u00b0\u00b5\u2591\u00a6\ufffd\u0080\u03b1\u0430\u4e2d\u00ef\u00bb\u00bf"];
    for (let i = 0; i < 30000; i++) {
      let text = "";
      for (let j = 1 + rand() % 7; j > 0; j--) text += pool[rand() % pool.length];
      if (isBad(text) !== plain.test(text) || badness(text) !== [...text.matchAll(plainGlobal)].length) {
        expect.fail(`badness differs for ${JSON.stringify(text)}`);
      }
    }
  });
});
