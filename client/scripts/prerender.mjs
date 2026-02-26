// 빌드 후 라우트별 SEO HTML 생성
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { SEO_ROUTES } from "./seo-routes.mjs";

const DIST_DIR = resolve(import.meta.dirname, "../dist");
const INDEX_HTML = resolve(DIST_DIR, "index.html");
const SITE_URL = "https://finance.shakilabs.com";
const SALARY_ROUTE_RE = /^\/salary\/(\d+)$/;
const INSURANCE_ROUTE_RE = /^\/insurance\/(\d+)$/;
const COMPARE_ROUTE_RE = /^\/compare\/(\d+)-vs-(\d+)$/;
const QUIT_ROUTE_RE = /^\/quit\/(\d+)years$/;

if (!existsSync(INDEX_HTML)) {
  console.warn("[prerender] dist/index.html not found. Skipping prerender.");
  process.exit(0);
}

const template = readFileSync(INDEX_HTML, "utf-8");

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function toSafeJson(value) {
  return JSON.stringify(value).replace(/<\/?script/gi, (matched) =>
    matched.replace("</", "<\\/")
  );
}

function formatManWon(manWon) {
  if (manWon >= 10000) return `${(manWon / 10000).toLocaleString("ko-KR")}억`;
  return `${manWon.toLocaleString("ko-KR")}만`;
}

function formatWon(value) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

