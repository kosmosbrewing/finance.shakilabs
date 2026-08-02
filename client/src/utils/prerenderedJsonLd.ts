// Prerendered pages ship one `<script type="application/ld+json" data-seo-prerender="jsonld">`
// block that scripts/prerender.mjs writes into <head>. unhead does not own that block, so any
// schema the SPA declares for the very same URL is rendered a second time and search engines
// read two entities for one page. The prerendered block is the source of truth for the URL that
// was loaded, so the client only contributes the types that block does not already carry.

export const PRERENDERED_JSON_LD_SELECTOR =
  'script[type="application/ld+json"][data-seo-prerender="jsonld"]';

type JsonLdScriptNode = { textContent: string | null };
type JsonLdScriptSource = {
  querySelectorAll(selector: string): ArrayLike<JsonLdScriptNode>;
};

const EMPTY_TYPES: ReadonlySet<string> = new Set<string>();

// Top-level "@type" values only. Nested nodes (mainEntity, itemListElement, ...) belong to their
// parent entity, so they must not make the whole entry look like a duplicate.
export function collectJsonLdTypes(value: unknown): Set<string> {
  const types = new Set<string>();

  const visit = (entry: unknown): void => {
    if (Array.isArray(entry)) {
      entry.forEach(visit);
      return;
    }
    if (!entry || typeof entry !== "object") return;
    const type = (entry as Record<string, unknown>)["@type"];
    if (typeof type === "string") {
      types.add(type);
      return;
    }
    if (Array.isArray(type)) {
      for (const item of type) {
        if (typeof item === "string") types.add(item);
      }
    }
  };

  visit(value);
  return types;
}

export function readPrerenderedJsonLdTypes(root: JsonLdScriptSource): Set<string> {
  const types = new Set<string>();
  for (const node of Array.from(root.querySelectorAll(PRERENDERED_JSON_LD_SELECTOR))) {
    const text = node.textContent?.trim();
    if (!text) continue;
    try {
      for (const type of collectJsonLdTypes(JSON.parse(text))) types.add(type);
    } catch {
      // Malformed prerender output must never break the page: fall back to client schema.
    }
  }
  return types;
}

export function filterDuplicateJsonLd<T extends Record<string, unknown>>(
  entries: T[],
  prerenderedTypes: ReadonlySet<string>
): T[] {
  if (prerenderedTypes.size === 0) return entries;
  return entries.filter((entry) => {
    const entryTypes = collectJsonLdTypes(entry);
    if (entryTypes.size === 0) return true;
    return ![...entryTypes].some((type) => prerenderedTypes.has(type));
  });
}

let cache: { pathname: string; types: Set<string> } | null = null;

// The prerendered block describes the URL the browser loaded. After a client-side navigation it
// is stale, so it must no longer suppress the schema of the route the user is now looking at.
export function prerenderedJsonLdTypesForCurrentPath(): ReadonlySet<string> {
  if (typeof document === "undefined" || typeof window === "undefined") return EMPTY_TYPES;
  if (!cache) {
    cache = {
      pathname: window.location.pathname,
      types: readPrerenderedJsonLdTypes(document),
    };
  }
  return cache.pathname === window.location.pathname ? cache.types : EMPTY_TYPES;
}

export function resetPrerenderedJsonLdCache(): void {
  cache = null;
}
