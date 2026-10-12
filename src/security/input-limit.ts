import { ERROR_MESSAGES } from "./error-messages.js";

export function enforceInputLimit(text: string, limit: unknown): void {
  if (limit === undefined) return;
  if (typeof limit !== "number") {
    throw new TypeError(ERROR_MESSAGES.limitType);
  }
  if (limit === Infinity) return;
  if (!Number.isFinite(limit) || limit < 0) {
    throw new RangeError(ERROR_MESSAGES.limitRange);
  }

  const normalizedLimit = Math.floor(limit);
  if (text.length > normalizedLimit) {
    throw new RangeError(ERROR_MESSAGES.inputLength(text.length, normalizedLimit));
  }
}
