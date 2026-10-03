import { nextTick } from "vue";
import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { trackPageView } from "@/lib/analytics";
import { queryFirst } from "@/lib/routeState";
import { clearRuntimeError } from "@/lib/runtimeError";
import { buildPublicPagePath, shouldTrackPageView } from "@/utils/pageTracking";
import {
  NOT_FOUND_TITLE,
  brandTitle,
  pageTitle,
} from "../../scripts/page-titles.mjs";

function mapLegacyFreelanceQuery(
  query: Record<string, unknown>,
  amountParam?: string
): Record<string, string> {
  const mapped: Record<string, string> = {};

  const legacyType = queryFirst(query.type);
  const legacyIndustry = queryFirst(query.industry);
  const legacyDep = queryFirst(query.dep);

  const rawAmount = amountParam ?? queryFirst(query.gross);
  const parsedAmount = Number.parseInt(rawAmount ?? "", 10);
  const amount = Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : null;

  if (amount !== null) {
    if (legacyType === "other") {
      mapped.oth = String(amount);
      // 기존 프리랜서 기타소득 계산은 분리과세 개념이 없어 종합과세로 매핑
      mapped.osp = "0";
    } else {
      mapped.biz = String(amount);
    }
  }

  if (legacyIndustry) mapped.ind = legacyIndustry;
  if (legacyDep) mapped.dep = legacyDep;

  return mapped;
}

