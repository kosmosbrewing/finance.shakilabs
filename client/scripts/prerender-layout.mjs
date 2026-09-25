// 프리렌더 공통 레이아웃: header nav + footer
// 모든 프리렌더 페이지에 정적 HTML로 주입되어 크롤러의 사이트 항해를 가능하게 함

import { readFileSync } from "node:fs";
import { CALCULATOR_CATALOG } from "./calculator-catalog.mjs";
import { PRIMARY_NAV_ITEMS } from "./primary-nav-items.mjs";

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

const CURRENT_SERVICE = SERVICE_CATALOG.services.find((service) => service.app === CURRENT_APP);

// 헤더 사이트 링크 — Vue 헤더(AppHeader.vue의 links)와 같은 두 개. 모바일에서는 ☰ 안으로 들어간다.
// 테마 토글의 정적 쌍둥이 — 패키지 ShThemeToggle과 같은 클래스·같은 아이콘. 수화 전이라 동작하지 않지만
// 자리가 비어 있으면 수화 때 데스크톱 사이트 링크가 60px 옆으로 밀린다.
const STATIC_THEME_TOGGLE = `<div class="sh-global-header__utility"><button type="button" class="sh-theme-toggle" aria-label="다크 모드로 전환" style="width:44px;min-height:44px;border:0;background:transparent;color:#fafafa;"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="20" height="20"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.6" /><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg></button></div>`;

const SITE_LINKS = [
  { href: "/blog", label: "블로그" },
  { href: "/finance/about", label: "소개" },
];

/**
 * 전체 메뉴(☰)의 **정적 쌍둥이** — 0.3.38 "순수 내비게이션" 구조와 같다.
 *
 * 왜 필요한가: 이 앱의 프리렌더 산출물에는 Vue 출력이 한 글자도 없다(#app은 빈
 * div이고, 크롤러와 첫 페인트가 보는 셸은 전부 이 파일이 만든다). 메뉴를 Vue에만
 * 두면 모바일 탭 줄이 숨은 상태에서 원시 HTML의 헤더 경로가 0이 된다. 수화 후 헤더와
 * 같은 클래스·같은 목록으로 여기에도 심는다.
 *
 * 목록은 `scripts/primary-nav-items.mjs` 하나에서만 온다 — Vue 헤더·탭 줄도
 * 같은 파일을 import한다. 복제가 없으니 대조 게이트도 필요 없다.
 *
 * 트리거는 수화 전이므로 동작하지 않는다. 패널은 패키지 CSS가
 * `visibility:hidden; transform:translateX(100%)`로 숨기므로(스타일시트는
 * 렌더 블로킹이라 첫 페인트에 이미 도착해 있다) 화면에는 보이지 않고 DOM에만 남는다.
 */
export function buildPrerenderDrawer() {
  const links = PRIMARY_NAV_ITEMS.map(
    ({ to, label }) =>
      `<a class="sh-nav-drawer__link" href="/finance${to}">${label}</a>`,
  ).join("");
  const siteLinks = SITE_LINKS.map(
    ({ href, label }) => `<a class="sh-nav-drawer__site-link" href="${href}">${label}</a>`,
  ).join("");

  return `<button type="button" class="sh-nav-drawer__trigger" aria-label="메뉴 열기" aria-expanded="false" aria-controls="sh-nav-drawer-prerender" style="border:0;background:transparent;color:#fafafa;">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="22" height="22"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg>
        </button>
        <div class="sh-nav-drawer" data-open="false">
          <div class="sh-nav-drawer__scrim"></div>
          <nav id="sh-nav-drawer-prerender" class="sh-nav-drawer__panel" aria-label="전체 메뉴" aria-hidden="true" tabindex="-1">
            <div class="sh-nav-drawer__head"><p class="sh-nav-drawer__heading"><span class="sh-nav-drawer__eyebrow">ShakiLabs</span>${CURRENT_SERVICE.shortLabel}</p></div>
            <div class="sh-nav-drawer__list">${links}</div>
            <div class="sh-nav-drawer__site">${siteLinks}</div>
          </nav>
        </div>`;
}

