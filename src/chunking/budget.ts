import { ERROR_MESSAGES } from "../security/error-messages.js";

export function checkBoundaryBudget(end: number, limit: number): void {
  if (end > limit) throw new RangeError(ERROR_MESSAGES.chunkBoundary);
}

export function normalizedMaxDecodeLength(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(Math.floor(value), 1);
}

export function lastIndexOfFrom(text: string, search: string, from: number, min: number): number {
  for (let i = Math.min(from, text.length - 1); i >= min; i--) {
    if (text[i] === search) return i;
  }
  return -1;
}
