import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)]);
}
const source = files(join(root, "src")).filter(file => file.endsWith(".ts"));
const allowed: Record<string, string[]> = {
  codecs: ["codecs"], detection: ["detection", "codecs"],
  transforms: ["transforms", "detection", "codecs"], security: ["security"],
  chunking: ["chunking", "detection", "security"],
  encoding: ["encoding", "codecs", "detection", "transforms", "security", "types.ts"],
  pipeline: ["pipeline", "config.ts", "types.ts", "security", "encoding", "transforms", "detection", "chunking"],
  "config.ts": [], "types.ts": [],
};
const layer = (file: string) => relative(join(root, "src"), file).split(/[\\/]/)[0]!;

describe("module architecture", () => {
  it("keeps source and test files at or below 150 lines", () => {
    for (const file of [...source, ...files(join(root, "test"))].filter(f => /\.(ts|mjs)$/.test(f))) {
      expect(readFileSync(file, "utf8").trimEnd().split(/\r?\n/).length, relative(root, file))
        .toBeLessThanOrEqual(150);
    }
  });

  it("enforces dependency direction, no runtime dependencies, and no import cycles", () => {
    const graph = new Map<string, string[]>();
    for (const file of source) {
      const ast = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
      const edges: string[] = [];
      for (const node of ast.statements) {
        if (!ts.isImportDeclaration(node) && !ts.isExportDeclaration(node)) continue;
        if (!node.moduleSpecifier || !ts.isStringLiteral(node.moduleSpecifier)) continue;
        const specifier = node.moduleSpecifier.text;
        expect(specifier, file).toMatch(/^\.\.?\/.+\.js$/);
        const target = resolve(dirname(file), specifier.replace(/\.js$/, ".ts"));
        expect(source, file).toContain(target);
        if (layer(file) !== "index.ts") expect(allowed[layer(file)], file).toContain(layer(target));
        edges.push(target);
      }
      graph.set(file, edges);
    }
    const visited = new Set<string>();
    const visit = (file: string, stack: string[]) => {
      expect(stack, `Import cycle: ${[...stack, file].map(f => relative(root, f)).join(" -> ")}`)
        .not.toContain(file);
      if (visited.has(file)) return;
      for (const target of graph.get(file) ?? []) visit(target, [...stack, file]);
      visited.add(file);
    };
    for (const file of source) visit(file, []);
  });
});
