import { MAX_BOUNDARY_LOOKAHEAD, MAX_REPAIR_DEPTH } from "./budgets.js";

// Sentence case, double-quoted option names, and final periods.
export const ERROR_MESSAGES = Object.freeze({
  limitType: 'Option "limit" must be a number.',
  limitRange: 'Option "limit" must be a non-negative finite number or Infinity.',
  inputLength: (length: number, limit: number): string =>
    `Input length ${length} exceeds the configured limit of ${limit} UTF-16 code units.`,
  chunkBoundary:
    `Chunk boundary exceeds the allowed lookahead of ${MAX_BOUNDARY_LOOKAHEAD} UTF-16 code units.`,
  recursion:
    `Encoding repair exceeds the recursion limit of ${MAX_REPAIR_DEPTH} nested calls.`,
});
