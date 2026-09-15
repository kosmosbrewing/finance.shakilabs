// Wraps every prerendered <table> in a horizontal scroll container.
//
// NOTE: comments here are intentionally ASCII-only. scripts/ is scanned by
// font-subset-config.mjs, so a non-ASCII character would change the shipped font
// subset and force a fonts:subset regeneration.
//
// WHY THIS EXISTS
// ---------------------------------------------------------------------------
// The prerendered article is adopted into the Vue layout on mount, so its tables
// are the reader's tables. They carry width:100%, but a table cannot shrink below
// its min-content width - at 390px a 4-column money table settles around 400-640px
// and, with nothing scrolling it, it sizes the DOCUMENT instead. The reader then
// drags the whole page sideways to read a paragraph. 50 of 158 routes did this.
//
// The fix is the one the app already uses for its Vue tables
// (src/components/salary/SalaryCompareTable.vue): a wrapper that scrolls, with
// tabindex="0" so the scroll box is reachable by keyboard, role="region" and a
// name so a screen reader announces what is being scrolled. The data is never
// narrowed - a money column that wraps is worse than one that scrolls.
//
// Inline styles rather than the Tailwind class the Vue components use: Tailwind
// scans ./index.html and ./src only (tailwind.config.ts content), so a utility
// whose only remaining reference lived in scripts/ would silently stop being
// generated and the wrapper would quietly stop scrolling. The rest of the
// prerendered body is inline-styled for the same reason.
// The wrapper carries no margin of its own. overflow-x:auto makes it a block
// formatting context, so the table's existing 10px/16px margins stay inside it
// and the vertical rhythm is byte-for-byte what it was before wrapping.
export const TABLE_SCROLL_STYLE = "overflow-x:auto;max-width:100%;";

// Marks a wrapper this module produced, so a second pass over the same HTML is a
// no-op (prerender.mjs is re-run over its own output during incremental builds).
const MARKER = "data-table-scroll";

const TABLE_RE = /<table\b[^>]*>[\s\S]*?<\/table>/gi;
const HEADING_RE = /<h([23])\b[^>]*>([\s\S]*?)<\/h\1>/gi;

const stripTags = (html) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();

const escapeAttr = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// The accessible name comes from the heading the table sits under, because that
// is the only text on the page that says what the table holds. A generic
// "table" label on eight regions would be worse than none.
//
// Headings here are editorial sentences ("so the bracket matters more than the
// household type - the flat band is 1.8x wider"), and a screen reader reading one
// of those as a region name is noise. Only the part before the em dash is kept,
// then it is capped: a name is a handle, not the sentence itself.
const LABEL_MAX_CHARS = 30;

function labelFor(html, tableIndex) {
  let label = null;
  HEADING_RE.lastIndex = 0;
  for (let match = HEADING_RE.exec(html); match; match = HEADING_RE.exec(html)) {
    if (match.index > tableIndex) break;
    const text = stripTags(match[2]);
    if (text) label = text;
  }
  if (!label) return "표";
  // \u2013 / \u2014 written as escapes: a literal en dash in this file would add a
  // character to the font subset scan and force a fonts:subset regeneration.
  label = label.split(/\s[-\u2013\u2014]\s/)[0].trim();
  if (label.length > LABEL_MAX_CHARS) {
    label = `${label.slice(0, LABEL_MAX_CHARS).trim()}…`;
  }
  // Some headings already end in the word for "table"; appending it again would
  // have a screen reader say it twice.
  return label.endsWith("표") ? label : `${label} 표`;
}

export function wrapPrerenderedTables(html) {
  if (typeof html !== "string" || !html.includes("<table")) return html;

  // Idempotent: a body that already carries the marker has been through here.
  if (html.includes(MARKER)) return html;

  return html.replace(TABLE_RE, (table, offset) => {
    const label = labelFor(html, offset);
    return (
      `<div ${MARKER} style="${TABLE_SCROLL_STYLE}" role="region" ` +
      `aria-label="${escapeAttr(label)}" tabindex="0">${table}</div>`
    );
  });
}
