import { describe, expect, it } from "vitest";
import { unescapeHtml } from "../../../src/transforms/html.js";
import { ungarble } from "../../../src/index.js";

describe("entity decoding boundaries", () => {
  it.each([
    ["&#0;", ""], ["&#x80;", "\u20ac"], ["&#1114111;", "\u{10ffff}"],
    ["&#1114112;", "\ufffd"], ["&#xFFFFFFFFFFFFFFFFFFFF;", "\ufffd"],
    ["&#-1;", "&#-1;"], ["&#x;", "&#x;"], ["&#xGG;", "&#xGG;"],
    ["&constructor;", "&constructor;"], ["&__proto__;", "&__proto__;"],
    ["&unknown;", "&unknown;"], ["&amp", "&amp"], ["&AMP;", "&"],
  ])("decodes %s safely", (input, expected) => {
    expect(unescapeHtml(input)).toBe(expected);
  });

  it("decodes the complete HTML 4 entity set with HTML5 values", () => {
    expect(unescapeHtml("&sigmaf;&rArr;&infin;&ne;&sum;&radic;&there4;&lang;&rang;"))
      .toBe("\u03c2\u21d2\u221e\u2260\u2211\u221a\u2234\u27e8\u27e9");
    expect(unescapeHtml("a&ensp;b&emsp;c&thinsp;d&zwnj;e&zwj;f&lrm;g&rlm;"))
      .toBe("a\u2002b\u2003c\u2009d\u200ce\u200df\u200eg\u200f");
    expect(unescapeHtml("&harr; &HARR; &hArr;")).toBe("\u2194 \u2194 \u21d4");
  });

  it("decodes a chain of escaped ampersands in one call", () => {
    expect(unescapeHtml("&amp;amp;lt;")).toBe("<");
    expect(unescapeHtml("&AMP;#38;#x26;#X0026;gt;")).toBe(">");
    expect(unescapeHtml("&amp;&lt; &amp;foo; &amp;amp &amp;")).toBe("&< &foo; &amp &");
    expect(unescapeHtml("x&amp;" + "amp;".repeat(5000) + "quot;y")).toBe("x\"y");
    // Only "&" continues a chain; other values never join the following text.
    expect(unescapeHtml("&#108;t; &amp&#59;")).toBe("lt; &amp;");
  });

  it("decodes surrogate references to U+FFFD like HTML5", () => {
    expect(unescapeHtml("&#55296;")).toBe("\ufffd");
    expect(unescapeHtml("&#xD83D;&#xDE00;")).toBe("\ufffd\ufffd");
    expect(unescapeHtml("&#xDFFF;&#xE000;")).toBe("\ufffd\ue000");
    expect(ungarble("&#55296;")).toBe("\ufffd");
    expect(ungarble("&#55296;", { surrogates: false })).toBe("\ufffd");
    expect(() => encodeURIComponent(ungarble.html("a&#xD800;b"))).not.toThrow();
  });

  it("uses one HTML-auto decision for the entire original input", () => {
    expect(ungarble("<tag>\n&amp;", { chunk: 1 })).toBe("<tag>\n&amp;");
    expect(ungarble("<tag>\n&amp;", { html: true, chunk: 1 })).toBe("<tag>\n&");
    expect(ungarble("&lt;tag&gt; &amp;", { html: false })).toBe("&lt;tag&gt; &amp;");
  });
});
