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
  chunk?: number;
  limit?: number;
}

export const DEFAULT_CONFIG: Readonly<Required<UngarbleConfig>> = Object.freeze({
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
  chunk: 1_000_000,
  limit: Infinity,
});
