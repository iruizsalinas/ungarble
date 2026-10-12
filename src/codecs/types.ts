export type EncodingName =
  | "latin-1"
  | "sloppy-windows-1252"
  | "sloppy-windows-1251"
  | "sloppy-windows-1250"
  | "sloppy-windows-1253"
  | "sloppy-windows-1254"
  | "sloppy-windows-1257"
  | "iso-8859-2"
  | "macroman"
  | "cp437"
  | "windows-1252";

export interface CodecTable {
  decode: readonly number[];
  encode: Map<number, number>;
}