// meta.title은 접미사 없는 페이지 제목이다(brandTitle이 붙인다). 기본 라우트는 page-titles.mjs 값을 그대로 쓰고,
// 금액 변형 라우트는 GA page_title을 한 줄로 묶는 가족 제목을 둔다 — 실제 탭 제목은 뷰가 같은 모듈의
// 변형 함수(salaryVariantTitle 등)로 덮어 프리렌더 <title>과 같아진다.
const routes: RouteRecordRaw[] = [
  {
    // 홈은 /salary로 튕기지 않는다. 프리렌더된 정적 HTML은 허브였는데 사용자만 계산기로
    // 리다이렉트돼 크롤러와 화면이 갈라져 있었다. /salary 라우트는 그대로 유지한다.
    path: "/",
    name: "Home",
    component: () => import("@/views/HomeView.vue"),
    meta: { title: pageTitle("/") },
  },
  {
    path: "/insurance",
    name: "Insurance",
    component: () => import("@/views/InsuranceView.vue"),
    props: { initialMode: "reverse" },
    meta: { title: pageTitle("/insurance") },
  },
  {
    path: "/insurance/:amount(\\d+)",
    name: "InsuranceDetail",
    component: () => import("@/views/InsuranceView.vue"),
    props: (route) => ({
      initialHealthInsuranceFee: Number.parseInt(String(route.params.amount), 10),
      initialMode: "reverse",
    }),
    meta: { title: "2026 건보료 계산 결과 · 건강보험료 계산기" },
  },
  {
    path: "/salary",
    name: "SalaryHome",
    component: () => import("@/views/InsuranceView.vue"),
    props: { initialMode: "forward" },
    meta: { title: pageTitle("/salary") },
  },
  {
    path: "/salary/:amount",
    name: "SalaryLanding",
    component: () => import("@/views/SalaryLandingView.vue"),
    meta: { title: "2026 연봉 실수령액 계산기 · 월급 계산" },
  },
  {
    path: "/comprehensive-tax",
    name: "ComprehensiveTax",
    component: () => import("@/views/ComprehensiveTaxView.vue"),
    meta: { title: pageTitle("/comprehensive-tax") },
  },
  {
    path: "/comprehensive-tax/:amount(\\d+)",
    name: "ComprehensiveTaxLanding",
    component: () => import("@/views/ComprehensiveTaxView.vue"),
    props: (route) => ({
      initialBusinessAmountManWon: Number.parseInt(String(route.params.amount), 10),
    }),
    meta: { title: "2026 종합소득세 계산 결과 · 프리랜서 세금 계산기" },
  },
  {
    path: "/freelance-rate",
    name: "FreelanceRate",
    component: () => import("@/views/FreelanceRateView.vue"),
    meta: { title: pageTitle("/freelance-rate") },
  },
  {
    path: "/freelancer",
    name: "Freelancer",
    component: () => import("@/views/ComprehensiveTaxView.vue"),
    props: { isFreelancerRoute: true },
    meta: { title: pageTitle("/freelancer") },
  },
  {
    path: "/freelancer/:amount(\\d+)",
    name: "FreelancerLanding",
    component: () => import("@/views/ComprehensiveTaxView.vue"),
    props: (route) => ({
      isFreelancerRoute: true,
      initialBusinessAmountManWon: Number.parseInt(String(route.params.amount), 10),
    }),
    meta: { title: "2026 프리랜서 세금 계산 결과 · 종합소득세 계산기" },
  },
  {
    path: "/freelance/:amount(\\d+)",
    redirect: (to) => ({
      path: "/comprehensive-tax",
      query: mapLegacyFreelanceQuery(
        to.query as Record<string, unknown>,
        String(to.params.amount)
      ),
    }),
  },
  {
    path: "/freelance",
    redirect: (to) => ({
      path: "/comprehensive-tax",
      query: mapLegacyFreelanceQuery(to.query as Record<string, unknown>),
    }),
  },
  {
    path: "/compare",
    name: "Compare",
    component: () => import("@/views/CompareView.vue"),
    meta: { title: pageTitle("/compare") },
  },
  {
    path: "/raise",
    name: "Raise",
    component: () => import("@/views/RaiseView.vue"),
    meta: { title: pageTitle("/raise") },
  },
  {
    path: "/bonus",
    name: "Bonus",
    component: () => import("@/views/BonusView.vue"),
    meta: { title: pageTitle("/bonus") },
  },
  {
    path: "/annual-leave",
    name: "AnnualLeave",
    component: () => import("@/views/AnnualLeaveView.vue"),
    meta: { title: pageTitle("/annual-leave") },
  },
  {
    path: "/overtime",
    name: "Overtime",
    component: () => import("@/views/OvertimeView.vue"),
    meta: { title: pageTitle("/overtime") },
  },
  {
    path: "/pension",
    name: "Pension",
    component: () => import("@/views/PensionView.vue"),
    meta: { title: pageTitle("/pension") },
  },
  {
    path: "/monthly-rent-deduction",
    name: "MonthlyRentDeduction",
    component: () => import("@/views/MonthlyRentDeductionView.vue"),
    meta: { title: pageTitle("/monthly-rent-deduction") },
  },
  {
    path: "/irp",
    name: "Irp",
    component: () => import("@/views/IrpView.vue"),
    meta: { title: pageTitle("/irp") },
  },
  {
    path: "/4-insurance-employer",
    name: "InsuranceEmployer",
    component: () => import("@/views/InsuranceEmployerView.vue"),
    meta: { title: pageTitle("/4-insurance-employer") },
  },
  {
    path: "/compare/:a(\\d+)-vs-:b(\\d+)",
    name: "CompareDetail",
    component: () => import("@/views/CompareView.vue"),
    props: (route) => ({
      initialAManWon: Number.parseInt(String(route.params.a), 10),
      initialBManWon: Number.parseInt(String(route.params.b), 10),
    }),
    meta: { title: "2026 연봉 비교 결과 · 이직 실수령 차이 계산" },
  },
  {
    path: "/withholding",
    name: "Withholding",
    component: () => import("@/views/WithholdingView.vue"),
    meta: { title: pageTitle("/withholding") },
  },
  {
    path: "/withholding/:amount(\\d+)",
    name: "WithholdingDetail",
    component: () => import("@/views/WithholdingView.vue"),
    props: (route) => ({
      initialAmountWon: Number.parseInt(String(route.params.amount), 10),
    }),
    meta: { title: "2026 원천세 계산 결과 · 연봉 추정 계산기" },
  },
  {
    path: "/quit",
    name: "Quit",
    component: () => import("@/views/QuitView.vue"),
    meta: { title: pageTitle("/quit") },
  },
  {
    path: "/quit/:years(\\d+years)",
    name: "QuitDetail",
    component: () => import("@/views/QuitView.vue"),
    props: (route) => ({
      initialYears: Number.parseInt(String(route.params.years).replace("years", ""), 10),
    }),
    meta: { title: "2026 퇴사 시뮬레이션 결과 · 퇴직금·실업급여 계산" },
  },
  {
    path: "/parental-leave",
    name: "ParentalLeave",
    component: () => import("@/views/ParentalLeaveView.vue"),
    meta: { title: pageTitle("/parental-leave") },
  },
  {
    path: "/parental-leave/:amount(\\d+)",
    name: "ParentalLeaveLanding",
    component: () => import("@/views/ParentalLeaveView.vue"),
    props: (route) => ({
      initialWage: Number.parseInt(String(route.params.amount), 10) * 10_000,
    }),
    meta: { title: "2026 육아휴직 급여 계산 결과 · 월별 수령액" },
  },
  {
    path: "/year-end-settlement",
    name: "YearEndSettlement",
    component: () => import("@/views/YearEndSettlementView.vue"),
    meta: { title: pageTitle("/year-end-settlement") },
  },
  {
    path: "/year-end-settlement/:amount(\\d+)",
    name: "YearEndSettlementLanding",
    component: () => import("@/views/YearEndSettlementView.vue"),
    props: (route) => ({
      initialSalary: Number.parseInt(String(route.params.amount), 10) * 10_000,
    }),
    meta: { title: "2026 연말정산 계산 결과 · 연봉별 환급액" },
  },
  {
    path: "/unemployment",
    name: "Unemployment",
    component: () => import("@/views/UnemploymentView.vue"),
    meta: { title: pageTitle("/unemployment") },
  },
  {
    path: "/unemployment/:amount(\\d+)",
    name: "UnemploymentLanding",
    component: () => import("@/views/UnemploymentView.vue"),
    props: (route) => ({
      initialSalary: Number.parseInt(String(route.params.amount), 10) * 10_000,
    }),
    meta: { title: "2026 실업급여 계산 결과 · 월급별 수급액" },
  },
  {
    path: "/regional-health",
    name: "RegionalHealth",
    component: () => import("@/views/RegionalHealthView.vue"),
    meta: { title: pageTitle("/regional-health") },
  },
  {
    path: "/regional-health/:amount(\\d+)",
    name: "RegionalHealthLanding",
    component: () => import("@/views/RegionalHealthView.vue"),
    props: (route) => ({
      initialSalary: Number.parseInt(String(route.params.amount), 10) * 10_000,
    }),
    meta: { title: "2026 지역가입자 건보료 계산 결과 · 퇴사 후 보험료" },
  },
  {
    path: "/dependent",
    name: "Dependent",
    component: () => import("@/views/DependentView.vue"),
    meta: { title: pageTitle("/dependent") },
  },
  {
    path: "/unpaid-wage",
    name: "UnpaidWage",
    component: () => import("@/views/UnpaidWageView.vue"),
    meta: { title: pageTitle("/unpaid-wage") },
  },
  {
    path: "/unpaid-wage/:amount(\\d+)",
    name: "UnpaidWageLanding",
    component: () => import("@/views/UnpaidWageView.vue"),
    props: (route) => ({
      initialAmount: Number.parseInt(String(route.params.amount), 10) * 10_000,
    }),
    meta: { title: "체불임금 지연이자 계산 결과 · 연 20% 기준" },
  },
  {
    path: "/eitc",
    name: "Eitc",
    component: () => import("@/views/EitcView.vue"),
    meta: { title: pageTitle("/eitc") },
  },
  {
    path: "/eitc/:household(single|single-income|double-income)",
    name: "EitcHousehold",
    component: () => import("@/views/EitcView.vue"),
    props: (route) => ({
      initialHousehold: String(route.params.household),
    }),
    meta: { title: "가구 유형별 근로장려금 계산 · 2026 지급액" },
  },
  {
    path: "/weekly-holiday-pay",
    name: "WeeklyHolidayPay",
    component: () => import("@/views/WeeklyHolidayPayView.vue"),
    meta: { title: pageTitle("/weekly-holiday-pay") },
  },
  {
    path: "/weekly-holiday-pay/:amount(\\d+)",
    name: "WeeklyHolidayPayLanding",
    component: () => import("@/views/WeeklyHolidayPayView.vue"),
    props: (route) => ({
      initialHourlyWage: Number.parseInt(String(route.params.amount), 10),
    }),
    meta: { title: "2026 주휴수당 계산 결과 · 시급별 주휴수당" },
  },
  {
    path: "/wage-converter",
    name: "WageConverter",
    component: () => import("@/views/WageConverterView.vue"),
    meta: { title: pageTitle("/wage-converter") },
  },
  {
    path: "/wage-converter/:amount(\\d+)",
    name: "WageConverterLanding",
    component: () => import("@/views/WageConverterView.vue"),
    props: (route) => ({
      initialHourlyWage: Number.parseInt(String(route.params.amount), 10),
    }),
    meta: { title: "2026 시급 환산 결과 · 월급↔시급↔연봉" },
  },
  {
    path: "/severance-pay",
    name: "SeverancePay",
    component: () => import("@/views/SeverancePayView.vue"),
    meta: { title: pageTitle("/severance-pay") },
  },
  {
    path: "/severance-pay/:amount(\\d+)",
    name: "SeverancePayLanding",
    component: () => import("@/views/SeverancePayView.vue"),
    props: (route) => ({
      initialYears: Number.parseInt(String(route.params.amount), 10),
    }),
    meta: { title: "2026 퇴직금 계산 결과 · 월급별 퇴직금" },
  },
  {
    path: "/all",
    name: "AllCalculators",
    component: () => import("@/views/AllCalculatorsView.vue"),
    meta: { title: pageTitle("/all") },
  },
  {
    // 2027년 달라지는 세금·지원금 — 계산기가 아닌 안내 페이지(seo-routes NON_CALCULATOR_ROUTES).
    // 경로는 리터럴로 둔다: validate-static-output이 라우터 소스의 path 문자열로 사이트맵을 대조한다.
    path: "/2027",
    name: "Changes2027",
    component: () => import("@/views/Changes2027View.vue"),
    meta: { title: pageTitle("/2027") },
  },
  {
    path: "/guide/resignation",
    name: "GuideResignation",
    component: () => import("@/views/ScenarioChainView.vue"),
    props: { slug: "resignation" },
    meta: { title: pageTitle("/guide/resignation") },
  },
  {
    path: "/guide/job-change",
    name: "GuideJobChange",
    component: () => import("@/views/ScenarioChainView.vue"),
    props: { slug: "job-change" },
    meta: { title: pageTitle("/guide/job-change") },
  },
  {
    path: "/guide/year-end",
    name: "GuideYearEnd",
    component: () => import("@/views/ScenarioChainView.vue"),
    props: { slug: "year-end" },
    meta: { title: pageTitle("/guide/year-end") },
  },
  {
    path: "/guide/part-time",
    name: "GuidePartTime",
    component: () => import("@/views/ScenarioChainView.vue"),
    props: { slug: "part-time" },
    meta: { title: pageTitle("/guide/part-time") },
  },
  {
    path: "/about",
    name: "About",
    component: () => import("@/views/AboutView.vue"),
    meta: { title: pageTitle("/about") },
  },
  {
    path: "/terms",
    name: "Terms",
    component: () => import("@/views/TermsView.vue"),
    meta: { title: pageTitle("/terms") },
  },
  {
    path: "/privacy",
    name: "Privacy",
    component: () => import("@/views/PrivacyView.vue"),
    meta: { title: pageTitle("/privacy") },
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("@/views/NotFoundView.vue"),
    meta: { title: NOT_FOUND_TITLE },
  },
];

