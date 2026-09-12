// PWA static output gate.
//
// NOTE: comments here are intentionally ASCII-only. scripts/ is scanned by
// font-subset-config.mjs, so a non-ASCII character would change the shipped font
// subset and force a fonts:subset regeneration.
//
// WHAT THIS PROTECTS
// ---------------------------------------------------------------------------
// 1. SUBDIRECTORY. This app is served at shakilabs.com/finance/ next to sibling
//    apps (/house/, /car/, ...). If scope or start_url ever loses the prefix,
//    the worker's scope widens and it answers requests that belong to another
//    app. verify-sw-scope.mjs proves the boundary in a real browser; this file
//    proves the declaration.
// 2. THE STALE-PRERENDER TRAP. vite build writes dist/index.html as the SPA
//    shell, and prerender.mjs then OVERWRITES it with the prerendered home page.
//    Any .html in the precache manifest is therefore a frozen copy of the
//    pre-prerender shell, which the worker would keep serving forever - the
//    crawler and the reader would get different bodies, which is exactly the
//    failure the hydration gate exists to catch. Zero .html entries, always.
// 3. NO API CACHING. A comment/like backend is coming. A cached API response is
//    someone else's data, or your own post appearing to have vanished.
import sharp from "sharp";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const clientRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = resolve(clientRoot, "dist");
const BASE = "/finance/";

const failures = [];
let maskableReport = "not measured";
const note = (message) => failures.push(message);

function readDist(relative) {
  const file = resolve(distRoot, relative);
  if (!existsSync(file)) {
    note(`dist/${relative} is missing - run the build first`);
    return null;
  }
  return readFileSync(file, "utf8");
}

// --- manifest ---------------------------------------------------------------
const manifestRaw = readDist("manifest.webmanifest");
let manifest = null;
if (manifestRaw) {
  try {
    manifest = JSON.parse(manifestRaw);
  } catch (error) {
    note(`manifest.webmanifest is not valid JSON: ${error.message}`);
  }
}

if (manifest) {
  if (manifest.scope !== BASE) note(`manifest.scope is "${manifest.scope}", expected "${BASE}"`);
  if (manifest.start_url !== BASE) note(`manifest.start_url is "${manifest.start_url}", expected "${BASE}"`);
  if (manifest.display !== "standalone") note(`manifest.display is "${manifest.display}", expected "standalone"`);
  for (const field of ["name", "short_name", "theme_color", "background_color"]) {
    if (!manifest[field]) note(`manifest.${field} is empty - installability requires it`);
  }

  // Installability needs both 192 and 512, and a maskable icon keeps Android from
  // pasting the square tile inside its own circle.
  const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
  for (const size of ["192x192", "512x512"]) {
    if (!icons.some((icon) => (icon.sizes ?? "").split(" ").includes(size))) {
      note(`manifest has no ${size} icon`);
    }
  }
  if (!icons.some((icon) => (icon.purpose ?? "").includes("maskable"))) {
    note("manifest has no maskable icon");
  }
  for (const icon of icons) {
    if (!String(icon.src).startsWith(BASE)) {
      note(`icon src "${icon.src}" is not under ${BASE}`);
      continue;
    }
    const relative = String(icon.src).slice(BASE.length);
    if (!existsSync(resolve(distRoot, relative))) note(`icon file dist/${relative} is missing`);
  }

  // theme_color must match the app's own --primary, or the installed title bar
  // is a colour that appears nowhere in the app.
  const shell = readFileSync(resolve(clientRoot, "index.html"), "utf8");
  const primary = shell.match(/--primary:\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/);
  if (!primary) {
    note("index.html has no --primary token to compare theme_color against");
  } else {
    const [, h, s, l] = primary.map(Number);
    const hex = hslToHex(h, s, l);
    if (String(manifest.theme_color).toLowerCase() !== hex) {
      note(`manifest.theme_color ${manifest.theme_color} != index.html --primary ${hex}`);
    }
  }
}

function hslToHex(h, s, l) {
  const sat = s / 100;
  const lig = l / 100;
  const k = (n) => (n + h / 30) % 12;
  const a = sat * Math.min(lig, 1 - lig);
  const f = (n) => lig - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const to255 = (value) => Math.round(255 * value).toString(16).padStart(2, "0");
  return `#${to255(f(0))}${to255(f(8))}${to255(f(4))}`;
}

