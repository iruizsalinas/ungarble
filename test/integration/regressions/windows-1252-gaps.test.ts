import { describe, expect, it } from "vitest";
import { ungarble } from "../../../src/index.js";

describe("Windows-1252 two-character mojibake", () => {
  it.each([
    ["groÃŸ", "groß"],
    ["Ich weiÃŸ es nicht", "Ich weiß es nicht"],
    ["FuÃŸ", "Fuß"],
    ["CosÃ¬ è", "Così è"],
    ["ÃšLTIMO", "ÚLTIMO"],
    ["ÃŽle-de-France", "Île-de-France"],
  ])("repairs %j", (input, expected) => {
    expect(ungarble(input)).toBe(expected);
    expect(ungarble.detect(input)).toBe(true);
  });
});

describe("C1 controls inside mojibake", () => {
  it("decodes the UTF-8 sequence before mapping C1 controls to Windows-1252", () => {
    expect(ungarble("Ã\u008en România")).toBe("În România");
    expect(ungarble("Ã\u008ele-de-France été")).toBe("Île-de-France été");
  });

  it("still maps C1 punctuation in Latin-1 text", () => {
    expect(ungarble("\u0084Handwerk bringt dich überall hin\u0093"))
      .toBe("„Handwerk bringt dich überall hin“");
  });
});

describe("curly apostrophes after mojibake lead characters", () => {
  it("only protects English possessives and contractions", () => {
    expect(ungarble("Å’uvres complÃ¨tes")).toBe("Œuvres complètes");
    expect(ungarble("HÃ’A BÃŒNH")).toBe("HÒA BÌNH");
    expect(ungarble("Ã„Å’eÃ…Â¡tina")).toBe("Čeština");
    expect(ungarble("NÃƒÆ’O EST")).toBe("NÃO EST");
  });

  it.each([
    "There are a lot of Ã’s in mojibake text",
    "Join ZZAJÉ’s Official Fan List",
    "JOSÉ’S CAFÉ AND ZZAJÉ’ll",
  ])("preserves %j", text => {
    expect(ungarble(text)).toBe(text);
  });
});
