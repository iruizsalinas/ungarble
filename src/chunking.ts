import { isUtf8MojibakeByteChar, utf8MojibakeSequenceLengthAt } from "./chardata.js";

export interface ChunkingConfig {
  encoding: boolean;
  html: boolean | "auto";
  escapes: boolean;
}

const HTML_ENTITY_FRAGMENT_RE = /^&#?[0-9A-Za-z]{0,24}$/;
const HTML_ENTITY_COMPLETE_RE = /^&#?[0-9A-Za-z]{1,24};$/;
const HTML_NUMERIC_TAIL_RE = /^#[0-9A-Za-z]{1,23};$/;
const TOKEN_BOUNDARY_RE = /[\s"'`()[\]{}<>&|\\/:;!?]/u;

export function normalizedMaxDecodeLength(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(Math.floor(value), 1);
}

function readHtmlEntityEnd(text: string, start: number): number | null {
  const semiIndex = text.indexOf(";", start);
  if (semiIndex === -1 || semiIndex - start > 25) return null;

  const entity = text.slice(start, semiIndex + 1);
  if (!HTML_ENTITY_COMPLETE_RE.test(entity)) return null;

  let end = semiIndex + 1;
  if (entity.toLowerCase() === "&amp;" && text[end] === "#") {
    const nestedSemi = text.indexOf(";", end);
    if (nestedSemi !== -1 && nestedSemi - end <= 24) {
      const nested = text.slice(end, nestedSemi + 1);
      if (HTML_NUMERIC_TAIL_RE.test(nested)) {
        end = nestedSemi + 1;
      }
    }
  }

  return end;
}

function extendHtmlEntityBoundary(text: string, pos: number, end: number): number {
  const entityAtStartEnd = readHtmlEntityEnd(text, pos);
  const ampIndex = text.lastIndexOf("&", end - 1);
  let adjusted = end;
  let endsWithEntity = false;

  if (ampIndex >= pos) {
    const beforeBoundary = text.slice(ampIndex, end);
    if (HTML_ENTITY_FRAGMENT_RE.test(beforeBoundary)) {
      const entityEnd = readHtmlEntityEnd(text, ampIndex);
      if (entityEnd !== null) {
        const previousAmp = text[ampIndex - 1] === ";"
          ? text.lastIndexOf("&", ampIndex - 2)
          : -1;
        if (
          previousAmp > pos &&
          readHtmlEntityEnd(text, previousAmp) === ampIndex &&
          entityAtStartEnd !== previousAmp
        ) {
          return previousAmp;
        }
        if (ampIndex > pos && entityAtStartEnd !== ampIndex) {
          return ampIndex;
        }
        adjusted = entityEnd;
        endsWithEntity = true;
      }
    }
  }

  if (!endsWithEntity) return adjusted;

  while (text[adjusted] === "&") {
    const next = readHtmlEntityEnd(text, adjusted);
    if (next === null) break;
    adjusted = next;
  }

  return adjusted;
}

function extendSurrogateBoundary(text: string, end: number): number {
  if (end <= 0 || end >= text.length) return end;
  const prev = text.charCodeAt(end - 1);
  const next = text.charCodeAt(end);
  if (prev >= 0xd800 && prev <= 0xdbff && next >= 0xdc00 && next <= 0xdfff) {
    return end + 1;
  }
  return end;
}

function extendMojibakeBoundary(text: string, pos: number, end: number): number {
  let adjusted = end;
  const start = Math.max(pos, adjusted - 3);
  for (let index = start; index < adjusted; index++) {
    const length = utf8MojibakeSequenceLengthAt(text, index);
    if (length > 0 && index + length > adjusted) {
      adjusted = index + length;
    }
  }
  return adjusted;
}

function hasRecentMojibakeSequence(text: string, pos: number, end: number): boolean {
  const start = Math.max(pos, end - 16);
  for (let index = start; index < end; index++) {
    if (utf8MojibakeSequenceLengthAt(text, index) > 0) return true;
  }
  return false;
}

function isTokenBoundary(text: string, index: number): boolean {
  if (index < 0 || index >= text.length) return true;
  const code = text.charCodeAt(index);
  return (
    code <= 0x20 ||
    code === 0x7f ||
    code === 0x2026 ||
    (code > 0x052f && !isUtf8MojibakeByteChar(text[index])) ||
    TOKEN_BOUNDARY_RE.test(text[index]!)
  );
}

function extendMojibakeTokenBoundary(text: string, pos: number, end: number): number {
  if (
    end >= text.length ||
    isTokenBoundary(text, end - 1) ||
    isTokenBoundary(text, end) ||
    !hasRecentMojibakeSequence(text, pos, end)
  ) {
    return end;
  }

  let adjusted = end;
  while (adjusted < text.length && !isTokenBoundary(text, adjusted)) {
    adjusted++;
  }
  return adjusted;
}

function readTerminalEscapeEnd(text: string, start: number): number | null {
  if (text[start] !== "\x1b" || start + 1 >= text.length) return null;

  const kind = text[start + 1];
  if (kind === "[") {
    for (let i = start + 2; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if (code >= 0x40 && code <= 0x7e) {
        const end = i + 1;
        return text[end] === "\x02" ? end + 1 : end;
      }
    }
  } else if (kind === "]") {
    for (let i = start + 2; i < text.length; i++) {
      if (text.charCodeAt(i) === 0x07) {
        const end = i + 1;
        return text[end] === "\x02" ? end + 1 : end;
      }
      if (text[i] === "\x1b" && text[i + 1] === "\\") {
        const end = i + 2;
        return text[end] === "\x02" ? end + 1 : end;
      }
    }
  }

  return null;
}

function extendTerminalEscapeBoundary(text: string, pos: number, end: number): number {
  let escIndex = text.lastIndexOf("\x1b", end - 1);
  if (escIndex < pos && text[end - 1] === "\x01" && text[end] === "\x1b") {
    escIndex = end;
  }
  if (escIndex < pos) return end;

  const escapeEnd = readTerminalEscapeEnd(text, escIndex);
  if (escapeEnd !== null && escapeEnd > end) return escapeEnd;
  return end;
}

export function safeChunkEnd(
  text: string,
  pos: number,
  maxLen: number,
  config: ChunkingConfig,
): number {
  let end = Math.min(pos + maxLen, text.length);

  // Extending for one boundary can expose another one just after it
  // (for example, adjacent HTML entities that decode to one UTF-8 sequence).
  for (let i = 0; i < 4 && end < text.length; i++) {
    const prev = end;
    end = extendSurrogateBoundary(text, end);
    if (config.escapes) {
      end = extendTerminalEscapeBoundary(text, pos, end);
    }
    if (config.html === true) {
      end = extendHtmlEntityBoundary(text, pos, end);
    }
    if (config.encoding) {
      end = extendMojibakeBoundary(text, pos, end);
      end = extendMojibakeTokenBoundary(text, pos, end);
    }
    end = Math.min(end, text.length);
    if (end === prev) break;
  }

  return Math.max(end, pos + 1);
}
