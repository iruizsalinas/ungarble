import { describe, expect, it } from "vitest";
import { ungarble } from "../src/index.js";

describe("cross-ecosystem regressions", () => {
  it("repairs a mojibaked byte-order mark", () => {
    expect(ungarble.encoding("ï»¿")).toBe("\ufeff");
    expect(ungarble("ï»¿")).toBe("");
  });

  it("repairs a standalone mojibaked euro sign", () => {
    expect(ungarble.encoding("â‚¬")).toBe("€");
    expect(ungarble("â‚¬")).toBe("€");
  });

  it("repairs a mojibaked replacement character", () => {
    expect(ungarble.encoding("ï¿½")).toBe("�");
  });

  it("repairs mojibaked fullwidth punctuation before optional width folding", () => {
    expect(ungarble.encoding("Ningboï¼ŒChina")).toBe("Ningbo，China");
    expect(ungarble("Ningboï¼ŒChina")).toBe("Ningbo，China");
    expect(ungarble("Ningboï¼ŒChina", { width: true })).toBe("Ningbo,China");
  });

  it("repairs otherwise ambiguous Latin mojibake when embedded in a word", () => {
    expect(ungarble.encoding("StraÃŸe")).toBe("Straße");
    expect(ungarble.encoding("smÃ¬ch")).toBe("smìch");
    expect(ungarble.encoding("Â¿Qué?")).toBe("¿Qué?");
  });

  it("repairs lossy UTF-8 sequences containing a replacement character", () => {
    expect(ungarble.encoding("â€œlossy decodingâ€�")).toBe("“lossy decoding�");
    expect(ungarble.encoding("ðŸ�°")).toBe("�");
    expect(ungarble.encoding("âš �")).toBe("⚠�");
    expect(ungarble.encoding("â €")).toBe("⠀");
  });

  it("repairs an extra encoding layer over entity-encoded mojibake", () => {
    expect(ungarble("10ÃŽ&frac14;s")).toBe("10μs");
  });

  it("repairs lossy Tamil mojibake", () => {
    expect(ungarble.encoding("à®¤à®®à®¿à®´à¯�")).toBe("தமிழ�");
  });

  it("repairs a complete low-confidence Arabic mojibake run", () => {
    expect(ungarble.encoding("Ø¹ÙŠØ¯")).toBe("عيد");
    expect(ungarble.encoding("French Ø¹ÙŠØ¯ text")).toBe("French عيد text");
  });

  it("repairs a ligature misread through Windows-1251", () => {
    expect(ungarble.encoding("signiп¬Ѓcantly")).toBe("signiﬁcantly");
    expect(ungarble("signiп¬Ѓcantly", { ligatures: true })).toBe("significantly");
  });

  it("repairs altered non-breaking spaces in ordinary prose", () => {
    expect(ungarble.encoding("frais relatifs Ã l’utilisation")).toBe("frais relatifs à l’utilisation");
  });

  it("repairs three layers of UTF-8 misread as MacRoman", () => {
    expect(ungarble.encoding("t‚Äö√†√∂¬¨¬©l‚Äö√†√∂¬¨¬©charger")).toBe("télécharger");
  });

  it("repairs nested lossy mojibake without decoding an inner tail first", () => {
    const input = "Ã¢â€�â€™(Ã¢Å’Â£Ã‹â€ºÃ¢Å’Â£)Ã¢â€�Å½";
    expect(ungarble.encoding(input)).toBe("�(⌣˛⌣)�");
  });

  it("remains idempotent for every Latin-1 and Windows-1252 byte mapping pair", () => {
    const windows1252 = new TextDecoder("windows-1252");
    const unassigned = new Set([0x81, 0x8d, 0x8f, 0x90, 0x9d]);
    const mojibake: string[] = [];

    for (let byte = 0x80; byte <= 0xff; byte++) {
      if (unassigned.has(byte)) continue;
      const original = windows1252.decode(Uint8Array.of(byte));
      mojibake.push(
        windows1252.decode(new TextEncoder().encode(original)),
        Buffer.from(original, "utf8").toString("latin1"),
      );
    }

    const unique = [...new Set(mojibake)];
    for (const left of unique) {
      for (const right of unique) {
        const once = ungarble.encoding(left + right);
        expect(ungarble.encoding(once)).toBe(once);
      }
    }
  });
});
