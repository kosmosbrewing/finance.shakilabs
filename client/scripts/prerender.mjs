// 빌드 후 라우트별 SEO HTML 생성
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { SEO_ROUTES, canonicalPathFor } from "./seo-routes.mjs";
import { buildPrerenderHeader, buildPrerenderFooter } from "./prerender-layout.mjs";
import { buildRichContent } from "./prerender-content.mjs";
import {
  buildPrerenderGuide,
  getPrerenderGuide,
  PRERENDER_GUIDE_ROUTES,
} from "./prerender-guides.mjs";
import {
  buildScenarioChainHtml,
  getScenarioChain,
} from "./scenario-chains.mjs";
import { appendGuideDeepDive } from "./guide-content.mjs";
import { FAQ_SOURCE_FILES, ROUTE_FAQS } from "./faq-data.mjs";
import { HOME_ITEM_LIST } from "./home-content.mjs";

const DIST_DIR = resolve(import.meta.dirname, "../dist");
const INDEX_HTML = resolve(DIST_DIR, "index.html");
const SITE_URL = "https://shakilabs.com/finance";
const SALARY_ROUTE_RE = /^\/salary\/(\d+)$/;
const INSURANCE_ROUTE_RE = /^\/insurance\/(\d+)$/;
const COMPREHENSIVE_TAX_ROUTE_RE = /^\/comprehensive-tax\/(\d+)$/;
const FREELANCER_ROUTE_RE = /^\/freelancer\/(\d+)$/;
const COMPARE_ROUTE_RE = /^\/compare\/(\d+)-vs-(\d+)$/;
const QUIT_ROUTE_RE = /^\/quit\/(\d+)years$/;
const WITHHOLDING_ROUTE_RE = /^\/withholding\/(\d+)$/;
const YEAR_END_ROUTE_RE = /^\/year-end-settlement\/(\d+)$/;
const PARENTAL_LEAVE_ROUTE_RE = /^\/parental-leave\/(\d+)$/;
const UNEMPLOYMENT_ROUTE_RE = /^\/unemployment\/(\d+)$/;
const REGIONAL_HEALTH_ROUTE_RE = /^\/regional-health\/(\d+)$/;
const WEEKLY_HOLIDAY_PAY_ROUTE_RE = /^\/weekly-holiday-pay\/(\d+)$/;
const WAGE_CONVERTER_ROUTE_RE = /^\/wage-converter\/(\d+)$/;
const SEVERANCE_PAY_ROUTE_RE = /^\/severance-pay\/(\d+)$/;
const UNPAID_WAGE_ROUTE_RE = /^\/unpaid-wage\/(\d+)$/;
// 숫자 프리셋 관례와 달리 가구유형 문자열 파라미터를 쓴다
const EITC_ROUTE_RE = /^\/eitc\/(single|single-income|double-income)$/;
const EITC_HOUSEHOLD_LABELS = {
  "single": "단독 가구",
  "single-income": "홑벌이 가구",
  "double-income": "맞벌이 가구",
};

if (!existsSync(INDEX_HTML)) {
  console.warn("[prerender] dist/index.html not found. Skipping prerender.");
  process.exit(0);
}

const template = readFileSync(INDEX_HTML, "utf-8");

// --- 랜딩 라우트 FAQ (faq-data.mjs 미러) ---
// 화면(BenefitFaqPanel) 문구와 스키마 문구가 달라지면 안 되므로,
// 미러 텍스트가 원본 소스에 그대로 존재하는지 빌드 시점에 검증한다.
function verifyFaqMirror() {
  const sourceText = FAQ_SOURCE_FILES.map((path) =>
    readFileSync(resolve(import.meta.dirname, "..", path), "utf-8")
  ).join("\n");

  for (const [route, items] of Object.entries(ROUTE_FAQS)) {
    for (const item of items) {
      if (!sourceText.includes(item.question) || !sourceText.includes(item.answer)) {
        throw new Error(
          `[prerender] FAQ mirror drift for ${route}: "${item.question}" — update scripts/faq-data.mjs to match src data.`
        );
      }
    }
  }
}
verifyFaqMirror();

// src/lib/faqSeo.ts buildFaqJsonLd 미러 — 동일한 FAQPage 형식 유지
function buildFaqJsonLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

// 스키마와 동일한 Q/A를 정적 본문에도 노출 (prerender-content.mjs FAQ 섹션과 같은 스타일)
function buildFaqSectionHtml(items) {
  const qaHtml = items
    .map(
      (item) => `
      <h3 style="font-size:16px;line-height:1.4;margin:18px 0 6px;color:hsl(var(--foreground));">${item.question}</h3>
      <p style="margin:0 0 10px;">${item.answer}</p>`
    )
    .join("");

  return `
      <h2 style="font-size:20px;line-height:1.35;margin:28px 0 10px;padding-bottom:6px;border-bottom:2px solid hsl(var(--highlight) / 0.3);color:hsl(var(--foreground));">자주 묻는 질문 (FAQ)</h2>${qaHtml}`;
}

// 본문 마지막 닫는 태그 앞에 FAQ 섹션 삽입 (guide article·fallback section 공용)
function appendFaqSection(contentHtml, items) {
  const faqHtml = buildFaqSectionHtml(items);
  const closingTag = /<\/(article|section)>\s*$/i;
  if (!closingTag.test(contentHtml)) {
    throw new Error("[prerender] Cannot append FAQ section: unexpected content markup.");
  }
  return contentHtml.replace(closingTag, (matched) => `${faqHtml}\n    ${matched}`);
}

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

