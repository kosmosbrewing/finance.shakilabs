// 빌드 후 라우트별 SEO HTML 생성
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { SEO_ROUTES } from "./seo-routes.mjs";
import { buildPrerenderHeader, buildPrerenderFooter } from "./prerender-layout.mjs";
import { buildRichContent } from "./prerender-content.mjs";
import {
  buildPrerenderGuide,
  getPrerenderGuide,
  PRERENDER_GUIDE_ROUTES,
} from "./prerender-guides.mjs";

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
    const title = "2026 세금·연봉·수당 계산기 모음 | 23개 계산기";
    const description = "연봉 실수령액, 종합소득세, 연말정산, 퇴직금, 실업급여, 주휴수당 등 23개 계산기를 한곳에서 이용하세요. 2026년 기준 반영.";
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
    const title = "연봉 비교 결과 | 이직 실수령 차이 계산 2026";
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

  // --- 랜딩 페이지 ---
  if (route === "/insurance" || route === "/") {
    const isHome = route === "/";
    const title = isHome
      ? "2026 연봉 실수령액 계산기 | 건보료 계산·4대보험·종합소득세"
      : "2026 건강보험료로 연봉 계산기 | 4대보험";
    const description = isHome
      ? "2026년 최신 세율 반영. 연봉 실수령액, 건보료 연봉 계산, 종합소득세, 이직 비교, 퇴사 시뮬레이션을 무료로 계산하세요."
      : "건강보험료를 입력하면 추정 연봉과 월 실수령액을 계산합니다. 2026 최신 요율 반영.";
    const canonical = isHome ? `${SITE_URL}/` : `${SITE_URL}/insurance`;

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
          name: isHome ? "2026 연봉 실수령액 계산기" : "2026 건강보험료 연봉 계산기",
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
        { name: isHome ? "연봉 실수령액 계산기" : "건보료 계산" },
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

  // 기존 데이터-seo-prerender 요소 제거 (재실행 대비)
  output = output.replace(/\n?\s*<header data-seo-prerender[\s\S]*?<\/header>/i, "");
  output = output.replace(/\n?\s*<section data-seo-prerender[\s\S]*?<\/section>/i, "");
  output = output.replace(/\n?\s*<article data-seo-prerender[\s\S]*?<\/article>/i, "");
  output = output.replace(/\n?\s*<footer data-seo-prerender[\s\S]*?<\/footer>/i, "");

  // 리치 콘텐츠 우선 시도 → 없으면 기본 스텁
  const rich = buildRichContent(route, meta);
  const mainContent = rich || buildPrerenderGuide(route) || buildPrerenderSection(route, meta);
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

  const meta = buildMeta(route);
  const html = applyMeta(template, route, meta);
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
  .replace(
    /<noscript>[\s\S]*?<\/noscript>/i,
    '<noscript><main><h1>페이지를 찾을 수 없습니다</h1><a href="/finance">금융 계산기로 이동</a></main></noscript>'
  );
writeFileSync(resolve(DIST_DIR, "404.html"), notFoundHtml, "utf-8");

console.log(`[prerender] Done. ${SEO_ROUTES.length} routes processed.`);