// 앵커 여백은 index.html의 두 토큰에서 나온다. 여기에 80을 박아두면 데스크톱에선
// 과하고 모바일에선 모자란다. CSS의 scroll-padding-top과 같은 식을 쓴다
// (v3 §3.1): --header-h + --secondary-nav-h + 8px.
function anchorOffset(): number {
  if (typeof window === "undefined") return 80;
  const styles = getComputedStyle(document.documentElement);
  const rem = parseFloat(styles.fontSize) || 16;
  const toPx = (raw: string): number => {
    const trimmed = raw.trim();
    if (!trimmed) return 0;
    const value = parseFloat(trimmed);
    if (!Number.isFinite(value)) return 0;
    return trimmed.endsWith("rem") ? value * rem : value;
  };
  const total =
    toPx(styles.getPropertyValue("--header-h")) +
    toPx(styles.getPropertyValue("--secondary-nav-h")) +
    8;
  return total > 8 ? total : 80;
}

const router = createRouter({
  history: createWebHistory("/finance/"),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (to.hash) return { el: to.hash, behavior: "smooth", top: anchorOffset() };
    return { top: 0 };
  },
});

// meta.title은 접미사 없는 페이지 제목이다. 프리렌더·useSEO와 같은 brandTitle로 붙여
// 라우트 전환 직후(뷰 useHead가 덮기 전)에도 `<페이지 제목> | ShakiLabs` 레시피가 유지되게 한다.
function routeTitle(meta: { title?: unknown }): string {
  return brandTitle(typeof meta.title === "string" ? meta.title : pageTitle("/"));
}

