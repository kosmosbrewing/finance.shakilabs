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
    meta: { title: "2026 건강보험료로 연봉 계산기 | 4대보험" },
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
    meta: { title: "2026 연봉 실수령액 계산기 | 4대보험 계산" },
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
    meta: { title: "서비스 소개 | 2026 연봉·세금 계산기" },
  },
  {
    path: "/privacy",
    name: "Privacy",
    component: () => import("@/views/PrivacyView.vue"),
    meta: { title: "개인정보처리방침 | 연봉 실수령액 계산기" },
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("@/views/NotFoundView.vue"),
    meta: { title: "페이지를 찾을 수 없습니다 | finance.shakilabs.com" },
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
      : "2026 연봉 실수령액 계산기 | 건보료 계산·4대보험·종합소득세";
  document.title = title;
  next();
});

router.afterEach((to, _from, failure) => {
  if (failure) return;
  const title = typeof to.meta.title === "string" ? to.meta.title : document.title;
  trackPageView(to.fullPath, title);
});

export default router;
