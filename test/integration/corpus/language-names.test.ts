import { describe } from "vitest";
import { testCase } from "../../support/corpus-case.js";

describe("language names", () => {
  const cases = [
    { label: "Czech", original: "ÄŒeÅ¡tina", fixed: "Čeština", expect: "pass" },
    { label: "Gaelic", original: "G\u00c3\u00a0idhlig", fixed: "G\u00e0idhlig", expect: "pass" },
    { label: "Lithuanian", original: "Lietuvi\u00c5\u00b3", fixed: "Lietuvi\u0173", expect: "pass" },
    { label: "Vietnamese", original: "Ti\u00c3\u00a1\u00c2\u00ba\u00bfng Vi\u00c3\u00a1\u00c2\u00bb\u2021t", fixed: "Ti\u1ebfng Vi\u1ec7t", expect: "pass" },
    { label: "Greek", original: "\u00ce\u0095\u00ce\u00bb\u00ce\u00bb\u00ce\u00b7\u00ce\u00bd\u00ce\u00b9\u00ce\u00ba\u00ce\u00ac", fixed: "\u0395\u03bb\u03bb\u03b7\u03bd\u03b9\u03ba\u03ac", expect: "pass" },
    { label: "Hebrew", original: "\u00d7\u00a2\u00d7\u0091\u00d7\u00a8\u00d7\u0099\u00d7\u00aa", fixed: "\u05e2\u05d1\u05e8\u05d9\u05ea", expect: "pass" },
    { label: "Thai", original: "à¸ à¸²à¸©à¸²à¹„à¸—à¸¢", fixed: "ภาษาไทย", expect: "pass" },
    { label: "Simplified Chinese", original: "\u00e7\u00ae\u0080\u00e4\u00bd\u0093\u00e4\u00b8\u00ad\u00e6\u2013\u2021", fixed: "\u7b80\u4f53\u4e2d\u6587", expect: "pass" },
    { label: "Japanese", original: "\u00e6\u2014\u00a5\u00e6\u0153\u00ac\u00e8\u00aa\u017e", fixed: "\u65e5\u672c\u8a9e", expect: "pass" },
    { label: "Korean", original: "\u00ed\u0095\u0153\u00ea\u00b5\u00ad\u00ec\u0096\u00b4", fixed: "\ud55c\uad6d\uc5b4", expect: "pass" },
    { label: "Czech via CP437", original: "\u2500\u00eee\u253c\u00edtina", fixed: "\u010ce\u0161tina", expect: "pass" }
  ];
  for (const c of cases) testCase(c);
});