// --- the maskable icon actually survives the crop ---------------------------
// "purpose: maskable" is a promise that Android may crop the tile to a circle or
// a squircle and the mark will still be whole. Declaring it is free; the only
// check that means anything is measuring where the mark's pixels sit. Android's
// safe zone is the inner 80% of the canvas, so every mark pixel must fall within
// 40% of the width from the centre.
if (manifest) {
  const maskable = (manifest.icons ?? []).find((icon) => (icon.purpose ?? "").includes("maskable"));
  if (maskable && String(maskable.src).startsWith(BASE)) {
    const file = resolve(distRoot, String(maskable.src).slice(BASE.length));
    if (existsSync(file)) {
      const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
      let minX = Infinity, minY = Infinity, maxX = -1, maxY = -1;
      for (let y = 0; y < info.height; y += 1) {
        for (let x = 0; x < info.width; x += 1) {
          const i = (y * info.width + x) * info.channels;
          // The mark is the light-on-brand foreground; the tile is the dark token.
          if (data[i] > 200 && data[i + 1] > 200 && data[i + 2] > 200) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      if (maxX < 0) {
        note(`${maskable.src} has no light-coloured mark - the maskable tile looks empty`);
      } else {
        const centre = info.width / 2;
        const safeRadius = info.width * 0.4;
        const furthest = Math.max(
          ...[[minX, minY], [maxX, minY], [minX, maxY], [maxX, maxY]].map(
            ([x, y]) => Math.hypot(x - centre, y - centre),
          ),
        );
        maskableReport = `mark bbox ${minX},${minY}-${maxX},${maxY}, furthest ${furthest.toFixed(1)}px of ${safeRadius}px safe radius`;
        if (furthest > safeRadius) {
          note(
            `maskable icon leaves the safe zone: ${maskableReport}. Android's circular crop would cut the mark.`,
          );
        }
      }
    }
  }
}

// --- shell links the manifest ----------------------------------------------
const shellHtml = readFileSync(resolve(clientRoot, "index.html"), "utf8");
if (!shellHtml.includes(`href="${BASE}manifest.webmanifest"`)) {
  note("index.html does not link the manifest - the browser never sees it");
}

// --- service worker ---------------------------------------------------------
const sw = readDist("sw.js");
if (sw) {
  const precached = [...sw.matchAll(/\{url:"([^"]+)"/g)].map(([, url]) => url);
  if (precached.length === 0) note("sw.js precaches nothing - the app shell is not offline-capable");

  const html = precached.filter((url) => url.endsWith(".html"));
  if (html.length > 0) {
    note(
      `sw.js precaches ${html.length} HTML file(s) (${html.slice(0, 3).join(", ")}). ` +
        "prerender.mjs rewrites dist HTML AFTER vite build, so a precached page is a frozen " +
        "pre-prerender shell. Navigations must stay network-first.",
    );
  }

  if (/createHandlerBoundToURL|NavigationRoute/.test(sw)) {
    note("sw.js registers a navigation fallback - that would serve the SPA shell instead of prerendered HTML");
  }
  if (!/NetworkFirst/.test(sw)) note("sw.js has no NetworkFirst handler for navigations");
  if (!/NetworkOnly/.test(sw)) note("sw.js has no NetworkOnly rule - the API could end up cached");
  if (!/pathname\.startsWith\("\/api\/"\)/.test(sw)) {
    note("sw.js has no /api/ matcher - confirm the backend is excluded from caching");
  }

  for (const url of precached) {
    if (url.startsWith("/") || url.startsWith("http")) {
      note(`precache url "${url}" is absolute; it must stay relative to ${BASE}sw.js`);
    }
  }
}

// --- registration is scoped in source ---------------------------------------
const pwaSource = readFileSync(resolve(clientRoot, "src/lib/pwa.ts"), "utf8");
if (!/navigator\.serviceWorker\.register\(SW_URL, \{ scope: BASE \}\)/.test(pwaSource)) {
  note("src/lib/pwa.ts must register the worker with an explicit { scope: BASE }");
}

// --- install measurement survives refactors ---------------------------------
// "50 installs in 28 days" is the gate for taking this to an app store. If these
// two events quietly disappear, the decision loses its evidence and nobody
// notices, because a missing event looks exactly like zero installs.
for (const event of ["pwa_install_prompt", "pwa_install"]) {
  if (!pwaSource.includes(`trackEvent("${event}"`)) {
    note(`src/lib/pwa.ts no longer sends ${event} - install measurement would go dark`);
  }
}

console.log("PWA static output");
if (manifest) {
  console.log(`  manifest  scope=${manifest.scope} start_url=${manifest.start_url} display=${manifest.display}`);
  console.log(`  icons     ${(manifest.icons ?? []).map((i) => `${i.sizes}/${i.purpose}`).join(" ")}`);
  console.log(`  maskable  ${maskableReport}`);
}
if (sw) {
  const precached = [...sw.matchAll(/\{url:"([^"]+)"/g)].map(([, url]) => url);
  console.log(`  precache  ${precached.length} entries, ${precached.filter((u) => u.endsWith(".html")).length} html`);
  console.log("  routes    /api/ NetworkOnly, navigations NetworkFirst, no navigation fallback");
}

if (failures.length > 0) {
  console.error(`\nPWA gate failed (${failures.length}):`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
