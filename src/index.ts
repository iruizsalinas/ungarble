import { fixEncoding, fixEncodingAndExplain, type ExplanationStep, type FixResult } from "./fix-encoding.js";
import {
  unescapeHtml, removeTerminalEscapes, uncurlQuotes,
  fixLatinLigatures, fixCharacterWidth, fixLineBreaks,
  fixSurrogates, removeControlChars, fixC1Controls,
} from "./fixes.js";
import { isBad, badness } from "./badness.js";

export interface UngarbleConfig {
  encoding?: boolean;
  normalization?: "NFC" | "NFD" | "NFKC" | "NFKD" | false;
  html?: boolean | "auto";
  width?: boolean;
  quotes?: boolean;
  ligatures?: boolean;
  lines?: boolean;
  surrogates?: boolean;
  escapes?: boolean;
  controls?: boolean;
  c1?: boolean;
  maxDecodeLength?: number;
}

const DEFAULT_CONFIG: Required<UngarbleConfig> = {
  encoding: true,
  normalization: "NFC",
  html: "auto",
  width: false,
  quotes: false,
  ligatures: false,
  lines: true,
  surrogates: true,
  escapes: true,
  controls: true,
  c1: true,
  maxDecodeLength: 1_000_000,
};

function applyFixPipeline(text: string, config: Required<UngarbleConfig>): string {
  let current = text;

  let shouldHtml = false;
  if (config.html === true) {
    shouldHtml = true;
  } else if (config.html === "auto") {
    shouldHtml = !current.includes("<");
  }

  for (let iteration = 0; iteration < 20; iteration++) {
    const prev = current;

    if (shouldHtml) {
      current = unescapeHtml(current);
    }

    if (config.encoding) {
      current = fixEncoding(current);
    }

    if (config.c1) {
      current = fixC1Controls(current);
    }

    if (config.ligatures) {
      current = fixLatinLigatures(current);
    }

    if (config.width) {
      current = fixCharacterWidth(current);
    }

    if (config.quotes) {
      current = uncurlQuotes(current);
    }

    if (config.lines) {
      current = fixLineBreaks(current);
    }

    if (config.surrogates) {
      current = fixSurrogates(current);
    }

    if (config.escapes) {
      current = removeTerminalEscapes(current);
    }

    if (config.controls) {
      current = removeControlChars(current);
    }

    if (config.normalization && typeof config.normalization === "string") {
      try { current = current.normalize(config.normalization); }
      catch { /* invalid normalization form, skip */ }
    }

    if (current === prev) break;
  }

  return current;
}

function fixTextSegment(text: string, config: Required<UngarbleConfig>): string {
  const maxLen = Math.max(config.maxDecodeLength, 1);
  if (text.length <= maxLen) {
    return applyFixPipeline(text, config);
  }

  const chunks: string[] = [];
  let pos = 0;
  while (pos < text.length) {
    const end = Math.min(pos + maxLen, text.length);
    chunks.push(applyFixPipeline(text.slice(pos, end), config));
    pos = end;
  }
  return chunks.join("");
}

function _ungarble(text: string, options?: UngarbleConfig): string {
  const config = { ...DEFAULT_CONFIG, ...options };

  if (config.html === "auto") {
    config.html = !text.includes("<");
  }

  let normalized = text;
  if (config.lines) {
    normalized = fixLineBreaks(text);
  }

  const lines = normalized.split("\n");
  const segmentConfig = { ...config, lines: false };
  const fixed = lines.map((line) => fixTextSegment(line, segmentConfig));
  return fixed.join("\n");
}

function _explain(text: string, options?: UngarbleConfig): FixResult {
  const config = { ...DEFAULT_CONFIG, ...options };
  const steps: ExplanationStep[] = [];

  let current = text;

  if (config.encoding) {
    const result = fixEncodingAndExplain(current);
    current = result.text;
    steps.push(...result.steps);
  }

  const afterFixes = _ungarble(current, { ...options, encoding: false });
  if (afterFixes !== current) {
    steps.push({ action: "apply", detail: "text_fixes" });
    current = afterFixes;
  }

  return { text: current, steps };
}

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

export type { ExplanationStep, FixResult };