function readComprehensiveTaxManWon(route) {
  const matched = route.match(COMPREHENSIVE_TAX_ROUTE_RE);
  if (!matched) return null;
  const parsed = Number.parseInt(matched[1], 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function readFreelancerManWon(route) {
  const matched = route.match(FREELANCER_ROUTE_RE);
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

function readWithholdingAmount(route) {
  const matched = route.match(WITHHOLDING_ROUTE_RE);
  if (!matched) return null;
  const parsed = Number.parseInt(matched[1], 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function readParentalLeaveManWon(route) {
  const matched = route.match(PARENTAL_LEAVE_ROUTE_RE);
  if (!matched) return null;
  const parsed = Number.parseInt(matched[1], 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function readUnemploymentManWon(route) {
  const matched = route.match(UNEMPLOYMENT_ROUTE_RE);
  if (!matched) return null;
  const parsed = Number.parseInt(matched[1], 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function readEitcHousehold(route) {
  const matched = route.match(EITC_ROUTE_RE);
  return matched ? matched[1] : null;
}

function readUnpaidWageManWon(route) {
  const matched = route.match(UNPAID_WAGE_ROUTE_RE);
  if (!matched) return null;
  const parsed = Number.parseInt(matched[1], 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function readRegionalHealthManWon(route) {
  const matched = route.match(REGIONAL_HEALTH_ROUTE_RE);
  if (!matched) return null;
  const parsed = Number.parseInt(matched[1], 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function readYearEndManWon(route) {
  const matched = route.match(YEAR_END_ROUTE_RE);
  if (!matched) return null;
  const parsed = Number.parseInt(matched[1], 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function readWeeklyHolidayPayAmount(route) {
  const matched = route.match(WEEKLY_HOLIDAY_PAY_ROUTE_RE);
  if (!matched) return null;
  const parsed = Number.parseInt(matched[1], 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function readWageConverterHourly(route) {
  const matched = route.match(WAGE_CONVERTER_ROUTE_RE);
  if (!matched) return null;
  const parsed = Number.parseInt(matched[1], 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function readSeverancePayYears(route) {
  const matched = route.match(SEVERANCE_PAY_ROUTE_RE);
  if (!matched) return null;
  const parsed = Number.parseInt(matched[1], 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
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

// Home ItemList entries come from the same catalog the hub renders (scripts/home-content.mjs),
// so the schema, the static body and src/views/HomeView.vue can never drift apart.

function buildMeta(route) {
  if (route === "/terms") {
    const title = "이용약관 | 2026 연봉·건보료 계산기";
    const description = "shakilabs.com/finance 서비스 이용약관을 안내합니다.";
    const canonical = `${SITE_URL}/terms`;
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
        { name: "이용약관" },
      ]),
    };
  }

  if (route === "/privacy") {
    const title = "개인정보처리방침 | 연봉 실수령액 계산기";
    const description = "shakilabs.com/finance 서비스의 개인정보 처리 원칙을 안내합니다.";
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
    const title = "서비스 소개 | 2026 연봉·세금 계산기";
    const description = "연봉 실수령액, 건보료 계산, 이직 비교, 퇴사 시뮬레이션을 제공하는 무료 계산기. 2026 최신 세율 반영.";
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

  if (route === "/all") {
    const title = "2026 세금·연봉·수당 계산기 모음 | 26개 계산기";
    const description = "연봉 실수령액, 종합소득세, 연말정산, 퇴직금, 실업급여, 주휴수당 등 26개 계산기를 한곳에서 이용하세요. 2026년 기준 반영.";
    const canonical = `${SITE_URL}/all`;
    return {
      title,
      description,
      canonical,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: title,
        description,
        url: canonical,
        inLanguage: "ko",
      },
      breadcrumb: buildBreadcrumb([
        { name: "홈", url: SITE_URL },
        { name: "전체 계산기" },
      ]),
    };
  }

  const unemploymentManWon = readUnemploymentManWon(route);
  if (unemploymentManWon !== null) {
    const title = `월급 ${formatManWon(unemploymentManWon)} 실업급여 계산기 | 2026 구직급여`;
    const description = `월급 ${formatManWon(unemploymentManWon)}원 기준 실업급여 일 수급액과 총 수급액을 계산합니다.`;
    const canonical = `${SITE_URL}/unemployment/${unemploymentManWon}`;
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
            name: `월급 ${formatManWon(unemploymentManWon)}이면 실업급여가 얼마인가요?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: "나이와 고용보험 가입기간에 따라 수급액과 수급기간이 달라집니다. 계산기에서 확인하세요.",
            },
          },
        ],
      },
      breadcrumb: buildBreadcrumb([
        { name: "홈", url: SITE_URL },
        { name: "실업급여 계산기", url: `${SITE_URL}/unemployment` },
        { name: `월급 ${formatManWon(unemploymentManWon)}` },
      ]),
    };
  }

  const eitcHousehold = readEitcHousehold(route);
  if (eitcHousehold !== null) {
    const householdLabel = EITC_HOUSEHOLD_LABELS[eitcHousehold];
    const title = `${householdLabel} 근로장려금 계산기 | 2026 지급액 조회`;
    const description = `${householdLabel} 기준 근로장려금 소득 구간별 지급액을 계산합니다. 재산 요건과 자녀장려금까지 확인하세요.`;
    const canonical = `${SITE_URL}/eitc/${eitcHousehold}`;
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
            name: `${householdLabel}는 근로장려금을 최대 얼마 받나요?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: "가구 유형별 최대 지급액은 단독 165만원, 홑벌이 285만원, 맞벌이 330만원이며 소득·재산 요건에 따라 달라집니다.",
            },
          },
        ],
      },
      breadcrumb: buildBreadcrumb([
        { name: "홈", url: SITE_URL },
        { name: "근로장려금 계산기", url: `${SITE_URL}/eitc` },
        { name: householdLabel },
      ]),
    };
  }

  const unpaidWageManWon = readUnpaidWageManWon(route);
  if (unpaidWageManWon !== null) {
    const title = `체불임금 ${formatManWon(unpaidWageManWon)} 지연이자 계산기 | 연 20% 기준`;
    const description = `밀린 임금 ${formatManWon(unpaidWageManWon)}원의 지연이자를 퇴직 후 연 20%, 민법 5%, 상법 6%, 소송촉진법 12% 단계별로 계산합니다.`;
    const canonical = `${SITE_URL}/unpaid-wage/${unpaidWageManWon}`;
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
            name: `체불임금 ${formatManWon(unpaidWageManWon)}원의 지연이자는 얼마인가요?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: "퇴직 후 14일이 지나면 근로기준법상 연 20% 지연이자가 적용됩니다. 지연 일수와 적용 단계별 금액은 계산기에서 확인하세요.",
            },
          },
        ],
      },
      breadcrumb: buildBreadcrumb([
        { name: "홈", url: SITE_URL },
        { name: "임금체불 지연이자 계산기", url: `${SITE_URL}/unpaid-wage` },
        { name: `체불액 ${formatManWon(unpaidWageManWon)}` },
      ]),
    };
  }

  const regionalHealthManWon = readRegionalHealthManWon(route);
  if (regionalHealthManWon !== null) {
    const title = `월급 ${formatManWon(regionalHealthManWon)} 지역가입자 건보료 | 퇴사 후 건강보험`;
    const description = `월급 ${formatManWon(regionalHealthManWon)}원 기준 퇴사 후 지역가입자 건보료와 임의계속가입을 비교합니다.`;
    const canonical = `${SITE_URL}/regional-health/${regionalHealthManWon}`;
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
            name: `월급 ${formatManWon(regionalHealthManWon)}이면 퇴사 후 건보료가 얼마인가요?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: "지역가입자, 임의계속가입, 피부양자 등록 세 가지 옵션을 비교해 가장 저렴한 방법을 찾을 수 있습니다.",
            },
          },
        ],
      },
      breadcrumb: buildBreadcrumb([
        { name: "홈", url: SITE_URL },
        { name: "지역가입자 건보료", url: `${SITE_URL}/regional-health` },
        { name: `월급 ${formatManWon(regionalHealthManWon)}` },
      ]),
    };
  }

  const weeklyHolidayPayAmount = readWeeklyHolidayPayAmount(route);
  if (weeklyHolidayPayAmount !== null) {
    const title = `시급 ${weeklyHolidayPayAmount.toLocaleString("ko-KR")}원 주휴수당 계산 | 2026`;
    const description = `시급 ${weeklyHolidayPayAmount.toLocaleString("ko-KR")}원 기준 주휴수당과 실질 시급을 계산합니다.`;
    const canonical = `${SITE_URL}/weekly-holiday-pay/${weeklyHolidayPayAmount}`;
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
            name: `시급 ${weeklyHolidayPayAmount.toLocaleString("ko-KR")}원이면 주휴수당이 얼마인가요?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: "주 근무시간에 따라 달라집니다. 계산기에서 확인하세요.",
            },
          },
        ],
      },
      breadcrumb: buildBreadcrumb([
        { name: "홈", url: SITE_URL },
        { name: "주휴수당 계산기", url: `${SITE_URL}/weekly-holiday-pay` },
        { name: `시급 ${weeklyHolidayPayAmount.toLocaleString("ko-KR")}원` },
      ]),
    };
  }

  const wageConverterHourly = readWageConverterHourly(route);
  if (wageConverterHourly !== null) {
    const title = `시급 ${wageConverterHourly.toLocaleString("ko-KR")}원 월급·연봉 환산 | 2026`;
    const description = `시급 ${wageConverterHourly.toLocaleString("ko-KR")}원을 월급·일급·연봉으로 환산합니다.`;
    const canonical = `${SITE_URL}/wage-converter/${wageConverterHourly}`;
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
            name: `시급 ${wageConverterHourly.toLocaleString("ko-KR")}원이면 월급이 얼마인가요?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: "주휴수당 포함 여부와 주 근무시간에 따라 달라집니다. 계산기에서 확인하세요.",
            },
          },
        ],
      },
      breadcrumb: buildBreadcrumb([
        { name: "홈", url: SITE_URL },
        { name: "시급 환산기", url: `${SITE_URL}/wage-converter` },
        { name: `시급 ${wageConverterHourly.toLocaleString("ko-KR")}원` },
      ]),
    };
  }

  const severancePayYears = readSeverancePayYears(route);
  if (severancePayYears !== null) {
    const title = `${severancePayYears}년 근속 퇴직금 계산 | 2026`;
    const description = `${severancePayYears}년 근속 기준 퇴직금과 퇴직소득세를 계산합니다.`;
    const canonical = `${SITE_URL}/severance-pay/${severancePayYears}`;
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
            name: `${severancePayYears}년 근속이면 퇴직금이 얼마인가요?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: "평균 월급에 따라 달라집니다. 계산기에서 확인하세요.",
            },
          },
        ],
      },
      breadcrumb: buildBreadcrumb([
        { name: "홈", url: SITE_URL },
        { name: "퇴직금 계산기", url: `${SITE_URL}/severance-pay` },
        { name: `${severancePayYears}년 근속` },
      ]),
    };
  }

  const parentalManWon = readParentalLeaveManWon(route);
  if (parentalManWon !== null) {
    const title = `통상임금 ${formatManWon(parentalManWon)} 육아휴직 급여 계산 | 2026`;
    const description = `통상임금 ${formatManWon(parentalManWon)}원 기준 육아휴직 월별 급여와 총 수령액을 계산합니다.`;
    const canonical = `${SITE_URL}/parental-leave/${parentalManWon}`;
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
            name: `통상임금 ${formatManWon(parentalManWon)}이면 육아휴직 급여가 얼마인가요?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: "일반, 6+6 부모육아휴직제, 한부모 특례에 따라 월별 상한액이 다릅니다. 계산기에서 확인하세요.",
            },
          },
        ],
      },
      breadcrumb: buildBreadcrumb([
        { name: "홈", url: SITE_URL },
        { name: "육아휴직 급여", url: `${SITE_URL}/parental-leave` },
        { name: `통상임금 ${formatManWon(parentalManWon)}` },
      ]),
    };
  }

  const yearEndManWon = readYearEndManWon(route);
  if (yearEndManWon !== null) {
    const title = `연봉 ${formatManWon(yearEndManWon)} 연말정산 환급액 계산 | 2026`;
    const description = `연봉 ${formatManWon(yearEndManWon)}원 기준 연말정산 예상 환급액과 세액공제 내역을 계산합니다.`;
    const canonical = `${SITE_URL}/year-end-settlement/${yearEndManWon}`;
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
            name: `연봉 ${formatManWon(yearEndManWon)}이면 연말정산 환급금이 얼마인가요?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: "신용카드, 의료비, 교육비, 연금저축, 월세 등 공제 항목에 따라 달라집니다. 계산기에서 항목을 입력해 확인하세요.",
            },
          },
        ],
      },
      breadcrumb: buildBreadcrumb([
        { name: "홈", url: SITE_URL },
        { name: "연말정산 계산기", url: `${SITE_URL}/year-end-settlement` },
        { name: `연봉 ${formatManWon(yearEndManWon)}` },
      ]),
    };
  }

  const withholdingAmount = readWithholdingAmount(route);
  if (withholdingAmount !== null) {
    const title = `월 소득세 ${formatWon(withholdingAmount)} → 연봉 계산기 | 2026`;
    const description = `월 소득세 ${formatWon(withholdingAmount)} 기준 추정 연봉과 실수령액을 계산합니다. 4대보험 포함 공제 상세 확인.`;
    const canonical = `${SITE_URL}/withholding/${withholdingAmount}`;

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
            name: `소득세 ${formatWon(withholdingAmount)}이면 연봉이 얼마인가요?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `2026년 기준 이진탐색 계산으로 추정 연봉을 즉시 계산할 수 있습니다.`,
            },
          },
          {
            "@type": "Question",
            name: `소득세 ${formatWon(withholdingAmount)}이면 월 실수령액은 얼마인가요?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: "부양가족 수와 비과세액에 따라 달라집니다. 계산기에서 조건을 입력해 즉시 확인할 수 있습니다.",
            },
          },
        ],
      },
      breadcrumb: buildBreadcrumb([
        { name: "홈", url: SITE_URL },
        { name: "원천세 계산", url: `${SITE_URL}/withholding` },
        { name: `소득세 ${formatWon(withholdingAmount)}` },
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
        { name: "건보료 계산", url: `${SITE_URL}/insurance` },
        { name: `건보료 ${feeManWon}만원` },
      ]),
    };
  }

  const salaryManWon = readSalaryManWon(route);
  if (salaryManWon !== null) {
    const title = `연봉 ${formatManWon(salaryManWon)} 실수령액 | 2026 월급 실수령 계산기`;
    const description = `2026년 연봉 ${formatManWon(salaryManWon)} 월 실수령액은 계산 결과를 기준으로 확인할 수 있습니다. 4대보험·소득세 공제 내역과 부양가족별 계산도 확인하세요.`;
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
            name: `연봉 ${formatManWon(salaryManWon)}의 월 실수령액은 얼마인가요?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: "부양가족 수와 비과세액에 따라 달라집니다. 계산기에서 조건을 입력해 즉시 확인할 수 있습니다.",
            },
          },
          {
            "@type": "Question",
            name: `연봉 ${formatManWon(salaryManWon)}에서 4대보험은 얼마나 공제되나요?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: "국민연금, 건강보험, 장기요양보험, 고용보험이 공제됩니다. 계산기에서 항목별 금액을 확인할 수 있습니다.",
            },
          },
          {
            "@type": "Question",
            name: `연봉 ${formatManWon(salaryManWon)}의 소득세는 얼마인가요?`,
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
        { name: `연봉 ${formatManWon(salaryManWon)}` },
      ]),
    };
  }

  const freelancerManWon = readFreelancerManWon(route);
  if (freelancerManWon !== null) {
    const title = `프리랜서 수입 ${formatManWon(freelancerManWon)} 세금 계산 | 2026 3.3% 종합소득세`;
    const description = `프리랜서 연수입 ${formatManWon(freelancerManWon)}원 기준 3.3% 원천징수 후 종합소득세를 계산합니다.`;
    const canonical = `${SITE_URL}/freelancer/${freelancerManWon}`;
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
            name: `프리랜서 수입 ${formatManWon(freelancerManWon)}이면 세금이 얼마인가요?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: "업종별 경비율과 부양가족 수에 따라 달라집니다. 계산기에서 확인하세요.",
            },
          },
        ],
      },
      breadcrumb: buildBreadcrumb([
        { name: "홈", url: SITE_URL },
        { name: "프리랜서 세금 계산기", url: `${SITE_URL}/freelancer` },
        { name: `수입 ${formatManWon(freelancerManWon)}` },
      ]),
    };
  }

  const comprehensiveTaxManWon = readComprehensiveTaxManWon(route);
  if (comprehensiveTaxManWon !== null) {
    const title = `종합소득 ${comprehensiveTaxManWon}만원 세금 계산 | 2026 종합소득세 계산기`;
    const description = `연수입 ${comprehensiveTaxManWon}만원 기준으로 사업소득·임대소득·기타소득을 합산해 종합소득세를 계산합니다.`;
    const canonical = `${SITE_URL}/comprehensive-tax/${comprehensiveTaxManWon}`;

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
            name: `연수입 ${comprehensiveTaxManWon}만원이면 종합소득세를 얼마나 내나요?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: "사업소득·임대소득·기타소득 비중, 경비율, 부양가족 수, 연금공제 반영 여부에 따라 달라집니다.",
            },
          },
          {
            "@type": "Question",
            name: "임대·기타소득은 분리과세와 종합과세 중 무엇이 유리한가요?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "분리과세 요건을 충족하면 비교 위젯에서 종합과세 대비 세액 차이를 확인할 수 있습니다.",
            },
          },
        ],
      },
      breadcrumb: buildBreadcrumb([
        { name: "홈", url: SITE_URL },
        { name: "종합소득세", url: `${SITE_URL}/comprehensive-tax` },
        { name: `${comprehensiveTaxManWon}만원` },
      ]),
    };
  }

  const comparePair = readComparePair(route);
  if (comparePair) {
    const aLabel = comparePair.a.toLocaleString("ko-KR");
    const bLabel = comparePair.b.toLocaleString("ko-KR");
    // 프리셋 8개가 같은 title을 쓰면 검색엔진이 중복 페이지로 본다. 금액을 넣어 고유하게 만든다.
    const title = `연봉 ${aLabel}만원 vs ${bLabel}만원 비교 | 이직 실수령 차이 2026`;
    const description = `연봉 ${aLabel}만원에서 ${bLabel}만원으로 이직하면 월 실수령 차이를 비교할 수 있습니다.`;
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
    const title = `${quitYears}년 근속 퇴사 계산기 | 퇴직금·실업급여·생존기간 2026`;
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
        { name: "퇴사 계산기", url: `${SITE_URL}/quit` },
        { name: `${quitYears}년 근속` },
      ]),
    };
  }

  // --- 앱 홈 ---
  // The home used to share the /insurance branch but was never listed in SEO_ROUTES,
  // so it shipped as an empty shell. It now owns its meta: the home is the app's
  // highest-authority entry point and must not reuse another route's title or body.
  if (route === "/") {
    const title = "2026 연봉 실수령액 계산기 | 건보료 계산·4대보험·종합소득세";
    const description =
      "2026년 최신 세율 반영. 연봉 실수령액, 건보료 연봉 계산, 종합소득세, 이직 비교, 퇴사 시뮬레이션을 무료로 계산하세요.";
    // vercel.json sets trailingSlash:false, so /finance/ 308s to /finance.
    // The canonical must point at the 200 URL, not the redirect.
    const canonical = SITE_URL;

    return {
      title,
      description,
      canonical,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "shakilabs.com/finance",
          url: SITE_URL,
          description: "건보료 계산, 연봉 실수령액 계산, 이직 비교, 퇴사 시뮬레이션",
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
          name: "2026 연봉 실수령액 계산기",
          url: canonical,
          applicationCategory: "FinanceApplication",
          operatingSystem: "Any",
          browserRequirements: "Requires JavaScript",
          inLanguage: "ko",
          offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
        },
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "2026 급여·세금 계산기 모음",
          itemListOrder: "https://schema.org/ItemListOrderAscending",
          numberOfItems: HOME_ITEM_LIST.length,
          itemListElement: HOME_ITEM_LIST.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            url: `${SITE_URL}${item.path}`,
          })),
        },
      ],
      breadcrumb: buildBreadcrumb([{ name: "홈" }]),
    };
  }

  // --- 랜딩 페이지 ---
  if (route === "/insurance") {
    const title = "2026 건강보험료로 연봉 계산기 | 4대보험";
    const description =
      "건강보험료를 입력하면 추정 연봉과 월 실수령액을 계산합니다. 2026 최신 요율 반영.";
    const canonical = `${SITE_URL}/insurance`;

    return {
      title,
      description,
      canonical,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "2026 건강보험료 연봉 계산기",
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
        { name: "건보료 계산" },
      ]),
    };
  }

  if (route === "/salary") {
    const title = "2026 연봉 실수령액 계산기 | 4대보험 + 소득세 자동 계산";
    const description = "2026년 연봉 실수령액을 즉시 계산하세요. 국민연금·건보료·소득세 공제 후 실제 통장에 들어오는 월급을 확인합니다.";
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

  if (route === "/freelancer") {
    const title = "2026 프리랜서 세금 계산기 | 3.3% 종합소득세";
    const description = "프리랜서·N잡러를 위한 세금 계산. 3.3% 원천징수 후 종합소득세 정산, 분리과세 비교까지 한 번에.";
    const canonical = `${SITE_URL}/freelancer`;
    return {
      title,
      description,
      canonical,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "프리랜서 세금 계산기",
        url: canonical,
        applicationCategory: "FinanceApplication",
        inLanguage: "ko",
        offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
      },
      breadcrumb: buildBreadcrumb([
        { name: "홈", url: SITE_URL },
        { name: "프리랜서 세금 계산기" },
      ]),
    };
  }

  if (route === "/comprehensive-tax") {
    const title = "2026 종합소득세 계산기 | 프리랜서·사업소득 세금";
    const description = "프리랜서·사업자·임대소득자를 위한 종합소득세 계산. 분리과세 비교까지 한 번에 확인하세요.";
    const canonical = `${SITE_URL}/comprehensive-tax`;
    return {
      title,
      description,
      canonical,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "종합소득세 계산기",
        url: canonical,
        applicationCategory: "FinanceApplication",
        inLanguage: "ko",
        offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
      },
      breadcrumb: buildBreadcrumb([
        { name: "홈", url: SITE_URL },
        { name: "종합소득세" },
      ]),
    };
  }

  if (route === "/compare") {
    const title = "이직 연봉 비교 계산기 | 실수령액 차이 비교 2026";
    const description = "연봉과 복지 조건을 입력해 4대보험·세금을 반영한 실수령 차이를 비교합니다.";
    const canonical = `${SITE_URL}/compare`;
    return {
      title,
      description,
      canonical,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "이직 연봉 비교 계산기",
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

  if (route === "/withholding") {
    const title = "원천세 계산기 | 소득세로 연봉 추정 2026";
    const description = "급여명세서 소득세를 입력하면 추정 연봉과 월 실수령액을 계산합니다. 2026 최신 세율 반영.";
    const canonical = `${SITE_URL}/withholding`;
    return {
      title,
      description,
      canonical,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "원천세 계산기",
        url: canonical,
        applicationCategory: "FinanceApplication",
        inLanguage: "ko",
        offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
      },
      breadcrumb: buildBreadcrumb([
        { name: "홈", url: SITE_URL },
        { name: "원천세 계산" },
      ]),
    };
  }

  if (route === "/parental-leave") {
    const title = "2026 육아휴직 급여 계산기 | 6+6 부모육아휴직제 반영";
    const description = "통상임금과 휴직 기간을 입력하면 월별 급여와 총 수령액을 계산합니다. 6+6 부모육아휴직제, 한부모 특례 반영.";
    const canonical = `${SITE_URL}/parental-leave`;
    return {
      title,
      description,
      canonical,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "육아휴직 급여 계산기",
        url: canonical,
        applicationCategory: "FinanceApplication",
        inLanguage: "ko",
        offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
      },
      breadcrumb: buildBreadcrumb([
        { name: "홈", url: SITE_URL },
        { name: "육아휴직 급여 계산기" },
      ]),
    };
  }

  if (route === "/year-end-settlement") {
    const title = "2026 연말정산 계산기 | 환급액·세액공제 시뮬레이터";
    const description = "연봉과 공제 항목을 입력하면 예상 환급액 또는 추가 납부액을 계산합니다. 신용카드, 연금, 의료비, 월세 세액공제 포함.";
    const canonical = `${SITE_URL}/year-end-settlement`;
    return {
      title,
      description,
      canonical,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "연말정산 계산기",
        url: canonical,
        applicationCategory: "FinanceApplication",
        inLanguage: "ko",
        offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
      },
      breadcrumb: buildBreadcrumb([
        { name: "홈", url: SITE_URL },
        { name: "연말정산 계산기" },
      ]),
    };
  }

  if (route === "/unemployment") {
    const title = "2026 실업급여 계산기 | 구직급여 수급액·수급기간";
    const description = "월급과 고용보험 가입기간을 입력하면 실업급여 일 수급액, 수급기간, 총 예상 수급액을 계산합니다.";
    const canonical = `${SITE_URL}/unemployment`;
    return {
      title,
      description,
      canonical,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "실업급여 계산기",
        url: canonical,
        applicationCategory: "FinanceApplication",
        inLanguage: "ko",
        offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
      },
      breadcrumb: buildBreadcrumb([
        { name: "홈", url: SITE_URL },
        { name: "실업급여 계산기" },
      ]),
    };
  }

  if (route === "/regional-health") {
    const title = "지역가입자 건강보험료 계산기 | 퇴사 후 건보 비교";
    const description = "퇴사 후 지역가입자 건보료, 임의계속가입, 피부양자 등록 세 가지 옵션을 비교합니다.";
    const canonical = `${SITE_URL}/regional-health`;
    return {
      title,
      description,
      canonical,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "지역가입자 건강보험료 계산기",
        url: canonical,
        applicationCategory: "FinanceApplication",
        inLanguage: "ko",
        offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
      },
      breadcrumb: buildBreadcrumb([
        { name: "홈", url: SITE_URL },
        { name: "지역가입자 건보료" },
      ]),
    };
  }

  if (route === "/weekly-holiday-pay") {
    const title = "2026 주휴수당 계산기 | 아르바이트 주휴수당·실질 시급";
    const description = "시급과 주 근무시간을 입력하면 주휴수당, 실질 시급, 예상 월급을 계산합니다. 2026 최저시급 반영.";
    const canonical = `${SITE_URL}/weekly-holiday-pay`;
    return {
      title,
      description,
      canonical,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "주휴수당 계산기",
        url: canonical,
        applicationCategory: "FinanceApplication",
        inLanguage: "ko",
        offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
      },
      breadcrumb: buildBreadcrumb([
        { name: "홈", url: SITE_URL },
        { name: "주휴수당 계산기" },
      ]),
    };
  }

  if (route === "/wage-converter") {
    const title = "2026 시급 월급 연봉 환산기 | 주휴수당 포함·미포함";
    const description = "시급↔월급↔연봉을 주휴수당 포함·미포함으로 양방향 환산합니다. 2026 최저시급 반영.";
    const canonical = `${SITE_URL}/wage-converter`;
    return {
      title,
      description,
      canonical,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "시급 월급 연봉 환산기",
        url: canonical,
        applicationCategory: "FinanceApplication",
        inLanguage: "ko",
        offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
      },
      breadcrumb: buildBreadcrumb([
        { name: "홈", url: SITE_URL },
        { name: "시급↔월급↔연봉 환산기" },
      ]),
    };
  }

  if (route === "/severance-pay") {
    const title = "2026 퇴직금 계산기 | 퇴직소득세·실수령 퇴직금";
    const description = "월급과 근속연수를 입력하면 퇴직금, 퇴직소득세, 실수령 퇴직금을 계산합니다.";
    const canonical = `${SITE_URL}/severance-pay`;
    return {
      title,
      description,
      canonical,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "퇴직금 계산기",
        url: canonical,
        applicationCategory: "FinanceApplication",
        inLanguage: "ko",
        offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
      },
      breadcrumb: buildBreadcrumb([
        { name: "홈", url: SITE_URL },
        { name: "퇴직금 계산기" },
      ]),
    };
  }

  if (route === "/quit") {
    const title = "퇴사 계산기 2026 | 퇴직금·실업급여·생존기간";
    const description = "퇴직금, 실업급여, 퇴사 후 월 고정비를 한 번에 계산해 버틸 수 있는 기간을 확인합니다.";
    const canonical = `${SITE_URL}/quit`;
    return {
      title,
      description,
      canonical,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "퇴사 계산기",
        url: canonical,
        applicationCategory: "FinanceApplication",
        inLanguage: "ko",
        offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
      },
      breadcrumb: buildBreadcrumb([
        { name: "홈", url: SITE_URL },
        { name: "퇴사 계산기" },
      ]),
    };
  }

  const chain = getScenarioChain(route);
  if (chain) {
    const canonical = `${SITE_URL}${route}`;
    return {
      title: chain.seoTitle,
      description: chain.seoDescription,
      canonical,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: chain.seoTitle,
        description: chain.seoDescription,
        url: canonical,
        inLanguage: "ko",
        mainEntity: {
          "@type": "ItemList",
          itemListOrder: "https://schema.org/ItemListOrderAscending",
          itemListElement: chain.steps.map((step, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: step.label,
            url: `${SITE_URL}${step.to}`,
          })),
        },
      },
      breadcrumb: buildBreadcrumb([
        { name: "홈", url: SITE_URL },
        { name: chain.heading },
      ]),
    };
  }

  const guide = getPrerenderGuide(route);
  if (guide) {
    const canonical = `${SITE_URL}${route}`;
    return {
      title: guide.title,
      description: guide.description,
      canonical,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: guide.heading,
        description: guide.description,
        url: canonical,
        applicationCategory: "FinanceApplication",
        inLanguage: "ko",
        offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
      },
      breadcrumb: buildBreadcrumb([
        { name: "홈", url: SITE_URL },
        { name: guide.heading },
      ]),
    };
  }

  // fallback
  const title = "2026 연봉 실수령액 계산기 | 건보료 계산·4대보험·종합소득세";
  const description = "2026년 최신 세율 반영. 연봉 실수령액, 건보료 연봉 계산, 종합소득세, 이직 비교, 퇴사 시뮬레이션을 무료로 계산하세요.";
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
      <p style="margin:0;"><a href="/finance/insurance">건보료 계산기 열기</a></p>
    </section>`;
  }

  const salaryManWon = readSalaryManWon(route);
  if (salaryManWon !== null) {
    return `
    <section data-seo-prerender style="max-width:920px;margin:0 auto;padding:20px 16px;line-height:1.6;">
      <h1 style="font-size:28px;line-height:1.3;margin:0 0 12px;">연봉 ${formatManWon(salaryManWon)}원 실수령액 계산</h1>
      <p style="margin:0 0 10px;">2026년 기준으로 4대보험, 소득세, 지방소득세를 반영해 월 실수령액을 계산할 수 있습니다.</p>
      <p style="margin:0;"><a href="/finance/salary">실수령액 계산기 열기</a></p>
    </section>`;
  }

  const freelancerAmt = readFreelancerManWon(route);
  if (freelancerAmt !== null) {
    return `
    <section data-seo-prerender style="max-width:920px;margin:0 auto;padding:20px 16px;line-height:1.6;">
      <h1 style="font-size:28px;line-height:1.3;margin:0 0 12px;">프리랜서 수입 ${formatManWon(freelancerAmt)} 세금 계산</h1>
      <p style="margin:0 0 10px;">3.3% 원천징수 후 종합소득세 정산 금액을 계산합니다.</p>
      <p style="margin:0;"><a href="/finance/freelancer">프리랜서 세금 계산기 열기</a></p>
    </section>`;
  }

  const comprehensiveTaxManWon = readComprehensiveTaxManWon(route);
  if (comprehensiveTaxManWon !== null) {
    return `
    <section data-seo-prerender style="max-width:920px;margin:0 auto;padding:20px 16px;line-height:1.6;">
      <h1 style="font-size:28px;line-height:1.3;margin:0 0 12px;">종합소득 ${comprehensiveTaxManWon}만원 계산</h1>
      <p style="margin:0 0 10px;">사업소득·임대소득·기타소득을 합산하고 분리과세와 종합과세를 비교해 최종 세액을 계산할 수 있습니다.</p>
      <p style="margin:0;"><a href="/finance/comprehensive-tax">종합소득세 계산기 열기</a></p>
    </section>`;
  }

  const comparePair = readComparePair(route);
  if (comparePair) {
    return `
    <section data-seo-prerender style="max-width:920px;margin:0 auto;padding:20px 16px;line-height:1.6;">
      <h1 style="font-size:28px;line-height:1.3;margin:0 0 12px;">연봉 ${comparePair.a.toLocaleString("ko-KR")} vs ${comparePair.b.toLocaleString("ko-KR")} 이직 비교</h1>
      <p style="margin:0 0 10px;">두 회사의 연봉/복지 조건을 넣으면 월 실수령 및 실질 소득 차이를 확인할 수 있습니다.</p>
      <p style="margin:0;"><a href="/finance/compare">이직 연봉 비교 계산기 열기</a></p>
    </section>`;
  }

  const quitYears = readQuitYears(route);
  if (quitYears !== null) {
    return `
    <section data-seo-prerender style="max-width:920px;margin:0 auto;padding:20px 16px;line-height:1.6;">
      <h1 style="font-size:28px;line-height:1.3;margin:0 0 12px;">${quitYears}년 근속 퇴사 계산</h1>
      <p style="margin:0 0 10px;">퇴직금, 실업급여, 월 고정비를 계산해 퇴사 후 생존기간을 확인할 수 있습니다.</p>
      <p style="margin:0;"><a href="/finance/quit">퇴사 계산기 열기</a></p>
    </section>`;
  }

  const unemploymentAmt = readUnemploymentManWon(route);
  if (unemploymentAmt !== null) {
    return `
    <section data-seo-prerender style="max-width:920px;margin:0 auto;padding:20px 16px;line-height:1.6;">
      <h1 style="font-size:28px;line-height:1.3;margin:0 0 12px;">월급 ${formatManWon(unemploymentAmt)} 실업급여 계산</h1>
      <p style="margin:0 0 10px;">월급 ${formatManWon(unemploymentAmt)}원 기준 실업급여 일 수급액과 총 수급액을 계산합니다.</p>
      <p style="margin:0;"><a href="/finance/unemployment">실업급여 계산기 열기</a></p>
    </section>`;
  }

  const regionalHealthAmt = readRegionalHealthManWon(route);
  if (regionalHealthAmt !== null) {
    return `
    <section data-seo-prerender style="max-width:920px;margin:0 auto;padding:20px 16px;line-height:1.6;">
      <h1 style="font-size:28px;line-height:1.3;margin:0 0 12px;">월급 ${formatManWon(regionalHealthAmt)} 퇴사 후 건보료</h1>
      <p style="margin:0 0 10px;">지역가입자, 임의계속가입, 피부양자 등록 세 가지 옵션을 비교합니다.</p>
      <p style="margin:0;"><a href="/finance/regional-health">지역가입자 건보료 계산기 열기</a></p>
    </section>`;
  }

  const weeklyHolidayPayAmt = readWeeklyHolidayPayAmount(route);
  if (weeklyHolidayPayAmt !== null) {
    return `
    <section data-seo-prerender style="max-width:920px;margin:0 auto;padding:20px 16px;line-height:1.6;">
      <h1 style="font-size:28px;line-height:1.3;margin:0 0 12px;">시급 ${weeklyHolidayPayAmt.toLocaleString("ko-KR")}원 주휴수당</h1>
      <p style="margin:0 0 10px;">시급 ${weeklyHolidayPayAmt.toLocaleString("ko-KR")}원 기준 주휴수당과 실질 시급을 계산합니다.</p>
      <p style="margin:0;"><a href="/finance/weekly-holiday-pay">주휴수당 계산기 열기</a></p>
    </section>`;
  }

  const wageConverterAmt = readWageConverterHourly(route);
  if (wageConverterAmt !== null) {
    return `
    <section data-seo-prerender style="max-width:920px;margin:0 auto;padding:20px 16px;line-height:1.6;">
      <h1 style="font-size:28px;line-height:1.3;margin:0 0 12px;">시급 ${wageConverterAmt.toLocaleString("ko-KR")}원 월급·연봉 환산</h1>
      <p style="margin:0 0 10px;">시급 ${wageConverterAmt.toLocaleString("ko-KR")}원을 월급·일급·연봉으로 환산합니다.</p>
      <p style="margin:0;"><a href="/finance/wage-converter">시급 환산기 열기</a></p>
    </section>`;
  }

  const severancePayYearsAmt = readSeverancePayYears(route);
  if (severancePayYearsAmt !== null) {
    return `
    <section data-seo-prerender style="max-width:920px;margin:0 auto;padding:20px 16px;line-height:1.6;">
      <h1 style="font-size:28px;line-height:1.3;margin:0 0 12px;">${severancePayYearsAmt}년 근속 퇴직금 계산</h1>
      <p style="margin:0 0 10px;">${severancePayYearsAmt}년 근속 기준 퇴직금과 퇴직소득세를 계산합니다.</p>
      <p style="margin:0;"><a href="/finance/severance-pay">퇴직금 계산기 열기</a></p>
    </section>`;
  }

  const parentalAmt = readParentalLeaveManWon(route);
  if (parentalAmt !== null) {
    return `
    <section data-seo-prerender style="max-width:920px;margin:0 auto;padding:20px 16px;line-height:1.6;">
      <h1 style="font-size:28px;line-height:1.3;margin:0 0 12px;">통상임금 ${formatManWon(parentalAmt)} 육아휴직 급여</h1>
      <p style="margin:0 0 10px;">일반·6+6 부모육아휴직제·한부모 특례별 월 급여와 총 수령액을 계산합니다.</p>
      <p style="margin:0;"><a href="/finance/parental-leave">육아휴직 급여 계산기 열기</a></p>
    </section>`;
  }

  const yearEndAmt = readYearEndManWon(route);
  if (yearEndAmt !== null) {
    return `
    <section data-seo-prerender style="max-width:920px;margin:0 auto;padding:20px 16px;line-height:1.6;">
      <h1 style="font-size:28px;line-height:1.3;margin:0 0 12px;">연봉 ${formatManWon(yearEndAmt)} 연말정산 계산</h1>
      <p style="margin:0 0 10px;">신용카드, 의료비, 교육비, 연금저축, 월세 등 공제 항목을 입력하면 예상 환급액을 계산합니다.</p>
      <p style="margin:0;"><a href="/finance/year-end-settlement">연말정산 계산기 열기</a></p>
    </section>`;
  }

  const withholdingAmt = readWithholdingAmount(route);
  if (withholdingAmt !== null) {
    return `
    <section data-seo-prerender style="max-width:920px;margin:0 auto;padding:20px 16px;line-height:1.6;">
      <h1 style="font-size:28px;line-height:1.3;margin:0 0 12px;">소득세 ${formatWon(withholdingAmt)}이면 연봉 얼마?</h1>
      <p style="margin:0 0 10px;">월 소득세 ${formatWon(withholdingAmt)} 기준 추정 연봉과 월 실수령액을 계산합니다.</p>
      <p style="margin:0;"><a href="/finance/withholding">원천세 계산기 열기</a></p>
    </section>`;
  }

  if (route === "/all") {
    return `
    <section data-seo-prerender style="max-width:920px;margin:0 auto;padding:20px 16px;line-height:1.6;">
      <h1 style="font-size:28px;line-height:1.3;margin:0 0 12px;">2026 세금·연봉·수당 계산기 모음</h1>
      <p style="margin:0 0 10px;">급여·세금·수당·퇴직·절세까지, 23개 계산기를 한곳에서 확인하세요.</p>
      <h2 style="font-size:18px;margin:16px 0 6px;">급여·연봉</h2>
      <ul style="margin:0 0 8px;padding-left:20px;">
        <li><a href="/finance/salary">연봉 실수령액 계산기</a></li>
        <li><a href="/finance/insurance">건보료 역산 계산기</a></li>
        <li><a href="/finance/compare">이직 연봉 비교</a></li>
        <li><a href="/finance/raise">연봉 인상률 계산기</a></li>
        <li><a href="/finance/bonus">성과급 실수령 계산기</a></li>
      </ul>
      <h2 style="font-size:18px;margin:16px 0 6px;">세금·신고</h2>
      <ul style="margin:0 0 8px;padding-left:20px;">
        <li><a href="/finance/comprehensive-tax">종합소득세 계산기</a></li>
        <li><a href="/finance/withholding">원천세 계산기</a></li>
        <li><a href="/finance/freelance-rate">프리랜서 단가 역산</a></li>
        <li><a href="/finance/4-insurance-employer">사업주 4대보험</a></li>
      </ul>
      <h2 style="font-size:18px;margin:16px 0 6px;">수당·시급</h2>
      <ul style="margin:0 0 8px;padding-left:20px;">
        <li><a href="/finance/weekly-holiday-pay">주휴수당 계산기</a></li>
        <li><a href="/finance/wage-converter">시급↔월급↔연봉 환산기</a></li>
        <li><a href="/finance/overtime">연장·야간·휴일수당</a></li>
        <li><a href="/finance/annual-leave">연차수당 계산기</a></li>
      </ul>
      <h2 style="font-size:18px;margin:16px 0 6px;">퇴직·구직</h2>
      <ul style="margin:0 0 8px;padding-left:20px;">
        <li><a href="/finance/quit">퇴사 계산기</a></li>
        <li><a href="/finance/severance-pay">퇴직금 계산기</a></li>
        <li><a href="/finance/unemployment">실업급여 계산기</a></li>
        <li><a href="/finance/parental-leave">육아휴직 급여</a></li>
        <li><a href="/finance/regional-health">지역가입자 건보료</a></li>
      </ul>
      <h2 style="font-size:18px;margin:16px 0 6px;">절세·공제</h2>
      <ul style="margin:0 0 8px;padding-left:20px;">
        <li><a href="/finance/year-end-settlement">연말정산 계산기</a></li>
        <li><a href="/finance/monthly-rent-deduction">월세 세액공제</a></li>
        <li><a href="/finance/irp">IRP 세액공제</a></li>
        <li><a href="/finance/pension">국민연금 수령액</a></li>
      </ul>
    </section>`;
  }

  return `
    <section data-seo-prerender style="max-width:920px;margin:0 auto;padding:20px 16px;line-height:1.6;">
      <h1 style="font-size:28px;line-height:1.3;margin:0 0 12px;">${meta.title}</h1>
      <p style="margin:0 0 10px;">${meta.description}</p>
      <ul style="margin:0;padding-left:20px;">
        <li><a href="/finance/insurance">건보료 계산기</a></li>
        <li><a href="/finance/salary">연봉 실수령액 계산기</a></li>
        <li><a href="/finance/comprehensive-tax">종합소득세 계산기</a></li>
        <li><a href="/finance/compare">이직 연봉 비교 계산기</a></li>
        <li><a href="/finance/quit">퇴사 계산기</a></li>
        <li><a href="/finance/year-end-settlement">연말정산 계산기</a></li>
      </ul>
    </section>`;
}