function readSalaryManWon(route) {
  const matched = route.match(SALARY_ROUTE_RE);
  if (!matched) return null;
  const parsed = Number.parseInt(matched[1], 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function readInsuranceFee(route) {
  const matched = route.match(INSURANCE_ROUTE_RE);
  if (!matched) return null;
  const parsed = Number.parseInt(matched[1], 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function readComparePair(route) {
  const matched = route.match(COMPARE_ROUTE_RE);
  if (!matched) return null;

  const a = Number.parseInt(matched[1], 10);
  const b = Number.parseInt(matched[2], 10);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) {
    return null;
  }

  return { a, b };
}

function readQuitYears(route) {
  const matched = route.match(QUIT_ROUTE_RE);
  if (!matched) return null;
  const years = Number.parseInt(matched[1], 10);
  if (!Number.isFinite(years) || years <= 0) return null;
  return years;
}

// --- Breadcrumb 빌더 ---
function buildBreadcrumb(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => {
      const entry = { "@type": "ListItem", position: i + 1, name: item.name };
      // 마지막 항목에는 item(URL) 생략 (현재 페이지)
      if (item.url) entry.item = item.url;
      return entry;
    }),
  };
}

function buildMeta(route) {
  if (route === "/privacy") {
    const title = "개인정보처리방침 | finance.shakilabs.com";
    const description = "finance.shakilabs.com 서비스의 개인정보 처리 원칙을 안내합니다.";
    const canonical = `${SITE_URL}/privacy`;
    return {
      title,
      description,
      canonical,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: title,
        description,
        url: canonical,
        inLanguage: "ko",
      },
      breadcrumb: buildBreadcrumb([
        { name: "홈", url: SITE_URL },
        { name: "개인정보처리방침" },
      ]),
    };
  }

  if (route === "/about") {
    const title = "서비스 소개 | 2026 연봉·건보료 계산기";
    const description = "finance.shakilabs.com 서비스 목적과 계산 기준을 소개합니다.";
    const canonical = `${SITE_URL}/about`;
    return {
      title,
      description,
      canonical,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "AboutPage",
        name: title,
        description,
        url: canonical,
        inLanguage: "ko",
      },
      breadcrumb: buildBreadcrumb([
        { name: "홈", url: SITE_URL },
        { name: "서비스 소개" },
      ]),
    };
  }

  const insuranceFee = readInsuranceFee(route);
  if (insuranceFee !== null) {
    const feeManWon = Math.round(insuranceFee / 10000);
    const taxableMonthly = Math.floor(insuranceFee / 0.03595);
    const estimatedAnnual = (taxableMonthly + 200_000) * 12;
    const estimatedManWon = Math.round(estimatedAnnual / 10_000);

    const title = `건보료 ${feeManWon}만원이면 연봉 약 ${estimatedManWon.toLocaleString("ko-KR")}만원 | 2026 기준`;
    const description = `월 건강보험료 ${formatWon(insuranceFee)} 기준 추정 연봉은 약 ${estimatedManWon.toLocaleString("ko-KR")}만원입니다. 4대보험과 실수령액을 함께 확인하세요.`;
    const canonical = `${SITE_URL}/insurance/${insuranceFee}`;

    return {
      title,
      description,
      canonical,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: `건보료 ${feeManWon}만원이면 연봉이 얼마인가요?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `2026년 기준 추정 연봉은 약 ${estimatedManWon.toLocaleString("ko-KR")}만원입니다.`,
            },
          },
          {
            "@type": "Question",
            name: `건보료 ${feeManWon}만원이면 월 실수령액은 얼마인가요?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: "부양가족 수와 비과세액에 따라 달라집니다. 계산기에서 조건을 입력해 즉시 확인할 수 있습니다.",
            },
          },
          {
            "@type": "Question",
            name: "건강보험료율은 얼마인가요?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "2026년 건강보험료율은 7.19%이며 근로자와 사업주가 각 3.595%씩 부담합니다.",
            },
          },
        ],
      },
      breadcrumb: buildBreadcrumb([
        { name: "홈", url: SITE_URL },
        { name: "건보료 역산", url: `${SITE_URL}/insurance` },
        { name: `건보료 ${feeManWon}만원` },
      ]),
    };
  }

  const salaryManWon = readSalaryManWon(route);
  if (salaryManWon !== null) {
    const title = `연봉 ${formatManWon(salaryManWon)}원 실수령액 · 2026 4대보험 계산기`;
    const description = `연봉 ${formatManWon(salaryManWon)}원 기준 4대보험, 소득세, 지방소득세 공제 구조를 확인하고 월 실수령액을 계산해보세요.`;
    const canonical = `${SITE_URL}/salary/${salaryManWon}`;

    return {
      title,
      description,
      canonical,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: `연봉 ${formatManWon(salaryManWon)}원의 월 실수령액은 얼마인가요?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: "부양가족 수와 비과세액에 따라 달라집니다. 계산기에서 조건을 입력해 즉시 확인할 수 있습니다.",
            },
          },
          {
            "@type": "Question",
            name: `연봉 ${formatManWon(salaryManWon)}원에서 4대보험은 얼마나 공제되나요?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: "국민연금, 건강보험, 장기요양보험, 고용보험이 공제됩니다. 계산기에서 항목별 금액을 확인할 수 있습니다.",
            },
          },
          {
            "@type": "Question",
            name: `연봉 ${formatManWon(salaryManWon)}원의 소득세는 얼마인가요?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: "소득세는 부양가족 수에 따라 달라지며, 지방소득세(소득세의 10%)가 추가로 공제됩니다.",
            },
          },
        ],
      },
      breadcrumb: buildBreadcrumb([
        { name: "홈", url: SITE_URL },
        { name: "연봉 계산기", url: `${SITE_URL}/salary` },
        { name: `연봉 ${formatManWon(salaryManWon)}원` },
      ]),
    };
  }

  const comparePair = readComparePair(route);
  if (comparePair) {
    const aLabel = comparePair.a.toLocaleString("ko-KR");
    const bLabel = comparePair.b.toLocaleString("ko-KR");
    const title = `연봉 ${aLabel} vs ${bLabel} 이직 비교 | 실수령 차이`;
    const description = `연봉 ${aLabel}만원에서 ${bLabel}만원 이직 시 실수령 차이를 비교합니다.`;
    const canonical = `${SITE_URL}/compare/${comparePair.a}-vs-${comparePair.b}`;

    return {
      title,
      description,
      canonical,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: `연봉 ${aLabel}에서 ${bLabel}로 이직하면 실수령이 얼마나 늘어나나요?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: "부양가족 수, 비과세, 복지포인트, 성과급 조건에 따라 달라집니다. 비교기에서 즉시 확인할 수 있습니다.",
            },
          },
          {
            "@type": "Question",
            name: "연봉이 올라도 실수령 차이가 적은 이유는?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "연봉이 오르면 소득세 구간이 높아지고 4대보험 부담도 늘어나 실수령 증가분은 연봉 증가분보다 작습니다.",
            },
          },
        ],
      },
      breadcrumb: buildBreadcrumb([
        { name: "홈", url: SITE_URL },
        { name: "이직 비교", url: `${SITE_URL}/compare` },
        { name: `${aLabel} vs ${bLabel}` },
      ]),
    };
  }

  const quitYears = readQuitYears(route);
  if (quitYears !== null) {
    const title = `${quitYears}년 근속 퇴사 시뮬레이션 | 퇴직금·실업급여 계산`;
    const description = `${quitYears}년 근속 기준 퇴직금, 실업급여, 퇴사 후 월 고정비와 생존기간을 계산합니다.`;
    const canonical = `${SITE_URL}/quit/${quitYears}years`;

    return {
      title,
      description,
      canonical,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: `${quitYears}년 근속 후 퇴사하면 얼마를 받을 수 있나요?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: "퇴직금, 실업급여, 미사용 연차수당, 마지막 월급을 합산해 시뮬레이션으로 확인할 수 있습니다.",
            },
          },
          {
            "@type": "Question",
            name: `${quitYears}년 근속 퇴직금은 어떻게 계산하나요?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: "퇴직금은 1일 평균임금 × 30일 × 근속연수로 계산됩니다. 평균임금에는 기본급, 상여금, 수당이 포함됩니다.",
            },
          },
          {
            "@type": "Question",
            name: "실업급여 수급 조건은?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "비자발적 퇴사, 180일 이상 피보험단위기간, 구직활동 의사가 있어야 합니다. 자발적 퇴사도 정당한 사유가 있으면 수급 가능합니다.",
            },
          },
        ],
      },
      breadcrumb: buildBreadcrumb([
        { name: "홈", url: SITE_URL },
        { name: "퇴사 시뮬레이터", url: `${SITE_URL}/quit` },
        { name: `${quitYears}년 근속` },
      ]),
    };
  }

  // --- 랜딩 페이지 ---
  if (route === "/insurance" || route === "/") {
    const title = "2026 건보료로 연봉 역산 | 건강보험료 연봉 계산기";
    const description = "건보료를 입력하면 추정 연봉과 실수령액을 알려드립니다. 2026년 건강보험 7.19% 기준.";
    const canonical = `${SITE_URL}/insurance`;

    return {
      title,
      description,
      canonical,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "finance.shakilabs.com",
          url: SITE_URL,
          description: "건보료 역산, 연봉 실수령액 계산, 이직 비교, 퇴사 시뮬레이션",
          inLanguage: "ko",
          potentialAction: {
            "@type": "SearchAction",
            target: `${SITE_URL}/salary/{salary_amount}`,
            "query-input": "required name=salary_amount",
          },
        },
        {
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "2026 건보료 역산 계산기",
          url: canonical,
          applicationCategory: "FinanceApplication",
          operatingSystem: "Any",
          browserRequirements: "Requires JavaScript",
          inLanguage: "ko",
          offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
        },
      ],
      breadcrumb: buildBreadcrumb([
        { name: "홈", url: SITE_URL },
        { name: "건보료 역산" },
      ]),
    };
  }

  if (route === "/salary") {
    const title = "2026 연봉 실수령액 계산기 | 4대보험 + 소득세 자동 계산";
    const description = "연봉을 입력하면 4대보험, 소득세를 자동 계산해 월 실수령액을 알려드립니다.";
    const canonical = `${SITE_URL}/salary`;
    return {
      title,
      description,
      canonical,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "2026 연봉 실수령액 계산기",
        url: canonical,
        applicationCategory: "FinanceApplication",
        inLanguage: "ko",
        offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
      },
      breadcrumb: buildBreadcrumb([
        { name: "홈", url: SITE_URL },
        { name: "연봉 계산기" },
      ]),
    };
  }

  if (route === "/compare") {
    const title = "이직 연봉 비교기 | A사 vs B사 실수령 차이 계산";
    const description = "두 회사의 연봉, 비과세, 복지, 성과급을 입력해 실수령 차이를 비교합니다.";
    const canonical = `${SITE_URL}/compare`;
    return {
      title,
      description,
      canonical,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "이직 연봉 비교기",
        url: canonical,
        applicationCategory: "FinanceApplication",
        inLanguage: "ko",
        offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
      },
      breadcrumb: buildBreadcrumb([
        { name: "홈", url: SITE_URL },
        { name: "이직 비교" },
      ]),
    };
  }

  if (route === "/quit") {
    const title = "퇴사 시뮬레이터 | 퇴직금 + 실업급여 + 생존 계산";
    const description = "퇴직금, 실업급여, 퇴사 후 월 고정비를 한번에 계산해 버틸 수 있는 기간을 확인합니다.";
    const canonical = `${SITE_URL}/quit`;
    return {
      title,
      description,
      canonical,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "퇴사 시뮬레이터",
        url: canonical,
        applicationCategory: "FinanceApplication",
        inLanguage: "ko",
        offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
      },
      breadcrumb: buildBreadcrumb([
        { name: "홈", url: SITE_URL },
        { name: "퇴사 시뮬레이터" },
      ]),
    };
  }

  // fallback
  const title = "2026 연봉·건보료·4대보험 계산기";
  const description = "건보료 역산, 실수령액 계산, 이직 비교, 퇴사 시뮬레이션을 한곳에서 제공합니다.";
  const canonical = `${SITE_URL}${route}`;

  return {
    title,
    description,
    canonical,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: title,
      description,
      url: canonical,
      inLanguage: "ko",
    },
    breadcrumb: buildBreadcrumb([
      { name: "홈", url: SITE_URL },
      { name: title },
    ]),
  };
}

