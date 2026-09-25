// /2027 「2027년 달라지는 세금·지원금」 프리렌더 본문 — 크롤러가 받는 정적 HTML.
//
// 화면(Changes2027View.vue)과 같은 레지스트리(changes-2027.mjs)를 같은 순서로 그린다. 두 곳이 다른 문장을 쓰면
// verify-hydration-survival이 "크롤러만 보는 문장"으로 잡는다.
// 뷰가 전 구간을 그대로 그리므로 모든 구간에 data-prerender-mirror를 붙인다 — 수화 뒤 입양
// (utils/prerenderFallback.ts)에서 걷혀 화면에 두 번 나오지 않는다(/guide/* 중복 실측 이력).
import {
  CHANGE_AREAS,
  CHANGE_STATUSES,
  CHANGES_2027,
  CHANGES_2027_FAQS,
  CHANGES_2027_META,
  CHANGES_2027_VERIFIED_AT,
  changeCalcHref,
  changeSourcesOf,
  changesStatusSummary,
  formatChangeDate,
} from "./changes-2027.mjs";

const APP_BASE = "/finance";
const MIRROR = "data-prerender-mirror";
const escapeHtml = (value) =>
  String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// 프리렌더는 base 없이 서빙되는 정적 HTML이라 같은 앱 링크에 /finance 접두어를 붙인다
// (validate-static-output의 링크 접두어 검사). 다른 앱은 이미 절대 URL이다.
function hrefFor(item) {
  const href = changeCalcHref(item);
  if (!href) return null;
  return href.startsWith("/") ? `${APP_BASE}${href}` : href;
}

function renderItem(item) {
  const sources = changeSourcesOf(item)
    .map((source) => `<a href="${escapeHtml(source.url)}">${escapeHtml(source.title)}</a> (${formatChangeDate(source.date)})`)
    .join(" · ");
  const href = hrefFor(item);
  const details = (item.details ?? []).map((detail) => `<li>${escapeHtml(detail)}</li>`).join("");
  return `
      <li id="${item.id}" style="margin:0 0 20px;">
        <h3 style="font-size:17px;margin:0 0 4px;">${escapeHtml(item.title)}</h3>
        <p style="margin:0 0 4px;">${escapeHtml(CHANGE_STATUSES[item.status].label)}</p>
        <p style="margin:0 0 8px;">${escapeHtml(item.line)}</p>
        <dl style="margin:0 0 8px;">
          <dt>현행</dt><dd>${escapeHtml(item.before)}</dd>
          <dt>변경 후</dt><dd>${escapeHtml(item.after)}</dd>
          <dt>대상</dt><dd>${escapeHtml(item.target)}</dd>
          <dt>시행</dt><dd>${escapeHtml(item.effective)}</dd>
        </dl>
        ${details ? `<ul>${details}</ul>` : ""}
        <p style="margin:0;">근거: ${sources}</p>
        ${href ? `<p style="margin:4px 0 0;"><a href="${escapeHtml(href)}">${escapeHtml(item.calc.label)} →</a></p>` : ""}
      </li>`;
}

export function buildChanges2027Html(route) {
  if (route !== CHANGES_2027_META.path) return null;

  const sections = CHANGE_AREAS.map((area) => {
    const items = CHANGES_2027.filter((item) => item.area === area.id);
    if (!items.length) return "";
    return `
    <section ${MIRROR} id="area-${area.id}" style="margin:24px 0;">
      <h2 style="font-size:20px;margin:0 0 12px;">${escapeHtml(area.label)}</h2>
      <ul style="list-style:none;padding:0;margin:0;">${items.map(renderItem).join("")}
      </ul>
    </section>`;
  }).join("");

  const faqs = CHANGES_2027_FAQS.map(
    (faq) => `<h3 style="font-size:16px;margin:12px 0 4px;">${escapeHtml(faq.q)}</h3><p style="margin:0;">${escapeHtml(faq.a)}</p>`,
  ).join("");

  return `
    <article data-seo-prerender style="max-width:var(--sh-container-frame, 72rem);margin:0 auto;padding:24px var(--sh-container-gutter, 16px);box-sizing:border-box;line-height:1.7;">
      <h1 style="font-size:28px;line-height:1.3;margin:0 0 8px;">${escapeHtml(CHANGES_2027_META.heading)}</h1>
      <p ${MIRROR} style="margin:0 0 4px;">${escapeHtml(CHANGES_2027_META.intro)}</p>
      <p ${MIRROR} style="margin:0;">${escapeHtml(changesStatusSummary())}</p>${sections}
      <section ${MIRROR} style="margin:24px 0;">
        <h2 style="font-size:20px;margin:0 0 8px;">자주 묻는 질문</h2>${faqs}
      </section>
    </article>`;
}

export function buildChanges2027Meta(siteUrl, buildBreadcrumb) {
  const canonical = `${siteUrl}${CHANGES_2027_META.path}`;
  return {
    title: CHANGES_2027_META.title,
    description: CHANGES_2027_META.description,
    canonical,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: CHANGES_2027_META.heading,
        description: CHANGES_2027_META.description,
        url: canonical,
        inLanguage: "ko",
        dateModified: CHANGES_2027_VERIFIED_AT,
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: CHANGES_2027_FAQS.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: { "@type": "Answer", text: faq.a },
        })),
      },
    ],
    breadcrumb: buildBreadcrumb([{ name: "홈", url: siteUrl }, { name: CHANGES_2027_META.heading }]),
  };
}
