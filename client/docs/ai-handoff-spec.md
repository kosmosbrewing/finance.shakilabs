# Finance AI Handoff Spec

- 상태: Current codebase reference
- 마지막 코드 대조: 2026-07-14
- 공개 canonical: `https://shakilabs.com/finance`
- sitemap: 124 indexable URLs

## 1. 작업 원칙

이 문서는 신규 scaffold가 아니라 `02.finance/client` 유지보수용 기준이다. 작업 전에 `src/router/index.ts`, 대상 view·composable·test와 `scripts/seo-routes.mjs`를 읽는다.

- 기존 route, composable, 계산식, UI를 재구현하지 않는다.
- 금액·세율·보험료율은 기존 single source와 공식 출처를 사용한다.
- 공통 primitive는 `@shakilabs/ui` 공개 API를 우선한다.
- Header, Footer, SEO, 분석, 광고와 도메인 계산은 app-local로 유지한다.
- 다른 앱이나 root UI package 변경은 별도 작업으로 분리한다.

## 2. 현재 스택

- Vue 3, Vite, Vue Router, TypeScript
- Tailwind CSS 3 + app-local compatibility utilities
- `@shakilabs/ui` `0.3.7` exact vendored artifact
- `@unhead/vue` for title, canonical, OG, JSON-LD
- Radix Vue, CVA, Lucide for app-local interactive UI
- Zod for external input and URL query validation
- Vitest, ESLint, vue-tsc
- Sentry and GA4 when the corresponding environment variables are configured

`@vueuse/head`는 사용하지 않는다. 차트 기본 구현은 SVG와 `ShBreakdownBar`이며 Chart.js는 Finance의 필수 의존성이 아니다.

## 3. 라우팅과 SEO

- `/`는 `/salary`로 이동한다.
- 주요 계산기에는 `/salary`, `/insurance`, `/comprehensive-tax`, `/freelancer`, `/freelance-rate`, `/withholding`, `/compare`, `/raise`, `/bonus`, `/annual-leave`, `/overtime`, `/pension`, `/monthly-rent-deduction`, `/irp`, `/4-insurance-employer`, `/quit`, `/parental-leave`, `/year-end-settlement`, `/unemployment`, `/regional-health`, `/weekly-holiday-pay`, `/wage-converter`, `/severance-pay`가 있다.
- `/all`, `/about`, `/privacy`, `/terms`는 탐색·신뢰 페이지다.
- 숫자 landing route와 legacy redirect는 router와 `seo-routes.mjs`를 함께 확인한다.
- unknown route는 `NotFoundView`와 noindex를 사용한다.

라우트 목록을 문서에 별도로 복제하지 않는다. `src/router/index.ts`가 runtime source, `scripts/seo-routes.mjs`가 indexable inventory source다.

## 4. 데이터와 계산

- 보험료율·시행일: `src/data/taxRates2026.ts`
- 소득세 구간: `src/data/taxBrackets.ts`
- 호환 상수: `src/lib/tax-constants.ts`
- 계산 로직: `src/composables`, `src/utils`
- 공식 근거와 검증 이력: `docs/tax-source-verification.md`

숫자를 view나 문서 프롬프트에 다시 하드코딩하지 않는다. 기준 변경 시 source URL, effective date, golden test와 사용자 화면의 기준일을 같이 갱신한다.

## 5. API와 환경변수

`client/.env.example`이 환경변수 source다. 주요 항목은 다음과 같다.

- `VITE_SITE_URL=https://shakilabs.com/finance`
- `VITE_API_BASE=/api/finance`
- `VITE_ENABLE_COMMENTS=false` by default
- `VITE_GA_MEASUREMENT_ID`, `VITE_GA_DEBUG`
- `VITE_SENTRY_DSN`
- AdSense publisher/slot IDs
- Kakao JS key and allowed hosts

댓글 기능은 enabled일 때 Express backend를 사용한다. 브라우저에서 Supabase를 직접 호출하지 않는다.

## 6. UI 경계

- 공통: `ShButton`, `ShSurface`, `ShText`, primary navigation, preset/slider, table/form primitives, `ShBreakdownBar`, `ShBulletProgress`
- app-local: 세금·보험 계산 form, 결과 해석, 출처, focus 관리형 alert/accordion, share, SEO, analytics
- 기존 retro utility는 호환 레이어로 유지하되 신규 공통 계약을 우회하는 별도 디자인 시스템을 만들지 않는다.
- 모바일 360px, 390px, 430px에서 결과 overflow와 44px control target을 확인한다.

## 7. Build와 배포

```bash
npm run typecheck
npm test
npm run build
```

`build`는 sitemap 생성, Vite build, route prerender, font manifest 검증을 수행한다. 필요 시 `npm run lint`도 실행한다.

Vercel은 `client/dist`의 route별 prerender HTML을 직접 제공한다. 모든 route를 `/index.html`로 보내는 catch-all rewrite를 추가하지 않는다.

## 8. 완료 조건

1. 계산 경계와 기존 regression test가 통과한다.
2. 변경 route의 title, description, H1, canonical, source가 일치한다.
3. `typecheck -> test -> build`가 모두 통과한다.
4. 데이터 변경이면 공식 source와 시행일을 기록한다.
5. UI 변경이면 mobile과 desktop을 확인한다.
6. 문서의 구현 주장이 실제 코드와 다르면 같은 PR에서 갱신한다.
