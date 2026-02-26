# Salary Calculator AI Handoff Spec (Current Codebase Reference)

## 0. Read First

이 문서는 **신규 프로젝트 생성 가이드가 아니라, 기존 프로젝트 참조 스펙**이다.  
작업 시작 시 반드시 현재 코드베이스를 먼저 파악하고, **이미 구현된 기능은 재구현하지 말고 부족한 부분만 수정/추가**한다.

- 금지: "처음부터 새로 만들기", 기존 라우트/컴포넌트/컴포저블 중복 생성
- 원칙: 기존 구조 재사용 + 점진적 개선

## 1. Current Baseline (Already Implemented)

- 라우트
  - `/insurance`, `/salary`, `/compare`, `/quit` + 상세 SEO 라우트
  - `/` 는 `/insurance`로 리다이렉트
- 핵심 composables
  - `useInsuranceReverse.ts`, `useRetirementCalc.ts`, `useUnemploymentCalc.ts`, `useSurvivalCalc.ts`, `useSalaryCalc.ts` 등
- 공통 컴포넌트
  - `TickerBar`, `TabNavigation`, `FreshBadge`, `ShareModal`, `AdSlot`, `VisitorCounter`, `MiniCommentPanel`
- SEO/SSG
  - `scripts/seo-routes.mjs`, `scripts/generate-sitemap.mjs`, `scripts/prerender.mjs`
- Analytics
  - GA4 연동 (`src/lib/analytics.ts`)

## 2. Tech Stack (Actual)

- Frontend: Vue 3 + Vite + Vue Router + TypeScript
- Styling: TailwindCSS + custom retro utility classes
- Head/SEO: `@vueuse/head`
- UI primitives: `radix-vue`
- Icons: `lucide-vue-next`
- Validation: `zod`
- Comment API: `VITE_API_BASE`를 통한 **Express backend API**

> 본 프로젝트는 `.js`가 아닌 `.ts`/`.vue` 기준으로 유지한다.

## 3. Environment Variables (Actual)

`client/.env.example` 기준:

- `VITE_GA_MEASUREMENT_ID`
- `VITE_GA_DEBUG`
- `VITE_ADSENSE_PUBLISHER_ID`
- `VITE_ADSENSE_SLOT_TOP`
- `VITE_ADSENSE_SLOT_MIDDLE`
- `VITE_ADSENSE_SLOT_BOTTOM`
- `VITE_API_BASE`
- `VITE_KAKAO_JS_KEY`

Supabase 키(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)는 현재 기본 경로가 아니다.

## 4. API Architecture (Actual)

- 댓글 API는 프론트에서 `src/api/comments.ts` + `src/api/helpers.ts`를 통해 백엔드 호출
- 기본 흐름:
  - `GET {VITE_API_BASE}/comments`
  - `POST {VITE_API_BASE}/comments`
- Supabase 직접 호출 모델이 필요하면, 별도 마이그레이션 작업으로 명시한다.

## 5. Build/Deploy Pipeline (Actual)

- 개발: `npm run dev`
- 타입검사: `npm run typecheck`
- 빌드: `npm run build`
  - 내부적으로 `prebuild -> generate-sitemap -> vite build -> prerender`
- SSG 핵심 스크립트:
  - `scripts/seo-routes.mjs`
  - `scripts/generate-sitemap.mjs`
  - `scripts/prerender.mjs`

## 6. Route Map (Actual)

`src/router/index.ts` 기준:

- `/` -> `/insurance` redirect
- `/insurance`
- `/insurance/:amount(\\d+)`
- `/salary`
- `/salary/:amount`
- `/compare`
- `/compare/:a(\\d+)-vs-:b(\\d+)`
- `/quit`
- `/quit/:years(\\d+years)`  (예: `/quit/1years`)
- `/about`
- `/privacy`
- `/:pathMatch(.*)*`

## 7. Source Structure (Actual, TypeScript)

```txt
client/src/
  api/
    comments.ts
    helpers.ts
    types.ts
  composables/
    useAlert.ts
    useInsuranceCalc.ts
    useInsuranceReverse.ts
    useRetirementCalc.ts
    useSalaryCalc.ts
    useShare.ts
    useSEO.ts
    useSurvivalCalc.ts
    useUnemploymentCalc.ts
    useUrlParams.ts
    ...
  components/
    common/
    insurance/
    salary/
      HealthInsuranceRank.vue
      SalaryInputPanel.vue
      SalaryResultPanel.vue
      DeductionChart.vue
      DeductionTable.vue
      CalcSourceBox.vue
    compare/
    quit/
    share/
  data/
    taxRates2026.ts
    taxBrackets.ts
    ...
  lib/
    analytics.ts
    site.ts
    tax-constants.ts
    health-insurance-tiers.ts
    utils.ts
  utils/
    calculator.ts
  views/
    InsuranceView.vue
    SalaryView.vue
    SalaryLandingView.vue
    CompareView.vue
    QuitView.vue
    AboutView.vue
    PrivacyView.vue
    NotFoundView.vue
```

## 8. Design System (Actual)

프로젝트의 시각 정체성은 커스텀 retro 클래스 기반:

- `retro-panel`, `retro-panel-content`
- `retro-titlebar`, `retro-title`, `retro-kbd`
- `retro-board-list`, `retro-board-item`
- `retro-stat`, `retro-stat-label`, `retro-stat-value`

신규 UI는 위 클래스를 우선 재사용하고, 일반 Tailwind-only 스타일로 대체하지 않는다.

## 9. Data Single Source Rule

요율/세율은 코드 상수에서 단일 진실 원천을 유지한다.

- 기본 소스: `src/data/taxRates2026.ts`, `src/data/taxBrackets.ts`
- 호환/집계: `src/lib/tax-constants.ts`
- 프롬프트 문서 본문에 숫자를 중복 하드코딩하지 않는다.

## 10. Dependency Baseline (Actual)

`package.json` 기준 필수 의존성:

- `@vueuse/head`
- `radix-vue`
- `lucide-vue-next`
- `tailwindcss-animate`
- `class-variance-authority`
- `clsx`
- `tailwind-merge`
- `zod`

차트는 `chart.js`/`vue-chartjs`가 기본 의존성이 아니다. (`DeductionChart.vue`는 SVG 기반)

## 11. Work Instructions for Future AI Sessions

1. `src/router/index.ts`와 `src/composables`를 먼저 읽고 기존 흐름을 파악한다.
2. 기존 컴포넌트가 있으면 신규 생성보다 확장/수정한다.
3. API는 `VITE_API_BASE` 기반 Express 경로를 우선 따른다.
4. 변경 후 `npm run typecheck && npm run build`를 반드시 통과시킨다.
5. 문서/프롬프트는 본 스펙과 코드가 불일치하지 않도록 업데이트한다.

