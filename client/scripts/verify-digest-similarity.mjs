// Digest similarity gate.
//
// NOTE: comments here are intentionally ASCII-only. scripts/ is scanned by
// font-subset-config.mjs, so a non-ASCII character would change the shipped font
// subset and force a fonts:subset regeneration.
//
// WHAT THIS GUARDS
// ---------------------------------------------------------------------------
// The cross-band digests are the one kind of prose this site produces in volume,
// across many pages, from one author and one toolchain. That is the exact shape
// Google's spam policy calls "scaled content abuse" when the pages end up saying
// the same thing with the numbers swapped. Character counts cannot tell those two
// cases apart; a sequence-similarity ratio can.
//
// Two assertions:
//   1. every pair of digest routes scores below PAIRWISE_CEILING against each
//      other (prose only - headings, paragraphs, notes, callouts; table cells
//      are numbers and would only add noise);
//   2. every digest route's prose scores below CORPUS_CEILING against the body
//      of every other prerendered page in dist, including the amount variants
//      that canonicalize into it. A digest that restates its own variants is a
//      copy, not a cross-band view.
//
// The score is the Ratcliff/Obershelp ratio (2 * matched / total length), the
// same quantity Python's difflib.SequenceMatcher reports with autojunk=False.
// The longest common substring at each recursion step comes from a suffix
// automaton, so a 4k x 4k pair costs milliseconds and the full corpus sweep
// (digest routes x 158 pages) stays under a few seconds.
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DIGEST_SOURCES, digestProse } from "./hub-digests-registry.mjs";
import { SEO_ROUTES } from "./seo-routes.mjs";

const PAIRWISE_CEILING = 0.5;
const CORPUS_CEILING = 0.85;

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = resolve(projectRoot, "dist");

// --- text extraction --------------------------------------------------------
function stripTags(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function prerenderedBody(html) {
  return [
    ...html.matchAll(/<(article|section)[^>]*\bdata-seo-prerender\b[^>]*>([\s\S]*?)<\/\1>/gi),
  ]
    .map(([, , inner]) => inner)
    .join("\n");
}

function distBodyText(route) {
  const file =
    route === "/" ? resolve(distRoot, "index.html") : resolve(distRoot, route.slice(1), "index.html");
  if (!existsSync(file)) throw new Error(`No static output for ${route} - run the build first`);
  return stripTags(prerenderedBody(readFileSync(file, "utf8")));
}

// --- longest common substring via suffix automaton ----------------------------
function longestCommonSubstring(a, b) {
  if (a.length === 0 || b.length === 0) return { ai: 0, bi: 0, len: 0 };
  const next = [new Map()];
  const link = [-1];
  const length = [0];
  // end index in a of the first occurrence of each state's longest string
  const firstEnd = [-1];
  let last = 0;
  for (let i = 0; i < a.length; i += 1) {
    const ch = a.charCodeAt(i);
    const cur = length.length;
    next.push(new Map());
    link.push(0);
    length.push(length[last] + 1);
    firstEnd.push(i);
    let p = last;
    while (p !== -1 && !next[p].has(ch)) {
      next[p].set(ch, cur);
      p = link[p];
    }
    if (p === -1) {
      link[cur] = 0;
    } else {
      const q = next[p].get(ch);
      if (length[p] + 1 === length[q]) {
        link[cur] = q;
      } else {
        const clone = length.length;
        next.push(new Map(next[q]));
        link.push(link[q]);
        length.push(length[p] + 1);
        firstEnd.push(firstEnd[q]);
        while (p !== -1 && next[p].get(ch) === q) {
          next[p].set(ch, clone);
          p = link[p];
        }
        link[q] = clone;
        link[cur] = clone;
      }
    }
    last = cur;
  }
  let v = 0;
  let l = 0;
  let best = { ai: 0, bi: 0, len: 0 };
  for (let i = 0; i < b.length; i += 1) {
    const ch = b.charCodeAt(i);
    while (v !== 0 && !next[v].has(ch)) {
      v = link[v];
      l = length[v];
    }
    if (next[v].has(ch)) {
      v = next[v].get(ch);
      l += 1;
    }
    if (l > best.len) best = { ai: firstEnd[v] - l + 1, bi: i - l + 1, len: l };
  }
  return best;
}

function matchedChars(a, b) {
  if (a.length === 0 || b.length === 0) return 0;
  const m = longestCommonSubstring(a, b);
  if (m.len === 0) return 0;
  return (
    m.len +
    matchedChars(a.slice(0, m.ai), b.slice(0, m.bi)) +
    matchedChars(a.slice(m.ai + m.len), b.slice(m.bi + m.len))
  );
}

export function similarityRatio(a, b) {
  const total = a.length + b.length;
  if (total === 0) return 1;
  return (2 * matchedChars(a, b)) / total;
}

// --- gate -------------------------------------------------------------------
const failures = [];
const routes = Object.keys(DIGEST_SOURCES);

// A digest that is registered but never wired into its page (hub sections or LANDING_CONTENT)
// is caught here: its opening sentence has to be in the built HTML.
const proseOf = Object.fromEntries(
  routes.map((route) => [route, stripTags(DIGEST_SOURCES[route].map((fn) => digestProse(fn())).join(" "))]),
);
for (const route of routes) {
  const page = distBodyText(route);
  const firstSentence = proseOf[route].slice(0, 40);
  if (!page.includes(firstSentence)) {
    failures.push(`${route}: digest prose is registered but not present in the built page`);
  }
}

let pairwiseMax = { ratio: 0, a: "", b: "" };
for (let i = 0; i < routes.length; i += 1) {
  for (let j = i + 1; j < routes.length; j += 1) {
    const ratio = similarityRatio(proseOf[routes[i]], proseOf[routes[j]]);
    if (ratio > pairwiseMax.ratio) pairwiseMax = { ratio, a: routes[i], b: routes[j] };
    if (ratio >= PAIRWISE_CEILING) {
      failures.push(
        `${routes[i]} vs ${routes[j]}: digest prose similarity ${ratio.toFixed(3)} >= ${PAIRWISE_CEILING}`,
      );
    }
  }
}

let corpusMax = { ratio: 0, a: "", b: "" };
const corpus = SEO_ROUTES.map((route) => [route, distBodyText(route)]);
for (const route of routes) {
  for (const [other, text] of corpus) {
    if (other === route || text.length === 0) continue;
    const ratio = similarityRatio(proseOf[route], text);
    if (ratio > corpusMax.ratio) corpusMax = { ratio, a: route, b: other };
    if (ratio >= CORPUS_CEILING) {
      failures.push(`${route} digest vs ${other} body: similarity ${ratio.toFixed(3)} >= ${CORPUS_CEILING}`);
    }
  }
}

console.log(
  `Digest similarity: ${routes.length} routes, ${(routes.length * (routes.length - 1)) / 2} pairs\n` +
    `  pairwise max ${pairwiseMax.ratio.toFixed(3)} (${pairwiseMax.a} vs ${pairwiseMax.b}), ceiling ${PAIRWISE_CEILING}\n` +
    `  corpus max   ${corpusMax.ratio.toFixed(3)} (${corpusMax.a} digest vs ${corpusMax.b} body), ceiling ${CORPUS_CEILING}`,
);
for (const route of routes) {
  console.log(`  ${route.padEnd(24)} ${String(proseOf[route].length).padStart(5)} prose chars`);
}

if (failures.length > 0) {
  console.error(`\nDigest similarity gate failed on ${failures.length} check(s):`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}
