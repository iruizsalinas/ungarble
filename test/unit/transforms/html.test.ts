import { describe, expect, it } from "vitest";
import { unescapeHtml } from "../../../src/transforms/html.js";
import { ungarble } from "../../../src/index.js";

describe("entity decoding boundaries", () => {
  it.each([
    ["&#0;", ""], ["&#x80;", "€"], ["&#1114111;", "\u{10ffff}"],
    ["&#1114112;", "\ufffd"], ["&#xFFFFFFFFFFFFFFFFFFFF;", "\ufffd"],
    ["&#-1;", "&#-1;"], ["&#x;", "&#x;"], ["&#xGG;", "&#xGG;"],
    ["&constructor;", "&constructor;"], ["&__proto__;", "&__proto__;"],
    ["&unknown;", "&unknown;"], ["&amp", "&amp"], ["&AMP;", "&"],
  ])("decodes %s safely", (input, expected) => {
    expect(unescapeHtml(input)).toBe(expected);
  });

  it("leaves surrogate cleanup to the pipeline", () => {
    expect(unescapeHtml("&#55296;")).toBe("\ud800");
    expect(ungarble("&#55296;")).toBe("\ufffd");
    expect(ungarble("&#55296;", { surrogates: false })).toBe("\ud800");
  });

  it("uses one HTML-auto decision for the entire original input", () => {
    expect(ungarble("<tag>\n&amp;", { chunk: 1 })).toBe("<tag>\n&amp;");
    expect(ungarble("<tag>\n&amp;", { html: true, chunk: 1 })).toBe("<tag>\n&");
    expect(ungarble("&lt;tag&gt; &amp;", { html: false })).toBe("&lt;tag&gt; &amp;");
  });
});