// Doorway-variant consolidation. buildMeta() computes a self-canonical per branch (~25 of them),
// so instead of touching every branch this rewrites the result in one place: canonical, og:url
// and both hreflang tags all read meta.canonical downstream, so overriding it here moves them
// together and they cannot drift apart.
//
// jsonLd `url` is retargeted too. A WebApplication node claiming url=/salary/5000 while the
// canonical says /salary hands crawlers two different identities for one page; the schema must
// agree with the tag it ships next to. Breadcrumbs are left alone on purpose — they describe how
// the visitor got here, not which URL is authoritative.
function consolidateCanonical(route, meta) {
  const canonicalRoute = canonicalPathFor(route);
  if (canonicalRoute === route) return meta;

  const canonical = canonicalRoute === "/" ? SITE_URL : `${SITE_URL}${canonicalRoute}`;
  const retarget = (node) =>
    node && typeof node === "object" && node.url === meta.canonical
      ? { ...node, url: canonical }
      : node;

  return {
    ...meta,
    canonical,
    jsonLd: Array.isArray(meta.jsonLd) ? meta.jsonLd.map(retarget) : retarget(meta.jsonLd),
  };
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
  // FAQ 보유 랜딩 라우트는 FAQPage를 추가하되, 이미 있으면 절대 중복 주입하지 않는다 (페이지당 정확히 1개)
  const routeFaqs = ROUTE_FAQS[route] ?? null;
  const baseJsonLd = [meta.jsonLd].flat().filter(Boolean);
  const hasFaqPage = baseJsonLd.some((entry) => entry["@type"] === "FAQPage");
  const faqJsonLd = routeFaqs && !hasFaqPage ? buildFaqJsonLd(routeFaqs) : null;
  const jsonLdArray = [...baseJsonLd, faqJsonLd, meta.breadcrumb].flat().filter(Boolean);
  output = output.replace(/\n?\s*<script type="application\/ld\+json" data-seo-prerender="jsonld">[\s\S]*?<\/script>/i, "");
  // An empty array is not schema — emitting it only adds a meaningless block (404 shell).
  if (jsonLdArray.length > 0) {
    const jsonLdTag = `    <script type="application/ld+json" data-seo-prerender="jsonld">${toSafeJson(jsonLdArray)}</script>`;
    output = output.replace("</head>", `${jsonLdTag}\n  </head>`);
  }

  // 기존 데이터-seo-prerender 요소 제거 (재실행 대비)
  output = output.replace(/\n?\s*<header data-seo-prerender[\s\S]*?<\/header>/i, "");
  output = output.replace(/\n?\s*<section data-seo-prerender[\s\S]*?<\/section>/i, "");
  output = output.replace(/\n?\s*<article data-seo-prerender[\s\S]*?<\/article>/i, "");
  output = output.replace(/\n?\s*<footer data-seo-prerender[\s\S]*?<\/footer>/i, "");

  // 리치 콘텐츠 우선 시도 → 없으면 기본 스텁
  const rich = buildRichContent(route, meta);
  // 가이드 체인은 링크 나열이라 본문이 얇다 — 연말정산·알바 가이드에는 검증 수치 기반 심화 본문을 덧붙인다
  const scenarioHtml = buildScenarioChainHtml(route);
  const enrichedScenarioHtml = scenarioHtml ? appendGuideDeepDive(scenarioHtml, route) : null;
  let mainContent = rich || enrichedScenarioHtml || buildPrerenderGuide(route) || buildPrerenderSection(route, meta);
  // 스키마 규칙: FAQPage의 Q/A는 본문에 렌더되는 문구와 동일해야 하므로 같은 데이터로 본문 FAQ도 노출
  if (routeFaqs && !mainContent.includes("자주 묻는")) {
    mainContent = appendFaqSection(mainContent, routeFaqs);
  }
  const headerHtml = buildPrerenderHeader();
  const footerHtml = buildPrerenderFooter();

  const injection = `${headerHtml}${mainContent}${footerHtml}`;

  if (output.includes('<div id="app"></div>')) {
    output = output.replace('<div id="app"></div>', `<div id="app"></div>${injection}`);
  } else {
    output = output.replace("</body>", `${injection}\n  </body>`);
  }

  return output;
}

