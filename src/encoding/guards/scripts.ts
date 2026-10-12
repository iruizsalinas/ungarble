export function hasConfidentDecodedScript(text: string): boolean {
  for (const char of text) {
    const cp = char.codePointAt(0);
    if (cp === undefined) continue;
    const group = highCodepointRepairGroup(cp);
    if (
      group === "hebrew" ||
      group === "arabic" ||
      group === "devanagari" ||
      group === "tamil" ||
      group === "thai" ||
      group === "kana" ||
      group === "cjk" ||
      group === "hangul" ||
      group === "emoji"
    ) {
      return true;
    }
  }
  return false;
}

export function highCodepointRepairGroup(cp: number): string | null {
  if (cp <= 0x052f) return null;
  if (cp >= 0x1e00 && cp <= 0x1eff) return null;
  if (cp >= 0x2000 && cp <= 0x28ff) return null;
  // These are valid repair targets handled by later pipeline stages or preserved
  // as explicit evidence of lossy decoding.
  if (
    cp === 0xfeff ||
    cp === 0xfffd ||
    (cp >= 0xfb00 && cp <= 0xfb06) ||
    (cp >= 0xff00 && cp <= 0xffef)
  ) return null;
  if (cp >= 0x0590 && cp <= 0x05ff) return "hebrew";
  if (cp >= 0x0600 && cp <= 0x06ff) return "arabic";
  if (cp >= 0x0900 && cp <= 0x097f) return "devanagari";
  if (cp >= 0x0b80 && cp <= 0x0bff) return "tamil";
  if (cp >= 0x0e00 && cp <= 0x0e7f) return "thai";
  if (cp >= 0x3040 && cp <= 0x30ff) return "kana";
  if (cp >= 0x4e00 && cp <= 0x9fff) return "cjk";
  if (cp >= 0xac00 && cp <= 0xd7af) return "hangul";
  if (cp >= 0x1f000 && cp <= 0x1faff) return "emoji";
  return "other";
}

export function hasUnsupportedHighCodepointRepair(text: string): boolean {
  for (const char of text) {
    const cp = char.codePointAt(0);
    if (cp !== undefined && highCodepointRepairGroup(cp) === "other") {
      return true;
    }
  }
  return false;
}

export function hasCyrillicText(text: string): boolean {
  for (const char of text) {
    const cp = char.codePointAt(0);
    if (cp !== undefined && cp >= 0x0400 && cp <= 0x052f) return true;
  }
  return false;
}

export function hasCyrillicMojibakeSourceSignal(text: string): boolean {
  return /[\u00d0-\u00d3\u0412\u0413\u0420\u0421\u0432\u0402\u2568\u2564]/u.test(text);
}

export function hasLatinText(text: string): boolean {
  for (const char of text) {
    const cp = char.codePointAt(0);
    if (cp === undefined) continue;
    if (
      (cp >= 0x41 && cp <= 0x5a) ||
      (cp >= 0x61 && cp <= 0x7a) ||
      (cp >= 0x00c0 && cp <= 0x024f) ||
      (cp >= 0x1e00 && cp <= 0x1eff)
    ) {
      return true;
    }
  }
  return false;
}
