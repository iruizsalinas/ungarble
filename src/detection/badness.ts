import { badnessPatterns } from "./badness-patterns.js";

const source = badnessPatterns.join("|");
const BADNESS_RE = new RegExp(source, "gu");
const BADNESS_TEST_RE = new RegExp(source, "u");

export function badness(text: string): number {
  let count = 0;
  // matchAll owns its cursor; recursive or interleaved calls share no state.
  for (const _match of text.matchAll(BADNESS_RE)) count++;
  return count;
}

export function isBad(text: string): boolean {
  return BADNESS_TEST_RE.test(text);
}