for (const route of SEO_ROUTES) {
  const filePath = route === "/" ? INDEX_HTML : resolve(DIST_DIR, route.slice(1), "index.html");
  const dir = dirname(filePath);

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const meta = consolidateCanonical(route, buildMeta(route));
  // 셸의 <noscript>는 JS 없는 크롤러용 fallback이다. 프리렌더된 라우트는 이미 본문이 정적으로
  // 들어 있으므로 남겨두면 h1이 2개가 되고 헤딩 아웃라인이 오염된다(라이브 157페이지 전부 그랬다).
  const html = applyMeta(template, route, meta).replace(
    /\n?\s*<noscript>[\s\S]*?<\/noscript>/i,
    "",
  );

  // Schema invariant: one JSON-LD block per page, it must parse, it must not be empty, and it
  // must hold at most one WebApplication node. The shell used to carry a second static block,
  // so every page shipped two WebApplication entities for the same url with no @id to tell
  // them apart. This gate fails the build if that block (or any other) comes back.
  const jsonLdBodies = [
    ...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi),
  ].map((match) => match[1]);
  if (jsonLdBodies.length !== 1) {
    throw new Error(
      `[prerender] Expected exactly 1 JSON-LD block on ${route} (count=${jsonLdBodies.length})`
    );
  }
  let jsonLdNodes;
  try {
    jsonLdNodes = [JSON.parse(jsonLdBodies[0])].flat();
  } catch (error) {
    throw new Error(`[prerender] Unparseable JSON-LD on ${route}: ${error.message}`);
  }
  if (jsonLdNodes.length === 0) {
    throw new Error(`[prerender] Empty JSON-LD on ${route}`);
  }
  const webApplicationCount = jsonLdNodes.filter(
    (node) => node && node["@type"] === "WebApplication"
  ).length;
  if (webApplicationCount > 1) {
    throw new Error(
      `[prerender] Duplicate WebApplication schema on ${route} (count=${webApplicationCount})`
    );
  }

  // 불변 규칙 검증: FAQPage는 페이지당 최대 1개, FAQ 라우트는 정확히 1개 + 본문에 동일 Q 텍스트 존재
  const faqPageCount = (html.match(/"FAQPage"/g) ?? []).length;
  if (faqPageCount > 1) {
    throw new Error(`[prerender] Duplicate FAQPage schema on ${route} (count=${faqPageCount})`);
  }
  const routeFaqs = ROUTE_FAQS[route];
  if (routeFaqs) {
    if (faqPageCount !== 1) {
      throw new Error(`[prerender] Missing FAQPage schema on FAQ route ${route}`);
    }
    for (const item of routeFaqs) {
      if (!html.includes(item.question)) {
        throw new Error(`[prerender] FAQ question missing from body on ${route}: "${item.question}"`);
      }
    }
  }

  writeFileSync(filePath, html, "utf-8");
  console.log(`[prerender] ${route} -> ${filePath}`);
}

