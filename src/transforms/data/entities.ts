import { HTML_ENTITY_ENTRIES } from "./entity-entries.js";

export const HTML_ENTITIES = new Map<string, string>();

for (const [name, char] of HTML_ENTITY_ENTRIES) {
  HTML_ENTITIES.set(`&${name};`, char);
  // Also support all-uppercase aliases, preserving the entity's canonical value.
  const upper = name.toUpperCase();
  if (upper !== name) {
    const upperEntity = `&${upper};`;
    if (!HTML_ENTITIES.has(upperEntity)) {
      HTML_ENTITIES.set(upperEntity, char);
    }
  }
}

export const HTML_ENTITY_RE = /&#?[0-9A-Za-z]{1,24};/g;
