import { checkBoundaryBudget, lastIndexOfFrom } from "./budget.js";

export function readTerminalEscapeEnd(text: string, start: number, limit: number): number | null {
  if (text[start] !== "\x1b" || start + 1 >= text.length) return null;

  const kind = text[start + 1];
  if (kind === "[") {
    for (let i = start + 2; i < text.length; i++) {
      checkBoundaryBudget(i + 1, limit);
      const code = text.charCodeAt(i);
      if (code >= 0x40 && code <= 0x7e) {
        const end = i + 1;
        return text[end] === "\x02" ? end + 1 : end;
      }
    }
  } else if (kind === "]") {
    for (let i = start + 2; i < text.length; i++) {
      checkBoundaryBudget(i + 1, limit);
      if (text.charCodeAt(i) === 0x07) {
        const end = i + 1;
        return text[end] === "\x02" ? end + 1 : end;
      }
      if (text[i] === "\x1b" && text[i + 1] === "\\") {
        const end = i + 2;
        return text[end] === "\x02" ? end + 1 : end;
      }
      if (text[i] === "\x1b") return null;
    }
  }

  return null;
}

export function extendTerminalEscapeBoundary(text: string, pos: number, end: number, limit: number): number {
  let escIndex = lastIndexOfFrom(text, "\x1b", end - 1, pos);
  if (escIndex < pos && text[end - 1] === "\x01" && text[end] === "\x1b") {
    escIndex = end;
  }
  if (escIndex < pos) return end;

  const escapeEnd = readTerminalEscapeEnd(text, escIndex, limit);
  if (escapeEnd !== null && escapeEnd > end) return escapeEnd;
  return end;
}
