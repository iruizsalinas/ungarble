import { describe, it, expect } from "vitest";
import { ungarble } from "../src/index.js";

describe("HTML entity handling", () => {
  it("unescapes &amp; in non-HTML context", () => {
    expect(ungarble("&amp;")).toBe("&");
  });

  it("does not unescape in HTML context (auto mode)", () => {
    // When '<' appears anywhere in the text, auto mode disables entity unescaping
    expect(ungarble("&amp;\n<html>\n&amp;")).toBe("&amp;\n<html>\n&amp;");
  });

  it("unescapes named entities", () => {
    expect(ungarble.html("caf&eacute;")).toBe("café");
  });

  it("unescapes numeric entities", () => {
    expect(ungarble.html("ellipsis&#133;")).toBe("ellipsis…");
  });

  it("unescapes hex entities", () => {
    expect(ungarble.html("ellipsis&#x85;")).toBe("ellipsis…");
  });

  it("unescapes Polish entity", () => {
    expect(ungarble.html("jednocze&sacute;nie")).toBe("jednocześnie");
  });

  it("unescapes uppercase entity", () => {
    expect(ungarble.html("JEDNOCZE&SACUTE;NIE")).toBe("JEDNOCZEŚNIE");
  });

  it("handles &lt;&gt;", () => {
    expect(ungarble.html("&lt;&gt;")).toBe("<>");
  });

  it("handles triple amp", () => {
    expect(ungarble("&amp;amp;amp;")).toBe("&");
  });

  it("handles euro numeric entity", () => {
    expect(ungarble.html("euro &#x80;")).toBe("euro €");
  });

  it("leaves unknown entities alone", () => {
    expect(ungarble.html("not an entity &#20x6;")).toBe("not an entity &#20x6;");
  });

  it("handles invalid high codepoint", () => {
    expect(ungarble.html("&#xffffffff;")).toBe("\ufffd");
  });

  it("unescapes &EURO;", () => {
    expect(ungarble.html("EURO &EURO;")).toBe("EURO €");
  });

  it("handles Czech VŠICHNI", () => {
    expect(ungarble.html("V&SCARON;ICHNI")).toBe("VŠICHNI");
  });

  it("auto mode unescapes &lt;&gt; when no HTML tags present", () => {
    expect(ungarble("&lt;&gt;")).toBe("<>");
  });

  it("preserves entities when configured off", () => {
    expect(ungarble("&amp;", { html: false })).toBe("&amp;");
  });

  it("handles mojibake + entity combo: 10μs", () => {
    expect(ungarble("10Î&frac14;s")).toBe("10μs");
  });
});