function buildPrerenderSection(route, meta) {
  const insuranceFee = readInsuranceFee(route);
  if (insuranceFee !== null) {
    const taxableMonthly = Math.floor(insuranceFee / 0.03595);
    const estimatedAnnual = (taxableMonthly + 200_000) * 12;

    return `
    <section data-seo-prerender style="max-width:920px;margin:0 auto;padding:20px 16px;line-height:1.6;">
      <h1 style="font-size:28px;line-height:1.3;margin:0 0 12px;">건보료 ${Math.round(insuranceFee / 10000)}만원이면 연봉 얼마?</h1>
      <p style="margin:0 0 10px;">월 건강보험료 ${formatWon(insuranceFee)} 기준 추정 연봉은 약 ${formatWon(estimatedAnnual)}입니다.</p>
      <p style="margin:0;"><a href="/insurance">건보료 역산 계산기 열기</a></p>
    </section>`;
  }

  const salaryManWon = readSalaryManWon(route);
  if (salaryManWon !== null) {
    return `
    <section data-seo-prerender style="max-width:920px;margin:0 auto;padding:20px 16px;line-height:1.6;">
      <h1 style="font-size:28px;line-height:1.3;margin:0 0 12px;">연봉 ${formatManWon(salaryManWon)}원 실수령액 계산</h1>
      <p style="margin:0 0 10px;">2026년 기준으로 4대보험, 소득세, 지방소득세를 반영해 월 실수령액을 계산할 수 있습니다.</p>
      <p style="margin:0;"><a href="/salary">실수령액 계산기 열기</a></p>
    </section>`;
  }

  const comparePair = readComparePair(route);
  if (comparePair) {
    return `
    <section data-seo-prerender style="max-width:920px;margin:0 auto;padding:20px 16px;line-height:1.6;">
      <h1 style="font-size:28px;line-height:1.3;margin:0 0 12px;">연봉 ${comparePair.a.toLocaleString("ko-KR")} vs ${comparePair.b.toLocaleString("ko-KR")} 이직 비교</h1>
      <p style="margin:0 0 10px;">두 회사의 연봉/복지 조건을 넣으면 월 실수령 및 실질 소득 차이를 확인할 수 있습니다.</p>
      <p style="margin:0;"><a href="/compare">이직 연봉 비교기 열기</a></p>
    </section>`;
  }

  const quitYears = readQuitYears(route);
  if (quitYears !== null) {
    return `
    <section data-seo-prerender style="max-width:920px;margin:0 auto;padding:20px 16px;line-height:1.6;">
      <h1 style="font-size:28px;line-height:1.3;margin:0 0 12px;">${quitYears}년 근속 퇴사 시뮬레이션</h1>
      <p style="margin:0 0 10px;">퇴직금, 실업급여, 월 고정비를 계산해 퇴사 후 생존기간을 확인할 수 있습니다.</p>
      <p style="margin:0;"><a href="/quit">퇴사 시뮬레이터 열기</a></p>
    </section>`;
  }

  return `
    <section data-seo-prerender style="max-width:920px;margin:0 auto;padding:20px 16px;line-height:1.6;">
      <h1 style="font-size:28px;line-height:1.3;margin:0 0 12px;">${meta.title}</h1>
      <p style="margin:0 0 10px;">${meta.description}</p>
      <ul style="margin:0;padding-left:20px;">
        <li><a href="/insurance">건보료 역산 계산기</a></li>
        <li><a href="/salary">연봉 실수령액 계산기</a></li>
        <li><a href="/compare">이직 연봉 비교기</a></li>
        <li><a href="/quit">퇴사 시뮬레이터</a></li>
      </ul>
    </section>`;
}

