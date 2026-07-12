# 텍스트 배치 개선 결과

## 결과
- 대상: Finance 28개 라우트, 브라우저 125개 상태.
- 최종 판정: page overflow, 값·단위/컨트롤 줄바꿈, 텍스트 overflow, 고아줄, 슬라이더 오류 모두 0건.
- `npm run typecheck` → `npm test` → `npm run build` 통과, 71개 테스트와 ESLint 통과.

## 적용 내용
- `40시간`, 금액, 비율과 결과 제목의 어절을 분리하지 않고, 결과 Grid는 200%에서 한 열로 재배치했습니다.
- 시나리오 값·단위와 프리셋 버튼을 의미 단위로 묶고 긴 표는 내부 스크롤로 제한했습니다.
- 관련 서비스 제목과 일반 문장은 balance/pretty 정책으로 마지막 한 글자 고립을 제거했습니다.

## 관련 코드
- [responsive-accessibility.css](../../client/src/assets/css/responsive-accessibility.css)
- [ScenarioField.vue](../../client/src/components/scenario/ScenarioField.vue)
- [InsuranceResult.vue](../../client/src/components/insurance/InsuranceResult.vue)
- [BenefitStatGrid.vue](../../client/src/components/benefits/BenefitStatGrid.vue)
- [ParentalLeaveView.vue](../../client/src/views/ParentalLeaveView.vue)

근거: `../../../artifacts/text-layout-audit/final-consolidated-summary.json`, `../../../artifacts/text-layout-audit/computed-style-evidence.json`. 열린 이슈는 [issues.json](./issues.json)입니다.
