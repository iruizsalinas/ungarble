// Preserve Vitest's table argument expansion, including useful failure labels.
export function withEach(test) {
  return Object.assign(test, {
    each: cases => (name, fn) => cases.forEach((row, index) => {
      const args = Array.isArray(row) ? row : [row];
      const label = `${name} [${index}: ${JSON.stringify(row).slice(0, 160)}]`;
      test(label, () => fn(...args));
    }),
  });
}
