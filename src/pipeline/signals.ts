import { HTML_ENTITY_RE } from "../transforms/data/entities.js";
import { hasUtf8MojibakeSequence } from "../detection/utf8-pattern.js";
import { type UngarbleConfig } from "../config.js";
import { isBad } from "../detection/badness.js";

export function hasHtmlEntity(text: string): boolean {
  HTML_ENTITY_RE.lastIndex = 0;
  return HTML_ENTITY_RE.test(text);
}

export function needsAnotherPipelinePass(
  current: string,
  config: Required<UngarbleConfig>,
  shouldHtml: boolean,
): boolean {
  return shouldHtml && config.html !== false && hasHtmlEntity(current);
}

export function needsAnotherChunkPass(text: string, config: Required<UngarbleConfig>): boolean {
  if (config.html === true) {
    if (hasHtmlEntity(text)) return true;
  }
  if (config.escapes && text.includes("\x1b")) return true;
  return config.encoding && (isBad(text) || hasUtf8MojibakeSequence(text));
}
