import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { trackPageView } from "@/lib/analytics";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: "/insurance",
  },
  {
    path: "/insurance",
    name: "Insurance",
    component: () => import("@/views/InsuranceView.vue"),
    meta: { title: "2026 건보료로 연봉 추정 | 4대보험 계산기" },
  },
  {
    path: "/insurance/:amount(\\d+)",
    name: "InsuranceDetail",
    component: () => import("@/views/InsuranceView.vue"),
    props: (route) => ({
      initialHealthInsuranceFee: Number.parseInt(String(route.params.amount), 10),
    }),
    meta: { title: "건보료로 연봉 추정 | 2026 연봉 계산기" },
  },
  {
    path: "/salary",
    name: "SalaryHome",
    component: () => import("@/views/SalaryView.vue"),
    meta: { title: "2026 연봉 실수령액 계산기 | 4대보험 계산" },
  },
  {
    path: "/salary/:amount",
    name: "SalaryLanding",
    component: () => import("@/views/SalaryLandingView.vue"),
    meta: { title: "연봉 실수령액 계산" },
  },
  {
    path: "/compare",
    name: "Compare",
    component: () => import("@/views/CompareView.vue"),
    meta: { title: "이직 연봉 비교기 | A사 vs B사 실수령 차이 계산" },
  },
  {
    path: "/compare/:a(\\d+)-vs-:b(\\d+)",
    name: "CompareDetail",
    component: () => import("@/views/CompareView.vue"),
    props: (route) => ({
      initialAManWon: Number.parseInt(String(route.params.a), 10),
      initialBManWon: Number.parseInt(String(route.params.b), 10),
    }),
    meta: { title: "이직 연봉 비교기 | A사 vs B사 실수령 차이 계산" },
  },
  {
    path: "/quit",
    name: "Quit",
    component: () => import("@/views/QuitView.vue"),
    meta: { title: "퇴사 시뮬레이터 | 퇴직금·실업급여·생존 계산" },
  },
  {
    path: "/quit/:years(\\d+years)",
    name: "QuitDetail",
    component: () => import("@/views/QuitView.vue"),
    props: (route) => ({
      initialYears: Number.parseInt(String(route.params.years).replace("years", ""), 10),
    }),
    meta: { title: "퇴사 시뮬레이터 | 퇴직금·실업급여·생존 계산" },
  },
  {
    path: "/about",
    name: "About",
    component: () => import("@/views/AboutView.vue"),
    meta: { title: "서비스 소개 | finance.shakilabs.com" },
  },
  {
    path: "/privacy",
    name: "Privacy",
    component: () => import("@/views/PrivacyView.vue"),
    meta: { title: "개인정보처리방침 | finance.shakilabs.com" },
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
      : "2026 연봉·건보료·4대보험 계산기";
  document.title = title;
  next();
});

router.afterEach((to, _from, failure) => {
  if (failure) return;
  const title = typeof to.meta.title === "string" ? to.meta.title : document.title;
  trackPageView(to.fullPath, title);
});

export default router;
