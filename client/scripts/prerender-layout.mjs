// 프리렌더 공통 레이아웃: header nav + footer
// 모든 프리렌더 페이지에 정적 HTML로 주입되어 크롤러의 사이트 항해를 가능하게 함

import { readFileSync } from "node:fs";
import { CALCULATOR_CATALOG } from "./calculator-catalog.mjs";

// 공유 카탈로그 단일 출처 — Vue 푸터와 같은 목록을 정적 HTML에도 심는다(JS 없이도 크롤 경로 확보)
const SERVICE_CATALOG = JSON.parse(
  readFileSync(
    new URL("../node_modules/@shakilabs/ui/dist/services.json", import.meta.url),
    "utf8",
  ),
);
const CURRENT_APP = "finance";

function buildOtherServicesBlock() {
  const rows = SERVICE_CATALOG.categories
    .map((category) => {
      const items = SERVICE_CATALOG.services.filter(
        (service) => service.categoryId === category.id && service.app !== CURRENT_APP,
      );
      if (!items.length) return "";
      const links = items
        .map(
          (service) =>
            `<a href="${service.href}" style="color:hsl(var(--muted-foreground));text-decoration:none;margin-right:12px;">${service.shortLabel}</a>`,
        )
        .join("");
      return `<p style="margin:0 0 4px;"><span style="display:inline-block;min-width:78px;color:hsl(var(--muted-foreground));">${category.label}</span>${links}</p>`;
    })
    .filter(Boolean)
    .join("");
  return `<nav aria-label="다른 서비스" style="margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid hsl(var(--border));font-size:12px;line-height:2;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:hsl(var(--foreground));">다른 서비스</p>
        ${rows}
      </nav>`;
}

/**
 * 모든 프리렌더 페이지 최상단에 삽입되는 정적 header/nav HTML
 * - 로고
 * - 주요 5개 카테고리 대표 링크 (중복 최소화)
 * - About/전체계산기
 */
export function buildPrerenderHeader() {
  return `
    <header data-seo-prerender="header" style="max-width:1120px;margin:0 auto;padding:14px 16px;border-bottom:1px solid hsl(var(--border));">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;">
        <a href="/finance/salary" style="font-weight:700;font-size:18px;color:hsl(var(--primary));text-decoration:none;">ShakiLabs 연봉계산기</a>
        <nav aria-label="주요 계산기" style="display:flex;gap:16px;flex-wrap:wrap;font-size:14px;">
          <a href="/finance/salary" style="color:hsl(var(--foreground));text-decoration:none;">연봉 실수령</a>
          <a href="/finance/insurance" style="color:hsl(var(--foreground));text-decoration:none;">건강보험료</a>
          <a href="/finance/comprehensive-tax" style="color:hsl(var(--foreground));text-decoration:none;">종합소득세</a>
          <a href="/finance/year-end-settlement" style="color:hsl(var(--foreground));text-decoration:none;">연말정산</a>
          <a href="/finance/quit" style="color:hsl(var(--foreground));text-decoration:none;">퇴사 계산</a>
          <a href="/finance/all" style="color:hsl(var(--foreground));text-decoration:none;">전체 계산기</a>
          <a href="/finance/about" style="color:hsl(var(--foreground));text-decoration:none;">서비스 소개</a>
        </nav>
      </div>
    </header>`;
}

/**
 * 모든 프리렌더 페이지 최하단에 삽입되는 정적 footer HTML
 * - 전체 계산기 링크 (5 카테고리) — 목록은 calculator-catalog.mjs에서만 온다.
 *   여기에 링크를 손으로 적어 두었던 동안 Vue 푸터는 26개, 이 푸터는 22개였고,
 *   JS를 실행하지 않는 크롤러에게는 계산기 4개로 가는 경로가 아예 없었다.
 * - 운영자·문의·법적 고지
 */
export function buildPrerenderFooter() {
  const categoryBlocks = CALCULATOR_CATALOG
    .map(({ category, items }) => {
      const links = items
        .map(
          (item) =>
            `<li style="margin-bottom:4px;"><a href="/finance${item.route}" style="color:hsl(var(--muted-foreground));text-decoration:none;font-size:13px;">${item.label}</a></li>`
        )
        .join("");
      return `
      <div>
        <h3 style="font-size:13px;font-weight:700;color:hsl(var(--foreground));margin:0 0 8px;">${category}</h3>
        <ul style="list-style:none;padding:0;margin:0;">${links}</ul>
      </div>`;
    })
    .join("");

  return `
    <footer data-seo-prerender="footer" style="max-width:1120px;margin:40px auto 0;padding:24px 16px;border-top:1px solid hsl(var(--border));background:hsl(var(--muted));">
      <nav aria-label="전체 계산기" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:20px;margin-bottom:20px;">
        ${categoryBlocks}
      </nav>
      ${buildOtherServicesBlock()}
      <div style="padding-top:16px;border-top:1px solid hsl(var(--border));font-size:12px;color:hsl(var(--muted-foreground));line-height:1.8;">
        <p style="margin:0 0 6px;">운영 <strong>Shakilabs</strong> · 문의 <a href="mailto:skdba1313@gmail.com" style="color:hsl(var(--muted-foreground));">skdba1313@gmail.com</a></p>
        <p style="margin:0 0 6px;">
          <a href="/finance/about" style="color:hsl(var(--muted-foreground));margin-right:12px;">서비스 소개</a>
          <a href="/finance/privacy" style="color:hsl(var(--muted-foreground));margin-right:12px;">개인정보처리방침</a>
          <a href="/finance/terms" style="color:hsl(var(--muted-foreground));margin-right:12px;">이용약관</a>
          <a href="/blog" style="color:hsl(var(--muted-foreground));">블로그</a>
        </p>
        <p style="margin:0;">본 계산기는 2026년 최신 세율·요율을 기반으로 하며, 국세청 근로소득 간이세액표·국민건강보험공단 고시·고용노동부 고시를 참고합니다. 결과는 법적 효력이 없는 참고용 추정값입니다.</p>
      </div>
    </footer>`;
}
