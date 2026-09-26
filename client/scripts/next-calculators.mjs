// "다음에 할 계산" 카드의 단일 출처.
//
// 이 파일은 화면(src/components/finance/FinanceNextActions.vue → 패키지 ShNextActions)과
// 프리렌더(scripts/prerender-content.mjs) 양쪽이 같이 읽는다. 두 벌로 나누면 크롤러가 받은
// 문장과 독자가 보는 문장이 갈린다. 한 벌만 둔다.
//
// 카드 문장에는 계산 결과를 넣지 않는다. 미리 계산 값은 입력 상태에 따라 달라지므로
// 프리렌더 HTML에 박아 두면 "독자가 바꾼 입력"에 대해 거짓을 말하게 된다. 값과 그 가정(note)은
// 화면에서만 붙인다.

/** @typedef {"regional-health"|"regional-health-voluntary"|"dependent"|"salary"|"insurance"|"comprehensive-tax"|"year-end-settlement"} NextCalculatorKey */

// 화면 블록 제목(ShNextActions 기본값)과 글자까지 같아야 한다. 하이드레이션 때 프리렌더 본문은
// 화면에 같은 제목이 있는 구간만 걷어내므로(src/utils/prerenderFallback.ts), 다르면 옛 카드 목록이
// 페이지 아래에 한 번 더 붙는다. nextCalculators.test.ts가 패키지를 렌더해 대조한다.
export const NEXT_CALCULATORS_HEADING = "이어서 계산하기";

// note는 미리 계산 값이 없는 카드에만 둔다(설명을 한 줄로). 값이 있는 카드는 그 값의 가정이
// note가 되는데, 가정은 입력 상태에 따라 달라 화면(FinanceNextActions.vue)에서만 붙인다.
export const NEXT_CALCULATOR_CARDS = {
  "regional-health": {
    route: "/regional-health",
    title: "퇴사하면 건보료가 얼마가 되나",
  },
  "regional-health-voluntary": {
    route: "/regional-health",
    title: "임의계속가입이 유리한지 비교",
  },
  dependent: {
    route: "/dependent",
    title: "가족을 피부양자로 올릴 수 있나",
    note: "소득 2,000만원 · 재산 과세표준 5억4천만원 요건",
  },
  salary: {
    route: "/salary",
    title: "이 연봉의 월 실수령액 전체",
  },
  insurance: {
    route: "/insurance",
    title: "건보료로 연봉을 거꾸로 확인",
  },
  "comprehensive-tax": {
    route: "/comprehensive-tax",
    title: "근로소득 외 소득의 종합소득세",
    note: "부업·프리랜서·임대 소득 합산 시 추가 세금",
  },
  "year-end-settlement": {
    route: "/year-end-settlement",
    title: "연말정산 환급인지 추가납부인지",
    note: "카드 사용액·공제 항목으로 2월 정산액 미리 확인",
  },
};

// 고액 구간의 기준. 월 건보료 30만원은 보수월액 약 834만원(연 1억)에 대응하고, 그 위에서는
// 퇴사 시 지역가입자보다 임의계속가입 쪽 절감액이 커져 비교 순서가 뒤집힌다.
export const HIGH_FEE_THRESHOLD = 300_000;
export const HIGH_GROSS_THRESHOLD = 100_000_000;

/**
 * 결과 상태 -> 카드 3개. 순수 함수라 프리렌더와 화면이 같은 답을 낸다.
 * @param {{mode: "insurance"|"salary", healthInsuranceFee?: number, annualGross?: number, dependents?: number}} state
 * @returns {NextCalculatorKey[]}
 */
export function pickNextCalculators(state) {
  if (state.mode === "salary") {
    return (state.annualGross ?? 0) >= HIGH_GROSS_THRESHOLD
      ? ["comprehensive-tax", "year-end-settlement", "regional-health"]
      : ["insurance", "year-end-settlement", "regional-health"];
  }

  if ((state.healthInsuranceFee ?? 0) >= HIGH_FEE_THRESHOLD) {
    return ["regional-health-voluntary", "salary", "comprehensive-tax"];
  }
  // 부양가족을 이미 등록한 사람에게는 "가족을 올릴 수 있나"가 첫 질문이다.
  if ((state.dependents ?? 1) >= 2) {
    return ["dependent", "regional-health", "salary"];
  }
  return ["regional-health", "dependent", "salary"];
}

// 프리렌더 HTML에 박히는 기본 상태 = /insurance 첫 진입 상태
// (src/data/insurancePresets.ts의 DEFAULT_INSURANCE_PRESET, 부양가족 1명).
export const INSURANCE_DEFAULT_STATE = {
  mode: /** @type {const} */ ("insurance"),
  healthInsuranceFee: 140_000,
  dependents: 1,
};
