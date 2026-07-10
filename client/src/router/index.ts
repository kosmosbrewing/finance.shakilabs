import { nextTick } from "vue";
import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { trackPageView } from "@/lib/analytics";
import { queryFirst } from "@/lib/routeState";
import { clearRuntimeError } from "@/lib/runtimeError";
import { buildPublicPagePath, shouldTrackPageView } from "@/utils/pageTracking";

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

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: "/salary",
  },
  {
    path: "/insurance",
    name: "Insurance",
    component: () => import("@/views/InsuranceView.vue"),
    props: { initialMode: "reverse" },
    meta: { title: "2026 건강보험료 연봉 계산기 | 4대보험" },
  },
  {
    path: "/insurance/:amount(\\d+)",
    name: "InsuranceDetail",
    component: () => import("@/views/InsuranceView.vue"),
    props: (route) => ({
      initialHealthInsuranceFee: Number.parseInt(String(route.params.amount), 10),
      initialMode: "reverse",
    }),
    meta: { title: "2026 건보료 계산 결과 | 건강보험료 계산기" },
  },
  {
    path: "/salary",
    name: "SalaryHome",
    component: () => import("@/views/InsuranceView.vue"),
    props: { initialMode: "forward" },
    meta: { title: "2026 연봉 실수령액 계산기 | 4대보험 + 소득세 자동 계산" },
  },
  {
    path: "/salary/:amount",
    name: "SalaryLanding",
    component: () => import("@/views/SalaryLandingView.vue"),
    meta: { title: "2026 연봉 실수령액 계산기 | 월급 계산" },
  },
  {
    path: "/comprehensive-tax",
    name: "ComprehensiveTax",
    component: () => import("@/views/ComprehensiveTaxView.vue"),
    meta: { title: "2026 종합소득세 계산기 | 프리랜서·사업소득 세금" },
  },
  {
    path: "/comprehensive-tax/:amount(\\d+)",
    name: "ComprehensiveTaxLanding",
    component: () => import("@/views/ComprehensiveTaxView.vue"),
    props: (route) => ({
      initialBusinessAmountManWon: Number.parseInt(String(route.params.amount), 10),
    }),
    meta: { title: "2026 종합소득세 계산 결과 | 프리랜서 세금 계산기" },
  },
  {
    path: "/freelance-rate",
    name: "FreelanceRate",
    component: () => import("@/views/FreelanceRateView.vue"),
    meta: { title: "2026 프리랜서 세후 단가 역산 계산기 | 원천세 제외 실수령" },
  },
  {
    path: "/freelancer",
    name: "Freelancer",
    component: () => import("@/views/ComprehensiveTaxView.vue"),
    props: { isFreelancerRoute: true },
    meta: { title: "2026 프리랜서 세금 계산기 | 3.3% 종합소득세" },
  },
  {
    path: "/freelancer/:amount(\\d+)",
    name: "FreelancerLanding",
    component: () => import("@/views/ComprehensiveTaxView.vue"),
    props: (route) => ({
      isFreelancerRoute: true,
      initialBusinessAmountManWon: Number.parseInt(String(route.params.amount), 10),
    }),
    meta: { title: "2026 프리랜서 세금 계산 결과 | 종합소득세 계산기" },
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
    meta: { title: "2026 이직 연봉 비교 계산기 | 실수령액 차이 비교" },
  },
  {
    path: "/raise",
    name: "Raise",
    component: () => import("@/views/RaiseView.vue"),
    meta: { title: "2026 연봉 인상률 계산기 | 연봉 협상 실수령액 비교" },
  },
  {
    path: "/bonus",
    name: "Bonus",
    component: () => import("@/views/BonusView.vue"),
    meta: { title: "2026 성과급 실수령 계산기 | 상여금 세금·4대보험 공제" },
  },
  {
    path: "/annual-leave",
    name: "AnnualLeave",
    component: () => import("@/views/AnnualLeaveView.vue"),
    meta: { title: "2026 연차 수당 계산기 | 미사용 연차 보상금 계산" },
  },
  {
    path: "/overtime",
    name: "Overtime",
    component: () => import("@/views/OvertimeView.vue"),
    meta: { title: "2026 연장·야간·휴일수당 계산기 | 초과근무 수당 계산" },
  },
  {
    path: "/pension",
    name: "Pension",
    component: () => import("@/views/PensionView.vue"),
    meta: { title: "2026 국민연금 수령액 계산기 | 예상 연금액·납부액 조회" },
  },
  {
    path: "/monthly-rent-deduction",
    name: "MonthlyRentDeduction",
    component: () => import("@/views/MonthlyRentDeductionView.vue"),
    meta: { title: "2026 월세 세액공제 계산기 | 연말정산 월세 환급액" },
  },
  {
    path: "/irp",
    name: "Irp",
    component: () => import("@/views/IrpView.vue"),
    meta: { title: "2026 IRP 세액공제 계산기 | 개인형 퇴직연금 절세 효과" },
  },
  {
    path: "/4-insurance-employer",
    name: "InsuranceEmployer",
    component: () => import("@/views/InsuranceEmployerView.vue"),
    meta: { title: "2026 사업주 4대보험 계산기 | 고용주 부담금·인건비 계산" },
  },
  {
    path: "/compare/:a(\\d+)-vs-:b(\\d+)",
    name: "CompareDetail",
    component: () => import("@/views/CompareView.vue"),
    props: (route) => ({
      initialAManWon: Number.parseInt(String(route.params.a), 10),
      initialBManWon: Number.parseInt(String(route.params.b), 10),
    }),
    meta: { title: "2026 연봉 비교 결과 | 이직 실수령 차이 계산" },
  },
  {
    path: "/withholding",
    name: "Withholding",
    component: () => import("@/views/WithholdingView.vue"),
    meta: { title: "2026 원천세 계산기 | 소득세로 연봉 추정" },
  },
  {
    path: "/withholding/:amount(\\d+)",
    name: "WithholdingDetail",
    component: () => import("@/views/WithholdingView.vue"),
    props: (route) => ({
      initialAmountWon: Number.parseInt(String(route.params.amount), 10),
    }),
    meta: { title: "2026 원천세 계산 결과 | 연봉 추정 계산기" },
  },
  {
    path: "/quit",
    name: "Quit",
    component: () => import("@/views/QuitView.vue"),
    meta: { title: "2026 퇴사 계산기 | 퇴직금·실업급여·생존기간" },
  },
  {
    path: "/quit/:years(\\d+years)",
    name: "QuitDetail",
    component: () => import("@/views/QuitView.vue"),
    props: (route) => ({
      initialYears: Number.parseInt(String(route.params.years).replace("years", ""), 10),
    }),
    meta: { title: "2026 퇴사 시뮬레이션 결과 | 퇴직금·실업급여 계산" },
  },
  {
    path: "/parental-leave",
    name: "ParentalLeave",
    component: () => import("@/views/ParentalLeaveView.vue"),
    meta: { title: "2026 육아휴직 급여 계산기 | 6+6 부모육아휴직제" },
  },
  {
    path: "/parental-leave/:amount(\\d+)",
    name: "ParentalLeaveLanding",
    component: () => import("@/views/ParentalLeaveView.vue"),
    props: (route) => ({
      initialWage: Number.parseInt(String(route.params.amount), 10) * 10_000,
    }),
    meta: { title: "2026 육아휴직 급여 계산 결과 | 월별 수령액" },
  },
  {
    path: "/year-end-settlement",
    name: "YearEndSettlement",
    component: () => import("@/views/YearEndSettlementView.vue"),
    meta: { title: "2026 연말정산 계산기 | 환급액·세액공제 시뮬레이터" },
  },
  {
    path: "/year-end-settlement/:amount(\\d+)",
    name: "YearEndSettlementLanding",
    component: () => import("@/views/YearEndSettlementView.vue"),
    props: (route) => ({
      initialSalary: Number.parseInt(String(route.params.amount), 10) * 10_000,
    }),
    meta: { title: "2026 연말정산 계산 결과 | 연봉별 환급액" },
  },
  {
    path: "/unemployment",
    name: "Unemployment",
    component: () => import("@/views/UnemploymentView.vue"),
    meta: { title: "2026 실업급여 계산기 | 구직급여 수급액·수급기간" },
  },
  {
    path: "/unemployment/:amount(\\d+)",
    name: "UnemploymentLanding",
    component: () => import("@/views/UnemploymentView.vue"),
    props: (route) => ({
      initialSalary: Number.parseInt(String(route.params.amount), 10) * 10_000,
    }),
    meta: { title: "2026 실업급여 계산 결과 | 월급별 수급액" },
  },
  {
    path: "/regional-health",
    name: "RegionalHealth",
    component: () => import("@/views/RegionalHealthView.vue"),
    meta: { title: "2026 지역가입자 건강보험료 계산기 | 퇴사 후 건보 비교" },
  },
  {
    path: "/regional-health/:amount(\\d+)",
    name: "RegionalHealthLanding",
    component: () => import("@/views/RegionalHealthView.vue"),
    props: (route) => ({
      initialSalary: Number.parseInt(String(route.params.amount), 10) * 10_000,
    }),
    meta: { title: "2026 지역가입자 건보료 계산 결과 | 퇴사 후 보험료" },
  },
  {
    path: "/weekly-holiday-pay",
    name: "WeeklyHolidayPay",
    component: () => import("@/views/WeeklyHolidayPayView.vue"),
    meta: { title: "2026 주휴수당 계산기 | 아르바이트 주휴수당·실질 시급" },
  },
  {
    path: "/weekly-holiday-pay/:amount(\\d+)",
    name: "WeeklyHolidayPayLanding",
    component: () => import("@/views/WeeklyHolidayPayView.vue"),
    props: (route) => ({
      initialHourlyWage: Number.parseInt(String(route.params.amount), 10),
    }),
    meta: { title: "2026 주휴수당 계산 결과 | 시급별 주휴수당" },
  },
  {
    path: "/wage-converter",
    name: "WageConverter",
    component: () => import("@/views/WageConverterView.vue"),
    meta: { title: "2026 시급 월급 연봉 환산기 | 주휴수당 포함·미포함" },
  },
  {
    path: "/wage-converter/:amount(\\d+)",
    name: "WageConverterLanding",
    component: () => import("@/views/WageConverterView.vue"),
    props: (route) => ({
      initialHourlyWage: Number.parseInt(String(route.params.amount), 10),
    }),
    meta: { title: "2026 시급 환산 결과 | 월급↔시급↔연봉" },
  },
  {
    path: "/severance-pay",
    name: "SeverancePay",
    component: () => import("@/views/SeverancePayView.vue"),
    meta: { title: "2026 퇴직금 계산기 | 퇴직소득세·실수령 퇴직금" },
  },
  {
    path: "/severance-pay/:amount(\\d+)",
    name: "SeverancePayLanding",
    component: () => import("@/views/SeverancePayView.vue"),
    props: (route) => ({
      initialYears: Number.parseInt(String(route.params.amount), 10),
    }),
    meta: { title: "2026 퇴직금 계산 결과 | 월급별 퇴직금" },
  },
  {
    path: "/all",
    name: "AllCalculators",
    component: () => import("@/views/AllCalculatorsView.vue"),
    meta: { title: "2026 세금·연봉·수당 계산기 모음 | 23개 계산기" },
  },
  {
    path: "/about",
    name: "About",
    component: () => import("@/views/AboutView.vue"),
    meta: { title: "서비스 안내 | 2026 연봉·건보료 계산기" },
  },
  {
    path: "/terms",
    name: "Terms",
    component: () => import("@/views/TermsView.vue"),
    meta: { title: "이용약관 | 2026 연봉·건보료 계산기" },
  },
  {
    path: "/privacy",
    name: "Privacy",
    component: () => import("@/views/PrivacyView.vue"),
    meta: { title: "개인정보 처리방침 | 2026 연봉 실수령액 계산기" },
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("@/views/NotFoundView.vue"),
    meta: { title: "페이지를 찾을 수 없습니다 | ShakiLabs" },
  },
];

const router = createRouter({
  history: createWebHistory("/finance/"),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (to.hash) return { el: to.hash, behavior: "smooth", top: 80 };
    return { top: 0 };
  },
});

router.beforeEach((to, _from, next) => {
  const title =
    typeof to.meta.title === "string"
      ? to.meta.title
      : "2026 연봉·세금·수당 계산기 | 실수령액·4대보험 계산";
  document.title = title;
  next();
});

router.afterEach((to, from, failure) => {
  if (failure) return;
  clearRuntimeError();
  if (!shouldTrackPageView(to.path, from.path, from.matched.length > 0)) return;

  const title = typeof to.meta.title === "string" ? to.meta.title : document.title;
  void nextTick(() => {
    trackPageView(buildPublicPagePath("/finance", to.path), title);
  });
});

export default router;
