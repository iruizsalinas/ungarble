import { highCodepointRepairGroup, hasLatinText, hasUnsupportedHighCodepointRepair, hasCyrillicText, hasCyrillicMojibakeSourceSignal } from "./scripts.js";
import { hasC1ByteChar } from "./characters.js";

export function hasHebrewMixedWithOtherHighScript(text: string): boolean {
  let hasHebrew = false;
  let hasOther = false;

  for (const char of text) {
    const cp = char.codePointAt(0);
    if (cp === undefined) continue;
    const group = highCodepointRepairGroup(cp);
    if (group === "hebrew") hasHebrew = true;
    else if (group !== null && group !== "emoji") hasOther = true;
  }

  return hasHebrew && hasOther;
}

export function hasMixedHighScriptWithLatinText(text: string): boolean {
  const groups = new Set<string>();
  for (const char of text) {
    const cp = char.codePointAt(0);
    if (cp === undefined) continue;
    const group = highCodepointRepairGroup(cp);
    if (group !== null && group !== "emoji") groups.add(group);
  }
  return groups.size > 1 && hasLatinText(text);
}

export function hasDevanagariCjkRepairFromSeparatedSource(text: string, decoded: string): boolean {
  let hasDevanagari = false;
  let hasCjk = false;

  for (const char of decoded) {
    const cp = char.codePointAt(0);
    if (cp === undefined) continue;
    const group = highCodepointRepairGroup(cp);
    if (group === "devanagari") hasDevanagari = true;
    if (group === "cjk") hasCjk = true;
  }

  return hasDevanagari && hasCjk && /\s/u.test(text);
}

export function hasSingleHighScriptCharWithWordText(text: string): boolean {
  let highCount = 0;
  let hasWordText = false;

  for (const char of text) {
    const cp = char.codePointAt(0);
    if (cp === undefined) continue;

    const group = highCodepointRepairGroup(cp);
    if (group !== null && group !== "emoji") {
      highCount++;
    } else if (/[\p{L}\p{N}]/u.test(char)) {
      hasWordText = true;
    }
  }

  return highCount === 1 && hasWordText;
}

export function hasUnsupportedNonLatinMojibakeRepair(text: string, decoded: string): boolean {
  return !hasC1ByteChar(text) && (
    hasUnsupportedHighCodepointRepair(decoded) ||
    (hasCyrillicText(decoded) && !hasCyrillicMojibakeSourceSignal(text)) ||
    hasHebrewMixedWithOtherHighScript(decoded) ||
    hasMixedHighScriptWithLatinText(decoded) ||
    hasDevanagariCjkRepairFromSeparatedSource(text, decoded) ||
    hasSingleHighScriptCharWithWordText(decoded)
  );
}
