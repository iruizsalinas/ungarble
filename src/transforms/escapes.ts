export const CSI_TERMINAL_ESCAPE_RE = /\x01?\x1b\[[\x30-\x3f]*[\x20-\x2f]*[\x40-\x7e]\x02?/g;

export const OSC_TERMINAL_ESCAPE_RE = /\x01?\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)\x02?/g;

export function removeTerminalEscapes(text: string): string {
  return text
    .replace(OSC_TERMINAL_ESCAPE_RE, "")
    .replace(CSI_TERMINAL_ESCAPE_RE, "");
}