router.beforeEach((to, _from, next) => {
  document.title = routeTitle(to.meta);
  next();
});

// 라우터 base가 "/finance/"라 홈에 들어오면 주소창에 끝 슬래시가 남는다.
// vercel.json은 trailingSlash:false라 "/finance/"는 308 대상이므로, 사용자가 복사·공유하는
// 주소와 canonical이 200을 주는 "/finance"가 되도록 초기 진입 시 한 번 정리한다.
// history.state는 그대로 넘겨 뒤로가기 동작을 깨뜨리지 않는다.
function normalizeTrailingSlash(): void {
  if (typeof window === "undefined") return;
  const { pathname, search, hash } = window.location;
  if (pathname.length <= 1 || !pathname.endsWith("/")) return;
  window.history.replaceState(
    window.history.state,
    "",
    `${pathname.replace(/\/+$/, "")}${search}${hash}`
  );
}

router.afterEach((to, from, failure) => {
  if (failure) return;
  normalizeTrailingSlash();
  clearRuntimeError();
  if (!shouldTrackPageView(to.path, from.path, from.matched.length > 0)) return;

  // GA page_title도 탭 제목과 같은 문자열 — 첫 로드(프리렌더 <title>)와 SPA 전환이 같은 형식으로 찍힌다
  const title = routeTitle(to.meta);
  void nextTick(() => {
    trackPageView(buildPublicPagePath("/finance", to.path), title);
  });
});

export default router;
