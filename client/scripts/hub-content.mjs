// Hub bodies for the base calculator routes.
//
// Why this exists: the amount variants (/salary/5000, /insurance/140000 …) now canonicalize into
// their base route, so the base route is the page that has to carry the family's weight. Before
// this module those bases fell through to the generic stub in prerender.mjs and shipped 132~802
// characters — /comprehensive-tax was 139 characters while the variants folding into it were
// 4,000+. Consolidating into a shell like that is a net loss, so each base gets a hub body first.
//
// A hub is deliberately NOT a copy of a variant. It answers three things a variant cannot:
//   1. what this calculator computes,
//   2. which amount range it covers and where the result changes character,
//   3. which variant to open next — and since the variants left the sitemap, these links are now
//      the only crawl path into them, so every hub links its whole family.
//
// Each route supplies its own H2 labels. The previous /dependent, /unpaid-wage and /eitc pages
// shared one fixed 5-heading template (prerender-guides.mjs) and landed within 9 characters of
// each other, which is exactly the "template clone" pattern an AdSense reviewer flags.

import {
  ARTICLE_STYLE,
  CALLOUT_STYLE,
  H1_STYLE,
  H2_STYLE,
  H3_STYLE,
  LI_STYLE,
  NOTE_STYLE,
  P_STYLE,
  TABLE_STYLE,
  TD_STYLE,
  TH_STYLE,
  UL_STYLE,
} from "./hub-styles.mjs";
import { HUB_PAGES as FAMILY_HUB_PAGES } from "./hub-pages.mjs";
import { TOOL_HUB_PAGES } from "./hub-pages-tools.mjs";

// Family hubs (a base calculator that absorbs amount variants) and single-tool hubs share one
// renderer but live in separate files — the family set is driven by the consolidation, the tool
// set by the thin-page audit, and they change for different reasons.
const HUB_PAGES = { ...FAMILY_HUB_PAGES, ...TOOL_HUB_PAGES };

function renderTable(table) {
  const head = table.head
    ? `<thead><tr>${table.head.map((h) => `<th style="${TH_STYLE}">${h}</th>`).join("")}</tr></thead>`
    : "";
  const rows = table.rows
    .map((row) => {
      const cells = row.cells
        .map((cell) => `<td style="${TD_STYLE}">${cell}</td>`)
        .join("");
      return `<tr${row.highlight ? ' style="background:hsl(var(--accent));"' : ""}>${cells}</tr>`;
    })
    .join("");
  return `<table style="${TABLE_STYLE}">${head}<tbody>${rows}</tbody></table>`;
}

// A block is one finding: a conclusion-shaped h3 followed by the paragraphs that argue it, and
// optionally its own table. Why the heading: an adversarial read of the card app found the same
// prose read as "a list of numbers" purely because nine paragraphs ran on with no heading between
// them, so a finding that cannot be named in one clause does not belong in a digest.
function renderBlock(block) {
  const parts = [`<h3 style="${H3_STYLE}">${block.h3}</h3>`];
  for (const body of [block.body].flat().filter(Boolean)) {
    parts.push(`<p style="${P_STYLE}">${body}</p>`);
  }
  if (block.table) parts.push(renderTable(block.table));
  if (block.tableNote) parts.push(`<p style="${P_STYLE}">${block.tableNote}</p>`);
  return parts.join("");
}

function renderSection(section) {
  const parts = [`<h2 style="${H2_STYLE}">${section.h2}</h2>`];
  for (const body of [section.body].flat().filter(Boolean)) {
    parts.push(`<p style="${P_STYLE}">${body}</p>`);
  }
  for (const block of section.blocks ?? []) parts.push(renderBlock(block));
  if (section.table) parts.push(renderTable(section.table));
  if (section.tableNote) parts.push(`<p style="${P_STYLE}">${section.tableNote}</p>`);
  if (section.callout) parts.push(`<div style="${CALLOUT_STYLE}">${section.callout}</div>`);
  if (section.list) {
    const items = section.list.map((item) => `<li style="${LI_STYLE}">${item}</li>`).join("");
    parts.push(`<ul style="${UL_STYLE}">${items}</ul>`);
  }
  for (const body of [section.after].flat().filter(Boolean)) {
    parts.push(`<p style="${P_STYLE}">${body}</p>`);
  }
  return parts.join("");
}

// Variant links carry the /finance base prefix. validate-static-output.mjs fails the build on a
// bare "/salary" href because the static HTML is served under /finance and would 404.
function renderVariants(variants) {
  if (!variants) return "";
  const items = variants.items
    .map(
      (item) =>
        `<li style="${LI_STYLE}"><a href="/finance${item.href}">${item.label}</a>${item.note ? ` — ${item.note}` : ""}</li>`,
    )
    .join("");
  return [
    `<h2 style="${H2_STYLE}">${variants.h2}</h2>`,
    variants.lead ? `<p style="${P_STYLE}">${variants.lead}</p>` : "",
    `<ul style="${UL_STYLE}">${items}</ul>`,
  ].join("");
}

/**
 * Returns the prerendered hub body for a base calculator route, or null when the route has no
 * hub definition (the caller then falls back to its existing guide/stub chain).
 */
export function buildHubContent(route) {
  const page = HUB_PAGES[route];
  if (!page) return null;

  const definition = typeof page === "function" ? page() : page;
  const lead = [definition.lead]
    .flat()
    .filter(Boolean)
    .map((text) => `<p style="${P_STYLE}">${text}</p>`)
    .join("");

  return `
    <article data-seo-prerender="hub" style="${ARTICLE_STYLE}">
      <h1 style="${H1_STYLE}">${definition.h1}</h1>
      ${lead}
      ${definition.sections.map(renderSection).join("")}
      ${renderVariants(definition.variants)}
      <p style="${NOTE_STYLE}">${definition.note}</p>
    </article>`;
}

/**
 * Renders one digest (the renderSection schema) as standalone HTML. The EITC household variants are
 * built by prerender-content.mjs rather than by a hub definition, so they need the same markup
 * without going through buildHubContent.
 */
export function renderDigestBody(digest) {
  return renderSection(digest);
}

export const HUB_ROUTES = Object.freeze(Object.keys(HUB_PAGES));
