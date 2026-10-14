import { withEach } from "./each.mjs";
const suites = [];
export function describe(name, fn) {
  suites.push(name);
  try { fn(); } finally { suites.pop(); }
}
export const it = withEach((name, fn) => Deno.test([...suites, name].join(" > "), fn));
export { expect, expectTypeOf } from "./expect.mjs";
