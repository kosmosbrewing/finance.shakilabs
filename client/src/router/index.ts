import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { trackPageView } from "@/lib/analytics";
import { queryFirst } from "@/lib/routeState";

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
    redirect: "/insurance",
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
    meta: { title: "프리랜서 세후 단가 역산 계산기 | 2026 finance.shakilabs" },
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
    meta: { title: "연봉 협상 인상률 실수령 계산기 | 2026 finance.shakilabs" },
  },
  {
    path: "/bonus",
    name: "Bonus",
    component: () => import("@/views/BonusView.vue"),
    meta: { title: "성과급 실수령 계산기 | 2026 finance.shakilabs" },
  },
  {
    path: "/annual-leave",
    name: "AnnualLeave",
    component: () => import("@/views/AnnualLeaveView.vue"),
    meta: { title: "연차 수당 계산기 | 2026 finance.shakilabs" },
  },
  {
    path: "/overtime",
    name: "Overtime",
    component: () => import("@/views/OvertimeView.vue"),
    meta: { title: "연장·야간·휴일수당 계산기 | 2026 finance.shakilabs" },
  },
  {
    path: "/pension",
    name: "Pension",
    component: () => import("@/views/PensionView.vue"),
    meta: { title: "국민연금 예상 수령액 계산기 | 2026 finance.shakilabs" },
  },
  {
    path: "/monthly-rent-deduction",
    name: "MonthlyRentDeduction",
    component: () => import("@/views/MonthlyRentDeductionView.vue"),
    meta: { title: "월세 세액공제 계산기 | 2026 finance.shakilabs" },
  },
  {
    path: "/irp",
    name: "Irp",
    component: () => import("@/views/IrpView.vue"),
    meta: { title: "IRP 세액공제 계산기 | 2026 finance.shakilabs" },
  },
  {
    path: "/4-insurance-employer",
    name: "InsuranceEmployer",
    component: () => import("@/views/InsuranceEmployerView.vue"),
    meta: { title: "사업주 4대보험 부담금 계산기 | 2026 finance.shakilabs" },
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
    path: "/about",
    name: "About",
    component: () => import("@/views/AboutView.vue"),
    meta: { title: "서비스 안내 | 2026 연봉·건보료 계산기" },
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
  history: createWebHistory(),
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
      : "2026 finance.shakilabs | 연봉·세금·수당 계산기";
  document.title = title;
  next();
});

router.afterEach((to, _from, failure) => {
  if (failure) return;
  const title = typeof to.meta.title === "string" ? to.meta.title : document.title;
  trackPageView(to.fullPath, title);
});

export default router;
