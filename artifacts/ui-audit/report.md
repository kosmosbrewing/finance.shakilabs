# UI 및 코드 품질 개선 결과

## 1. 요약
- 서비스: Finance; 초기 이슈 6개, 해결 5개, 잔여 1개.
- 현재 이슈: P0 0 / P1 0 / P2 1 / P3 0.
- 최종 gate: typecheck PASS, test PASS, build PASS, lint PASS.
- 브라우저: 1440x900 기본, 390x844 기본, 320x568 200% text의 대표 Critical 3개 조합 PASS.
- DOM: 상태 200, page overflow 0, h1 1개, visible unlabeled control 0, 좁은 텍스트 0, console/page/API 오류 0.
- Lighthouse 접근성 100, Best Practices 100.
- PC·태블릿·모바일 판정: 최종 대표 조합 PASS. 초기 전체 감사 증거는 로컬 raw artifact로 보존했습니다.
- 코드 판정: 기능 회귀 위험이 큰 대형 파일 분할만 별도 부채로 남았습니다.

## 2. 최종 검증
| 조합 | 결과 | 근거 |
|---|---|---|
| 1440x900 default | PASS | status·overflow·heading·label·console 자동 측정 |
| 390x844 default | PASS | 모바일 UI와 touch/text 재측정 |
| 320x568 text 200% | PASS | page width와 narrow text 재측정 |
| typecheck → test → build | PASS | 저장소 로컬 명령 |

- 추가 검증: 27개 모바일 대표 라우트에서 12px 미만 판단 텍스트 0, 24px 미만 독립 target 0, document overflow 0.
- 미검증: Firefox, WebKit, 실제 화면낭독기 발화, OS 글꼴 확대, 승인된 visual baseline, 운영 API 쓰기 동작.
- 최종 스크린샷: `../../../artifacts/ui-audit-all/screenshots/final/`.

## 3. 해결 이력
| ID | 초기 심각도 | 초기 문제 | 상태 |
|---|---|---|---|
| FIN-AUD-001 | P1 | 200% 텍스트 확대에서 입력·결과·표가 한 글자 폭 열로 축소됩니다. | resolved |
| FIN-AUD-002 | P1 | ScenarioField가 label을 렌더링하지만 text input·range와 연결하지 않아 한 화면에 unlabeled control 26개가 생깁니다. | resolved |
| FIN-AUD-003 | P2 | 공백 없는 긴 h1이 페이지 폭을 740px로 확장합니다. | resolved |
| FIN-AUD-004 | P2 | 모바일에서 12px 미만 텍스트 최대 78개, 24px 미만 조작 대상 최대 20개가 측정됩니다. | resolved |
| FIN-AUD-006 | P2 | 댓글 API 프록시가 반복적으로 500을 반환해 모든 주요 계산기에서 console error가 발생합니다. | resolved |

## 4. 열린 문제
전체 machine-readable 필드는 [issues.json](./issues.json)에 있습니다.

### FIN-AUD-005 · P2
- 제품 소스 12개가 300줄 기준을 초과합니다.
- 현재: client/src/components/quit/QuitInput.vue 485줄, client/src/views/ComprehensiveTaxView.vue 471줄, client/src/assets/css/main.css 443줄, client/src/components/common/DateRangePicker.vue 443줄, client/src/views/InsuranceView.vue 442줄, client/src/views/QuitView.vue 429줄, client/src/router/index.ts 390줄, client/src/composables/useComprehensiveTaxCalc.ts 372줄, client/src/views/CompareView.vue 338줄, client/src/components/insurance/InsuranceInput.vue 322줄, client/src/components/comprehensive-tax/IncomeSourceInput.vue 316줄, client/src/components/comment/MiniCommentPanel.vue 314줄
- 최소 계획: 동작 변경 없이 테스트 가능한 도메인 경계부터 별도 계획으로 분리하고 각 단계에서 visual·unit 회귀 검증을 수행합니다.
- 회귀 위험: high; 검증: 파일 줄 수 재측정, typecheck, test, build와 대표 화면 visual 비교

## 5. 검증 한계
- Lighthouse는 대표 Critical 화면만 검사하며 수동 접근성 검사를 대체하지 않습니다.
- 운영 백엔드·외부 데이터 성공을 추정하지 않았고, 개발 기본값은 명시적 local/offline 상태로 검증했습니다.
- raw screenshots·Lighthouse JSON·임시 스크립트는 .gitignore로 제외하고 본 보고서와 issues.json만 추적합니다.