/**
 * 모든 프리렌더 페이지 최상단에 삽입되는 정적 header HTML.
 *
 * v3 §3.2 — 검정 GlobalHeader. 이 블록은 Vue가 mount하기 전까지 사람이 실제로 보는
 * 헤더이므로 수화 후 헤더와 같아야 한다: `ShakiLabs / 급여·건보료` ··· 블로그 · 소개 · ☰.
 * 예전에는 흰 배경 인라인 헤더가 있었고 Vue는 다른 헤더를 그려서, 첫 페인트와 수화
 * 사이에 셸이 통째로 바뀌는 플래시가 났다(모바일·finance 재검수 §1).
 *
 * 클래스는 패키지 CSS(.sh-global-header)와 같은 이름을 쓰고, 배경·높이·글자색은
 * 인라인으로도 못박는다 — 스타일시트가 도착하기 전 첫 페인트에서도 검정이어야 한다.
 * 단 사이트 링크 묶음(nav)에는 display를 인라인으로 주지 않는다 — 인라인이 이기면
 * 모바일에서 패키지가 링크를 ☰ 안으로 접는 규칙이 무시된다.
 *
 * 크롤 경로는 같은 페이지 푸터(buildPrerenderFooter)가 26개 계산기 전부 + 다른
 * 서비스 + 블로그로 이미 덮는다. 앱 이름은 services.json(푸터와 같은 출처)에서만 온다.
 */
export function buildPrerenderHeader() {
  const link = ({ href, label }) =>
    `<a class="sh-global-header__link" href="${href}" style="display:inline-flex;align-items:center;min-height:44px;padding-inline:10px;color:#a3a3a3;font-size:13px;font-weight:500;text-decoration:none;">${label}</a>`;

  return `
    <header data-seo-prerender="header" class="sh-global-header sh-global-header--has-app" style="position:sticky;top:0;z-index:50;background:#0a0a0a;color:#fafafa;">
      <div class="sh-global-header__inner" style="display:flex;align-items:center;gap:16px;height:56px;margin-inline:auto;padding-inline:var(--sh-container-gutter, 16px);max-width:var(--sh-header-content-width, 72rem);">
        <div class="sh-global-header__start" style="display:flex;align-items:center;min-width:0;">
          <a class="sh-global-header__brand" href="/" aria-label="ShakiLabs 홈" style="display:inline-flex;align-items:center;gap:8px;min-height:44px;color:#fafafa;font-size:15px;font-weight:700;letter-spacing:-0.01em;text-decoration:none;white-space:nowrap;">
            <img class="sh-global-header__logo" src="/finance/logo.png" alt="" aria-hidden="true" width="20" height="20" style="width:20px;height:20px;filter:invert(1) brightness(1.6);" />
            <span class="sh-global-header__brand-text">ShakiLabs</span>
          </a>
          <span class="sh-global-header__sep" aria-hidden="true" style="margin-inline:10px 4px;color:rgb(255 255 255 / 28%);font-size:16px;font-weight:400;">/</span>
          <a class="sh-global-header__app" href="${CURRENT_SERVICE.href}" style="display:inline-flex;align-items:center;min-height:44px;padding-inline:6px;color:#fafafa;font-size:15px;font-weight:600;text-decoration:none;white-space:nowrap;">${CURRENT_SERVICE.shortLabel}</a>
        </div>
        <div class="sh-global-header__end" style="display:flex;align-items:center;gap:16px;margin-inline-start:auto;">
          <nav class="sh-global-header__nav" aria-label="사이트 메뉴">${SITE_LINKS.map(link).join("")}</nav>
          ${STATIC_THEME_TOGGLE}
          ${buildPrerenderDrawer()}
        </div>
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
          <!-- /all 허브는 카테고리 카탈로그에 없다. 예전에는 프리렌더 헤더가 이 링크를 들고
               있었으므로, 헤더를 v3 셸로 바꾸면서 여기로 옮기지 않으면 JS 없는 크롤러에게
               허브로 가는 정적 경로가 전 페이지에서 사라진다. -->
          <a href="/finance/all" style="color:hsl(var(--muted-foreground));margin-right:12px;">전체 계산기</a>
          <a href="/finance/about" style="color:hsl(var(--muted-foreground));margin-right:12px;">서비스 소개</a>
          <a href="/finance/privacy" style="color:hsl(var(--muted-foreground));margin-right:12px;">개인정보처리방침</a>
          <a href="/finance/terms" style="color:hsl(var(--muted-foreground));margin-right:12px;">이용약관</a>
          <a href="/blog" style="color:hsl(var(--muted-foreground));">블로그</a>
        </p>
        <p style="margin:0;">본 계산기는 2026년 최신 세율·요율을 기반으로 하며, 국세청 근로소득 간이세액표·국민건강보험공단 고시·고용노동부 고시를 참고합니다. 결과는 법적 효력이 없는 참고용 추정값입니다.</p>
      </div>
    </footer>`;
}
