// sitemap.xml 생성
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve } from "path";
import { SEO_ROUTES } from "./seo-routes.mjs";

const SITE_URL = "https://finance.shakilabs.com";
const DIST_DIR = resolve(import.meta.dirname, "../dist");
const PUBLIC_DIR = resolve(import.meta.dirname, "../public");

const today = new Date().toISOString().split("T")[0];

function resolvePriority(route) {
  if (route === "/" || route === "/insurance") return "1.0";
  if (route.startsWith("/insurance/")) return "0.8";
  if (route === "/salary" || route.startsWith("/salary/")) return "0.75";
  if (route === "/compare" || route.startsWith("/compare/") || route === "/quit" || route.startsWith("/quit/")) return "0.6";
  return "0.4";
}

function resolveChangeFreq(route) {
  if (route === "/" || route === "/insurance") return "daily";
  if (route.startsWith("/insurance/") || route.startsWith("/salary/") || route.startsWith("/compare/") || route.startsWith("/quit/")) return "weekly";
  return "monthly";
}

const urls = SEO_ROUTES.map((route) => `  <url>
    <loc>${SITE_URL}${route}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${resolveChangeFreq(route)}</changefreq>
    <priority>${resolvePriority(route)}</priority>
  </url>`).join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

if (!existsSync(PUBLIC_DIR)) {
  mkdirSync(PUBLIC_DIR, { recursive: true });
}
writeFileSync(resolve(PUBLIC_DIR, "sitemap.xml"), sitemap, "utf-8");

if (existsSync(DIST_DIR)) {
  writeFileSync(resolve(DIST_DIR, "sitemap.xml"), sitemap, "utf-8");
}

console.log(`[sitemap] Generated with ${SEO_ROUTES.length} URLs`);
