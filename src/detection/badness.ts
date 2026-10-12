import { badnessPatterns, contextRules } from "./badness-patterns.js";

const source = badnessPatterns.join("|");
const BADNESS_RE = new RegExp(source, "gu");
const BADNESS_TEST_RE = new RegExp(
  existenceSource(badnessPatterns.map((rule) => contextRules.get(rule) ?? rule)),
  "u",
);

export function badness(text: string): number {
  let count = 0;
  // matchAll owns its cursor; recursive or interleaved calls share no state.
  for (const _match of text.matchAll(BADNESS_RE)) count++;
  return count;
}

export function isBad(text: string): boolean {
  return BADNESS_TEST_RE.test(text);
}

/**
 * Some engines, such as JavaScriptCore, try every alternative at every
 * position. When each rule starts with a known non-ASCII class, a lookahead
 * on their union rejects most positions with one class test. Every match
 * starts with such a character, so the lookahead never changes the result.
 */
export function existenceSource(rules: readonly string[]): string {
  const leads = rules.map(leadClassBody);
  if (leads.some((lead) => lead === null)) return rules.join("|");
  return `(?=[${leads.join("")}])(?:${rules.join("|")})`;
}

/**
 * The class body for the first character a rule consumes, after lookbehinds,
 * an anchor and group openers; null when it is not a plain non-ASCII class.
 */
export function leadClassBody(rule: string): string | null {
  let i = 0;
  for (;;) {
    if (rule.startsWith("(?<=", i) || rule.startsWith("(?<!", i)) {
      i = groupEnd(rule, i);
      if (i === -1) return null;
    } else if (rule.startsWith("(?:", i)) {
      i += 3;
    } else if (rule[i] === "^") {
      i++;
    } else {
      break;
    }
  }
  if (rule[i] === "[") {
    const end = classEnd(rule, i);
    const body = end === -1 ? "" : rule.slice(i + 1, end);
    // Concatenated bodies must not form new ranges, negations or escapes.
    if (body === "" || /^[\^-]|-$|[\\]|[\x00-\x7f]/.test(body.replace(/(?<=.)-(?=.)/gu, ""))) return null;
    return body;
  }
  const cp = rule.codePointAt(i);
  return cp === undefined || cp < 0x80 ? null : String.fromCodePoint(cp);
}

function classEnd(rule: string, start: number): number {
  for (let i = start + 1; i < rule.length; i++) {
    if (rule[i] === "\\") i++;
    else if (rule[i] === "]") return i;
  }
  return -1;
}

function groupEnd(rule: string, start: number): number {
  let depth = 0;
  for (let i = start; i < rule.length; i++) {
    if (rule[i] === "\\") {
      i++;
    } else if (rule[i] === "[") {
      i = classEnd(rule, i);
      if (i === -1) return -1;
    } else if (rule[i] === "(") {
      depth++;
    } else if (rule[i] === ")" && --depth === 0) {
      return i + 1;
    }
  }
  return -1;
}
