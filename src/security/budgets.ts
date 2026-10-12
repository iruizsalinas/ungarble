// Shared, fixed ceilings keep every entry point subject to the same policy.
export const MAX_REPAIR_PASSES = 20;
export const MAX_REPAIR_DEPTH = 32;
export const MAX_BOUNDARY_LOOKAHEAD = 4096;
export const MAX_NORMALIZATION_MARKS = 256;

// Chunk, pipeline and encoding passes are nested, so their separate pass limits
// would multiply. Each pass instead charges the length it scans to one shared
// budget: the first pass of every loop always runs, and later passes start only
// while the total stays below this many scans of the input.
export const MAX_REPAIR_WORK_FACTOR = 16;
export const MIN_REPAIR_WORK = 1024;

export interface WorkBudget {
  remaining: number;
}

export function createWorkBudget(length: number): WorkBudget {
  return { remaining: MAX_REPAIR_WORK_FACTOR * length + MIN_REPAIR_WORK };
}

/** Charge one pass over `length` units; later passes need budget left. */
export function startPass(budget: WorkBudget, pass: number, length: number): boolean {
  if (pass > 0 && budget.remaining <= 0) return false;
  budget.remaining -= length;
  return true;
}
