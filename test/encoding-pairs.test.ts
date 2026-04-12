import { describe, it, expect } from "vitest";
import { ungarble } from "../src/index.js";

describe("encoding pairs", () => {
  describe("UTF-8 decoded as Latin-1/Windows-1252", () => {
    const cases: Array<[string, string, string]> = [
      ["José", "JosÃ©", "UTF-8 as Latin-1"],
      ["Hôtel", "HÃ´tel", "circumflex o"],
      ["café", "cafÃ©", "acute e"],
      ["naïve", "naÃ¯ve", "diaeresis i"],
      ["résumé", "rÃ©sumÃ©", "multiple accents"],
      ["über", "Ã¼ber", "umlaut u"],
      ["Ñ", "Ã\u0091", "N tilde uppercase"],
      ["ñ", "Ã±", "N tilde lowercase"],
      ["à", "Ã\u00a0", "a grave"],
      ["ç", "Ã§", "c cedilla"],
      ["ê", "Ãª", "e circumflex"],
      ["ë", "Ã«", "e diaeresis"],
      ["î", "Ã®", "i circumflex"],
      ["ô", "Ã´", "o circumflex"],
      ["û", "Ã»", "u circumflex"],
      ["ü", "Ã¼", "u diaeresis"],
      ["Ö", "Ã\u0096", "O diaeresis"],
      ["Ü", "Ã\u009c", "U diaeresis"],
    ];

    for (const [expected, input, description] of cases) {
      it(`fixes ${description}: ${input} -> ${expected}`, () => {
        expect(ungarble.encoding(input)).toBe(expected);
      });
    }
  });

  describe("UTF-8 decoded as Windows-1250 (Central European)", () => {
    it("fixes Czech text", () => {
      expect(ungarble("LiĂ¨ge Avenue de l'HĂ´pital"))
        .toBe("Liège Avenue de l'Hôpital");
    });

    it("fixes Čeština", () => {
      expect(ungarble("ÄŒeÅ¡tina")).toBe("Čeština");
    });
  });

  describe("UTF-8 decoded as Windows-1251 (Cyrillic)", () => {
    it("fixes Cyrillic mojibake for en dash", () => {
      // вЂ" (в=0xE2, Ђ=0x80, "=0x93) -> UTF-8 E2 80 93 = U+2013 (en dash)
      expect(ungarble.encoding("Blog Traffic Tip 2 вЂ\u201c Broadcast Email"))
        .toBe("Blog Traffic Tip 2 \u2013 Broadcast Email");
    });
  });

  describe("UTF-8 decoded as Windows-1253 (Greek)", () => {
    it("fixes Greek text", () => {
      expect(ungarble("Î\u0095Î»Î»Î·Î½Î¹ÎºÎ¬")).toBe("Ελληνικά");
    });
  });

  describe("UTF-8 decoded as Windows-1257 (Baltic)", () => {
    it("fixes Latvian text", () => {
      expect(ungarble("Å veices baÅ\u0086Ä·ieri gaida konkrÄ\u0093tus investÄ«ciju projektus"))
        .toBe("Šveices baņķieri gaida konkrētus investīciju projektus");
    });
  });

  describe("UTF-8 decoded as ISO-8859-2", () => {
    it("fixes Czech ISO-8859-2 text", () => {
      expect(ungarble("MĂĄm dost tĹ\u0099etĂ\u00adho tisĂ\u00adciletĂ\u00ad"))
        .toBe("Mám dost třetího tisíciletí");
    });
  });

  describe("UTF-8 decoded as MacRoman", () => {
    it("fixes German ß via MacRoman", () => {
      expect(ungarble("wei√ü")).toBe("weiß");
    });

    it("fixes Italian MacRoman", () => {
      expect(ungarble("Le Vigne di Zam√≤")).toBe("Le Vigne di Zamò");
    });
  });

  describe("UTF-8 decoded as CP437", () => {
    it("fixes Russian via CP437", () => {
      expect(ungarble("#╨┐╤Ç╨░╨▓╨╕╨╗╤î╨╜╨╛╨╡╨┐╨╕╤é╨░╨╜╨╕╨╡"))
        .toBe("#правильноепитание");
    });

    it("fixes Czech via CP437", () => {
      expect(ungarble("─îe┼ítina")).toBe("Čeština");
    });
  });

  describe("CESU-8 (surrogate pairs as 3-byte sequences)", () => {
    it("fixes CESU-8 emoji", () => {
      expect(ungarble("Hi guys í ½í¸\u008d")).toBe("Hi guys 😍");
    });
  });
});
