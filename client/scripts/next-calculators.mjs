// "다음에 할 계산" 카드의 단일 출처.
//
// 이 파일은 화면(src/components/finance/FinanceNextActions.vue)과 프리렌더
// (scripts/prerender-content.mjs) 양쪽이 같이 읽는다. 두 벌로 나누면 크롤러가 받은 문장과
// 독자가 보는 문장이 갈리고, 하이드레이션 생존율 게이트가 그때서야 빨개진다. 한 벌만 둔다.
//
// 카드 문장에는 계산 결과를 넣지 않는다. 미리 계산 값은 입력 상태에 따라 달라지므로
// 프리렌더 HTML에 박아 두면 "독자가 바꾼 입력"에 대해 거짓을 말하게 된다. 숫자는 화면에서만
// 붙이고, 그 가정도 같은 줄에 적는다.

/** @typedef {"regional-health"|"regional-health-voluntary"|"dependent"|"salary"|"insurance"|"comprehensive-tax"|"year-end-settlement"} NextCalculatorKey */

export const NEXT_CALCULATORS_HEADING = "이 결과로 다음 계산 이어가기";
export const NEXT_CALCULATORS_INTRO =
  "지금 화면의 결과를 그대로 이어받아, 이 다음에 확인하면 좋은 계산 세 가지를 골랐습니다.";

export const NEXT_CALCULATOR_CARDS = {
  "regional-health": {
    route: "/regional-health",
    title: "퇴사하면 건보료가 얼마가 되나",
    question:
      "직장을 그만두면 지역가입자와 임의계속가입 중 어느 쪽이 싼지 두 금액을 나란히 계산합니다.",
  },
  "regional-health-voluntary": {
    route: "/regional-health",
    title: "임의계속가입이 유리한지 비교",
    question:
      "퇴사 후 최대 36개월간 직장 보험료를 유지하는 임의계속가입과 지역가입자 보험료를 비교합니다.",
  },
  dependent: {
    route: "/dependent",
    title: "가족을 피부양자로 올릴 수 있나",
    question:
      "연 합산소득 2,000만원과 재산 과세표준 5억4천만원 요건으로 피부양자 자격을 판정합니다.",
  },
  salary: {
    route: "/salary",
    title: "이 연봉의 월 실수령액 전체",
    question:
      "4대보험과 소득세를 모두 뺀 뒤 통장에 실제로 들어오는 금액을 항목별로 확인합니다.",
  },
  insurance: {
    route: "/insurance",
    title: "건보료로 연봉을 거꾸로 확인",
    question:
      "급여명세서의 건강보험료만으로 회사가 신고한 보수월액과 추정 연봉을 역산합니다.",
  },
  "comprehensive-tax": {
    route: "/comprehensive-tax",
    title: "근로소득 외 소득의 종합소득세",
    question:
      "부업·프리랜서·임대 소득을 합산했을 때 추가로 내야 할 세금을 미리 계산합니다.",
  },
  "year-end-settlement": {
    route: "/year-end-settlement",
    title: "연말정산 환급인지 추가납부인지",
    question:
      "카드 사용액과 공제 항목을 넣어 2월에 돌려받거나 더 낼 금액을 미리 확인합니다.",
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