const guideBodies = new Set();
for (const route of PRERENDER_GUIDE_ROUTES) {
  const guide = getPrerenderGuide(route);
  const filePath = resolve(DIST_DIR, route.slice(1), "index.html");
  const html = readFileSync(filePath, "utf8");
  const body = html.match(/<article data-seo-prerender[\s\S]*?<\/article>/i)?.[0];
  if (!guide || !html.includes(`<title>${guide.title}</title>`)) {
    throw new Error(`Missing guide title for ${route}`);
  }
  if (!html.includes(`<link rel="canonical" href="${SITE_URL}${route}"`)) {
    throw new Error(`Missing guide canonical for ${route}`);
  }
  if (!body || body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length < 300) {
    throw new Error(`Guide body is too short for ${route}`);
  }
  guideBodies.add(body);
}
if (guideBodies.size !== PRERENDER_GUIDE_ROUTES.length) {
  throw new Error("Prerender guide bodies must be unique");
}
console.log(`Validated ${guideBodies.size} route-specific prerender guides.`);

const notFoundMeta = {
  title: "페이지를 찾을 수 없습니다 | ShakiLabs 금융 계산기",
  description: "요청한 금융 계산기 페이지를 찾을 수 없습니다.",
  canonical: `${SITE_URL}/404`,
  jsonLd: null,
  breadcrumb: null,
};
const notFoundHtml = applyMeta(template, "/404", notFoundMeta)
  .replace(
    "</head>",
    '    <meta name="robots" content="noindex,nofollow" />\n  </head>'
  )
  // Google "Valuable Inventory": a screen with no content must not carry an ad loader. The 404
  // is built from the same shell as every route, so it inherits the shell's AdSense snippet —
  // noindex keeps it out of the index but the policy judges whether the loader is present at
  // all. NotFoundView renders no AdSlot, so stripping the shell tag removes the last one.
  .replace(
    /\n?\s*<script[^>]*pagead2\.googlesyndication\.com[^>]*><\/script>/i,
    ""
  )
  .replace(
    /<noscript>[\s\S]*?<\/noscript>/i,
    '<noscript><main><h1>페이지를 찾을 수 없습니다</h1><a href="/finance">금융 계산기로 이동</a></main></noscript>'
  );
writeFileSync(resolve(DIST_DIR, "404.html"), notFoundHtml, "utf-8");

console.log(`[prerender] Done. ${SEO_ROUTES.length} routes processed.`);
