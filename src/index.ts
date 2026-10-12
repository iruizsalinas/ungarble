import { type UngarbleConfig } from "./config.js";
import { type FixResult } from "./types.js";
import { unescapeHtml } from "./transforms/html.js";
import { uncurlQuotes, fixLatinLigatures, fixCharacterWidth } from "./transforms/characters.js";
import { fixLineBreaks, fixSurrogates, removeControlChars } from "./transforms/unicode.js";
import { removeTerminalEscapes } from "./transforms/escapes.js";
import { fixC1Controls } from "./transforms/c1.js";
import { _ungarble, _explain } from "./pipeline/text.js";
import { fixEncoding } from "./encoding/repair.js";
import { isBad, badness } from "./detection/badness.js";

type UngarbleFn = {
  (text: string, options?: UngarbleConfig): string;
  explain: (text: string, options?: UngarbleConfig) => FixResult;
  encoding: (text: string) => string;
  detect: (text: string) => boolean;
  score: (text: string) => number;
  html: typeof unescapeHtml;
  quotes: typeof uncurlQuotes;
  ligatures: typeof fixLatinLigatures;
  width: typeof fixCharacterWidth;
  lines: typeof fixLineBreaks;
  surrogates: typeof fixSurrogates;
  escapes: typeof removeTerminalEscapes;
  controls: typeof removeControlChars;
  c1: typeof fixC1Controls;
};

export const ungarble: UngarbleFn = Object.assign(_ungarble, {
  explain: _explain,
  encoding: fixEncoding,
  detect: isBad,
  score: badness,
  html: unescapeHtml,
  quotes: uncurlQuotes,
  ligatures: fixLatinLigatures,
  width: fixCharacterWidth,
  lines: fixLineBreaks,
  surrogates: fixSurrogates,
  escapes: removeTerminalEscapes,
  controls: removeControlChars,
  c1: fixC1Controls,
});

export type { UngarbleConfig } from "./config.js";
export type { ExplanationStep, FixResult } from "./types.js";
