import { type EncodingName } from "../codecs/types.js";
import { encodeSingleByte } from "../codecs/single-byte.js";
import { restoreByteA0 } from "./bytes/restore-spaces.js";
import { replaceLossySequences } from "./bytes/lossy.js";
import { bytesContain, decodeUtf8 } from "../codecs/utf8.js";
import { decodeUtf8Variants } from "../codecs/utf8-variants.js";
import { CHARMAP_ENCODINGS, possibleEncoding } from "../detection/encodings.js";
import { startsWithAmbiguousSingleNonLatinMojibake, containsAmbiguousSingleNonLatinMojibakeReplacement } from "./guards/ambiguity.js";
import { hasUnsupportedNonLatinMojibakeRepair } from "./guards/mixed-scripts.js";

export function isSloppy(encoding: EncodingName): boolean {
  return encoding.startsWith("sloppy-");
}

export function decodeCandidate(text: string, encoding: EncodingName): { text: string; variants: boolean } | null {
  const encoded = encodeSingleByte(text, encoding);
  if (!encoded) return null;

  let bytes = restoreByteA0(encoded);
  if (isSloppy(encoding)) {
    bytes = replaceLossySequences(bytes);
  }

  const variants = bytesContain(bytes, 0xed) || bytesContain(bytes, 0xc0);
  const decoded = variants ? decodeUtf8Variants(bytes) : decodeUtf8(bytes);
  if (decoded === null) return null;

  return { text: decoded, variants };
}

export function decodeDetectorMatch(text: string): string {
  for (const encoding of CHARMAP_ENCODINGS) {
    if (!possibleEncoding(text, encoding)) continue;
    const candidate = decodeCandidate(text, encoding);
    if (!candidate) continue;
    if (
      startsWithAmbiguousSingleNonLatinMojibake(text, candidate.text) ||
      containsAmbiguousSingleNonLatinMojibakeReplacement(text, candidate.text) ||
      hasUnsupportedNonLatinMojibakeRepair(text, candidate.text)
    ) {
      continue;
    }
    return candidate.text;
  }
  return text;
}
