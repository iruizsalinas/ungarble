export const C1_CONTROL_RE = /[\x80-\x9f]/g;

export const ALTERED_UTF8_RE = /[\xc2\xc3\xc5\xce\xd0\xd9] /g;

// A-grave word pattern: C3 + space at word boundary, used for French/Portuguese.
export const A_GRAVE_WORD_RE = /\xc3 (?=(?:la |les |s'|qu|l'|d'|une? |cette |celui |celle |n'|qu'|jusqu'|lorsqu'|puisqu'|quoiqu'|quelqu'|aujourd'|entr'|presqu'|àquele|àquela|àquilo|às )|\S)/gi;

// UTF-8 sequences where at least one continuation byte was replaced by SUB
// (0x1A) or "?". Preserve the sequence width so a missing middle byte followed
// by valid continuation bytes is recognized as well. Any other SUB byte is a
// replacement character that the sloppy codecs encoded on its own: like ftfy,
// restore U+FFFD instead of a control character that cleanup would delete.
export const LOSSY_UTF8_RE = /[\xc2-\xdf][\x1a?]|[\xe0-\xef](?:[\x1a?][\x1a?\x80-\xbf]|[\x80-\xbf][\x1a?])|[\xf0-\xf4](?:[\x1a?][\x1a?\x80-\xbf][\x1a?\x80-\xbf]|[\x80-\xbf][\x1a?][\x1a?\x80-\xbf]|[\x80-\xbf]{2}[\x1a?])|\x1a/g;

export const CONTROL_CHAR_RE = /[\x00-\x08\x0b\x0e-\x1f\x7f\u206a-\u206f\ufeff\ufff9-\ufffc]/g;