function replaceTag(html, pattern, next) {
  if (pattern.test(html)) {
    return html.replace(pattern, next);
  }
  return html;
}

function applyMeta(html, route, meta) {
  const escapedTitle = escapeAttr(meta.title);
  const escapedDescription = escapeAttr(meta.description);
  const escapedCanonical = escapeAttr(meta.canonical);
  const escapedOgImage = escapeAttr(`${SITE_URL}/og-image.png`);

  let output = html;
  output = replaceTag(output, /<title>[\s\S]*?<\/title>/i, `<title>${escapedTitle}</title>`);
  output = replaceTag(output, /<meta name="description" content="[^"]*"\s*\/?>/i, `<meta name="description" content="${escapedDescription}" />`);
  output = replaceTag(output, /<link rel="canonical" href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${escapedCanonical}" />`);
  output = replaceTag(output, /<meta property="og:title" content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${escapedTitle}" />`);
  output = replaceTag(output, /<meta property="og:description" content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${escapedDescription}" />`);
  output = replaceTag(output, /<meta property="og:url" content="[^"]*"\s*\/?>/i, `<meta property="og:url" content="${escapedCanonical}" />`);
  output = replaceTag(output, /<meta property="og:image" content="[^"]*"\s*\/?>/i, `<meta property="og:image" content="${escapedOgImage}" />`);
  output = replaceTag(output, /<meta name="twitter:title" content="[^"]*"\s*\/?>/i, `<meta name="twitter:title" content="${escapedTitle}" />`);
  output = replaceTag(output, /<meta name="twitter:description" content="[^"]*"\s*\/?>/i, `<meta name="twitter:description" content="${escapedDescription}" />`);
  output = replaceTag(output, /<meta name="twitter:image" content="[^"]*"\s*\/?>/i, `<meta name="twitter:image" content="${escapedOgImage}" />`);

  // hreflang 교체 (index.html의 기본값을 라우트별 canonical로 교체)
  output = output.replace(
    /<link rel="alternate" hreflang="ko" href="[^"]*"\s*\/?>/i,
    `<link rel="alternate" hreflang="ko" href="${escapedCanonical}" />`
  );
  output = output.replace(
    /<link rel="alternate" hreflang="x-default" href="[^"]*"\s*\/?>/i,
    `<link rel="alternate" hreflang="x-default" href="${escapedCanonical}" />`
  );

  // JSON-LD: jsonLd + breadcrumb를 배열로 병합
  const jsonLdArray = [meta.jsonLd, meta.breadcrumb].flat().filter(Boolean);
  const jsonLdTag = `    <script type="application/ld+json" data-seo-prerender="jsonld">${toSafeJson(jsonLdArray)}</script>`;
  output = output.replace(/\n?\s*<script type="application\/ld\+json" data-seo-prerender="jsonld">[\s\S]*?<\/script>/i, "");
  output = output.replace("</head>", `${jsonLdTag}\n  </head>`);

  const prerenderSection = buildPrerenderSection(route, meta);
  output = output.replace(/\n?\s*<section data-seo-prerender[\s\S]*?<\/section>/i, "");
  if (output.includes('<div id="app"></div>')) {
    output = output.replace('<div id="app"></div>', `<div id="app"></div>${prerenderSection}`);
  } else {
    output = output.replace("</body>", `${prerenderSection}\n  </body>`);
  }

  return output;
}

for (const route of SEO_ROUTES) {
  const filePath = route === "/" ? INDEX_HTML : resolve(DIST_DIR, route.slice(1), "index.html");
  const dir = dirname(filePath);

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const meta = buildMeta(route);
  const html = applyMeta(template, route, meta);
  writeFileSync(filePath, html, "utf-8");
  console.log(`[prerender] ${route} -> ${filePath}`);
}

console.log(`[prerender] Done. ${SEO_ROUTES.length} routes processed.`);
