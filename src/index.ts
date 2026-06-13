import { fixEncoding, fixEncodingAndExplain, type ExplanationStep, type FixResult } from "./fix-encoding.js";
import { normalizedMaxDecodeLength, safeChunkEnd } from "./chunking.js";
import {
  unescapeHtml, removeTerminalEscapes, uncurlQuotes,
  fixLatinLigatures, fixCharacterWidth, fixLineBreaks,
  fixSurrogates, removeControlChars, fixC1Controls,
} from "./fixes.js";
import { HTML_ENTITY_RE, UTF8_DETECTOR_RE } from "./chardata.js";
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

function recordApplyStep(
  steps: ExplanationStep[] | undefined,
  detail: string,
  before: string,
  after: string,
): void {
  if (steps && after !== before) {
    steps.push({ action: "apply", detail });
  }
}

function applyAndRecord(
  current: string,
  steps: ExplanationStep[] | undefined,
  detail: string,
  fix: (text: string) => string,
): string {
  const fixed = fix(current);
  recordApplyStep(steps, detail, current, fixed);
  return fixed;
}

function hasHtmlEntity(text: string): boolean {
  HTML_ENTITY_RE.lastIndex = 0;
  return HTML_ENTITY_RE.test(text);
}

function hasUtf8MojibakeSequence(text: string): boolean {
  UTF8_DETECTOR_RE.lastIndex = 0;
  return UTF8_DETECTOR_RE.test(text);
}

function needsAnotherPipelinePass(
  current: string,
  config: Required<UngarbleConfig>,
  shouldHtml: boolean,
): boolean {
  return shouldHtml && config.html !== false && hasHtmlEntity(current);
}

function applyFixPipeline(
  text: string,
  config: Required<UngarbleConfig>,
  steps?: ExplanationStep[],
): string {
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
      current = applyAndRecord(current, steps, "html", unescapeHtml);
    }

    if (config.escapes) {
      current = applyAndRecord(current, steps, "terminal_escapes", removeTerminalEscapes);
    }

    if (config.encoding) {
      if (steps) {
        const result = fixEncodingAndExplain(current);
        current = result.text;
        steps.push(...result.steps);
      } else {
        current = fixEncoding(current);
      }
    }

    if (config.c1) {
      current = applyAndRecord(current, steps, "fix_c1_controls", fixC1Controls);
    }

    if (config.ligatures) {
      current = applyAndRecord(current, steps, "ligatures", fixLatinLigatures);
    }

    if (config.width) {
      current = applyAndRecord(current, steps, "width", fixCharacterWidth);
    }

    if (config.quotes) {
      current = applyAndRecord(current, steps, "quotes", uncurlQuotes);
    }

    if (config.lines) {
      current = applyAndRecord(current, steps, "line_breaks", fixLineBreaks);
    }

    if (config.surrogates) {
      current = applyAndRecord(current, steps, "surrogates", fixSurrogates);
    }

    if (config.escapes) {
      current = applyAndRecord(current, steps, "terminal_escapes", removeTerminalEscapes);
    }

    if (config.controls) {
      current = applyAndRecord(current, steps, "controls", removeControlChars);
    }

    if (config.normalization && typeof config.normalization === "string") {
      const before = current;
      try {
        current = current.normalize(config.normalization);
        recordApplyStep(steps, "normalization", before, current);
      }
      catch { /* invalid normalization form, skip */ }
    }

    if (current === prev) break;
    if (!needsAnotherPipelinePass(current, config, shouldHtml)) break;
  }

  return current;
}

function needsAnotherChunkPass(text: string, config: Required<UngarbleConfig>): boolean {
  if (config.html === true) {
    if (hasHtmlEntity(text)) return true;
  }
  if (config.escapes && text.includes("\x1b")) return true;
  return config.encoding && (isBad(text) || hasUtf8MojibakeSequence(text));
}

function fixTextSegment(
  text: string,
  config: Required<UngarbleConfig>,
  steps?: ExplanationStep[],
): string {
  const maxLen = normalizedMaxDecodeLength(config.maxDecodeLength, DEFAULT_CONFIG.maxDecodeLength);
  if (text.length <= maxLen) {
    return applyFixPipeline(text, config, steps);
  }

  let current = text;
  for (let iteration = 0; iteration < 20; iteration++) {
    const chunks: string[] = [];
    let pos = 0;
    while (pos < current.length) {
      const end = safeChunkEnd(current, pos, maxLen, config);
      chunks.push(applyFixPipeline(current.slice(pos, end), config, steps));
      pos = end;
    }

    const fixed = chunks.join("");
    if (fixed === current) break;
    current = fixed;

    if (!needsAnotherChunkPass(current, config)) break;

    if (current.length <= maxLen) {
      return applyFixPipeline(current, config, steps);
    }
  }

  return current;
}

function _ungarble(text: string, options?: UngarbleConfig, steps?: ExplanationStep[]): string {
  const config = { ...DEFAULT_CONFIG, ...options };

  if (config.html === "auto") {
    config.html = !text.includes("<");
  }

  let normalized = text;
  if (config.lines) {
    normalized = fixLineBreaks(normalized);
    recordApplyStep(steps, "line_breaks", text, normalized);
  }

  const lines = normalized.split("\n");
  const segmentConfig = { ...config, lines: false, surrogates: false };
  let fixed = lines.map((line) => fixTextSegment(line, segmentConfig, steps)).join("\n");

  if (config.surrogates) {
    const before = fixed;
    fixed = fixSurrogates(fixed);
    recordApplyStep(steps, "surrogates", before, fixed);
  }

  return fixed;
}

function _explain(text: string, options?: UngarbleConfig): FixResult {
  const steps: ExplanationStep[] = [];
  const current = _ungarble(text, options, steps);
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
