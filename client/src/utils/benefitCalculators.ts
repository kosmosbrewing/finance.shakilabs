import { LOCAL_INCOME_TAX_RATE, RATES_2026 } from "@/data/taxRates2026";

export type AnnualLeaveInput = {
  monthlySalary: number;
  fixedAllowance: number;
  monthsWorked: number;
  unusedLeaveDays: number;
};

export type PensionInput = {
  averageMonthlyIncome: number;
  insuredYears: number;
  claimAge: number;
};

export type MonthlyRentDeductionInput = {
  annualSalary: number;
  monthlyRent: number;
  paidMonths: number;
};

export type IrpInput = {
  annualSalary: number;
  pensionSavings: number;
  irpContribution: number;
};

export type EmployerInsuranceInput = {
  monthlySalary: number;
  employmentRatePercent: number;
  accidentRatePercent: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function getAnnualLeaveDays(monthsWorked: number): number {
  const safeMonths = clamp(Math.floor(monthsWorked), 1, 600);
  if (safeMonths < 12) return Math.min(11, safeMonths);
  const serviceYears = Math.floor(safeMonths / 12);
  return Math.min(25, 15 + Math.floor(Math.max(0, serviceYears - 1) / 2));
}

export function calculateAnnualLeavePay(input: AnnualLeaveInput) {
  const ordinaryMonthly = Math.max(0, input.monthlySalary + input.fixedAllowance);
  const dailyOrdinaryWage = Math.floor((ordinaryMonthly / 209) * 8);
  const accruedLeaveDays = getAnnualLeaveDays(input.monthsWorked);
  const payableDays = Math.min(input.unusedLeaveDays, accruedLeaveDays);
  const totalAllowance = dailyOrdinaryWage * payableDays;

  return { dailyOrdinaryWage, accruedLeaveDays, payableDays, totalAllowance };
}

const pensionAgeFactors: Record<number, number> = {
  60: 0.7,
  61: 0.76,
  62: 0.82,
  63: 0.88,
  64: 0.94,
  65: 1,
  66: 1.072,
  67: 1.144,
  68: 1.216,
  69: 1.288,
  70: 1.36,
};

/**
 * 기준소득월액 상한 위의 소득은 보험료에도 연금액에도 반영되지 않는다.
 * 근거를 순서대로 두면:
 *  - 국민연금법 제3조제1항제5호 - "기준소득월액"이란 연금보험료와 급여를 산정하기 위하여
 *    국민연금가입자의 소득월액을 기준으로 하여 정하는 금액. 보험료와 급여가 같은 값을 쓴다.
 *  - 국민연금법 제3조제4항 - 기준소득월액의 결정 방법은 대통령령으로 정한다.
 *  - 국민연금법 시행령 제5조제5항 - 신고한 소득월액이 고시된 "상한액보다 많으면 그 상한액을
 *    기준소득월액으로 한다". 상한 위 소득은 여기서 잘려 나가고 다시 등장하지 않는다.
 *  - 국민연금법 제51조제1항제2호 - 기본연금액의 B값은 가입기간 중 매년 기준소득월액을
 *    재평가해 합산한 뒤 총 가입기간으로 나눈 금액. 잘린 뒤의 값이 들어가므로 연금액 산정에서도
 *    제외된다.
 *
 * 하한(410,000원)은 일부러 적용하지 않는다. 이 인자는 한 달의 기준소득월액이 아니라 가입기간
 * 전체의 평균이고, 하한액은 해마다 올라왔으므로 과거가 섞인 평균은 올해 하한보다 낮을 수 있다.
 * 반대로 과거 상한은 모두 올해 상한보다 낮으므로 올해 상한은 어떤 평균에도 유효한 상계다.
 *
 * scripts/calc-engine.mjs의 calcPensionEstimate와 같은 값을 내야 한다. 어긋나면 프리렌더된
 * 산문과 화면 계산기가 같은 입력에서 다른 숫자를 찍는다.
 *
 * 보험료를 두 값으로 나눠 돌려주는 이유:
 *  - employeeContribution = 사업장가입자의 기여금. 직장가입자 급여에서 빠지는 본인 부담분.
 *  - totalContribution    = 기여금 + 사용자 부담금. 지역가입자는 이 금액 전부를 혼자 낸다.
 * 둘 다 맞는 값이고 정확히 두 배 차이라, 한 화면에서 라벨 없이 섞으면 어느 쪽이 답인지 알 수
 * 없다. 실제로 화면은 9.5% 값을 "월 납부 보험료 추정"으로, 산문은 4.75% 값을 "본인 부담
 * 보험료"로 찍고 있었다. 그래서 계산기가 두 값을 각각 반환하고 화면은 라벨로 어느 쪽인지 밝힌다.
 *
 * 요율 근거:
 *  - 국민연금법 제88조제3항 - 사업장가입자의 기여금은 본인이, 부담금은 사용자가 각각 부담하되
 *    "그 금액은 각각 기준소득월액의 1천분의 65에 해당하는 금액으로 한다"
 *  - 국민연금법 제88조제4항 - 지역가입자, 임의가입자 및 임의계속가입자의 연금보험료는 본인이
 *    부담하되 "그 금액은 기준소득월액의 1천분의 130으로 한다"
 *  - 같은 법 부칙(법률 제20903호, 2025.4.2) 제4조 - 위 두 항에도 불구하고 2026년은 기여금과
 *    부담금이 각각 1만분의 475(4.75%씩), 지역가입자 등은 1천분의 95(9.5%)다.
 */
export function calculatePensionEstimate(input: PensionInput) {
  const recognizedYears = clamp(input.insuredYears, 1, 40);
  const ageFactor = pensionAgeFactors[input.claimAge] ?? 1;
  const contributionBase = Math.min(
    Math.max(0, input.averageMonthlyIncome),
    RATES_2026.nationalPension.maxMonthlyIncome
  );
  const baseMonthlyPension = (360_000 + contributionBase * 0.22) * (recognizedYears / 40);
  const estimatedMonthlyPension = Math.floor(baseMonthlyPension * ageFactor);
  const estimatedAnnualPension = estimatedMonthlyPension * 12;
  const employeeContribution = Math.floor(
    contributionBase * RATES_2026.nationalPension.employee
  );
  const totalContribution = Math.floor(contributionBase * RATES_2026.nationalPension.total);

  return {
    ageFactor,
    recognizedYears,
    eligible: input.insuredYears >= 10,
    contributionBase,
    cappedByStandardIncomeLimit: contributionBase < Math.max(0, input.averageMonthlyIncome),
    estimatedMonthlyPension,
    estimatedAnnualPension,
    employeeContribution,
    totalContribution,
  };
}

/**
 * 소득세 세액공제액에 개인지방소득세 감소분을 더한 "실제 절세 총액".
 *
 * 왜 두 값을 따로 두는가: 두 숫자는 서로 다른 것을 가리키고 둘 다 맞다.
 *  - 세액공제액(taxCredit)      = 소득세 산출세액에서 빼는 금액. 법령상 정의된 값.
 *  - 절세 총액(WithLocalTax)    = 그 공제 때문에 실제로 덜 내는 돈(소득세 + 지방소득세).
 * 한 화면에서 이 둘을 같은 라벨("환급액")로 쓰면 900만원 납입 시 1,350,000원과
 * 1,485,000원이 동시에 나와서 어느 쪽이 참인지 알 수 없게 된다. 그래서 계산기가
 * 두 값을 각각 반환하고, 화면·산문은 라벨로 어느 쪽인지 항상 밝힌다.
 *
 * 왜 1.1배인가 (근거):
 *  - 지방세법 제91조제1항 — "거주자의 종합소득에 대한 개인지방소득세 과세표준은
 *    소득세법 제14조제2항부터 제5항까지에 따라 계산한 소득세의 과세표준과 동일한 금액으로 한다."
 *  - 지방세법 제93조제1항제2호 — 산출세액에 "제94조에 따른 세액공제 및 세액감면을 적용하여"
 *    결정세액을 계산한다. 제94조는 그 내용을 지방세특례제한법에 위임한다.
 *  - 지방세특례제한법 제167조의2제1항 — "소득세법 또는 조세특례제한법에 따라 소득세가
 *    세액공제·감면이 되는 경우에는 ... 그 공제·감면되는 금액의 100분의 10에 해당하는
 *    개인지방소득세를 공제·감면한다."
 * 즉 지방소득세는 과세표준 단계가 아니라 세액공제 단계에서 소득세 공제액의 10%만큼 함께 줄어든다.
 * 그래서 곱셈이 아니라 "정수 세액공제액 + 그 10%"로 계산한다 — 조문 문언 그대로이고 원 단위 오차가 없다.
 */
export function withLocalIncomeTax(incomeTaxCredit: number): number {
  return incomeTaxCredit + Math.floor(incomeTaxCredit * LOCAL_INCOME_TAX_RATE);
}

export function calculateMonthlyRentDeduction(input: MonthlyRentDeductionInput) {
  const deductionRate = input.annualSalary <= 55_000_000 ? 0.17 : input.annualSalary <= 80_000_000 ? 0.15 : 0;
  const yearlyRent = input.monthlyRent * input.paidMonths;
  const recognizedRent = Math.min(10_000_000, yearlyRent);
  const taxCredit = Math.floor(recognizedRent * deductionRate);

  return {
    deductionRate,
    yearlyRent,
    recognizedRent,
    // 소득세 산출세액에서 빼는 금액 (조세특례제한법 제95조의2제1항: 총급여 5,500만원 이하 17%, 8,000만원 이하 15%)
    taxCredit,
    // 지방소득세까지 줄어든 뒤의 실제 절세 총액 (지방세특례제한법 제167조의2제1항)
    taxCreditWithLocalTax: withLocalIncomeTax(taxCredit),
    // 월 환산은 소득세분 기준 — 화면 라벨도 "소득세 기준"이라고 밝힌다
    monthlyRefundEffect: Math.floor(taxCredit / 12),
    eligible: deductionRate > 0,
  };
}

export function calculateIrpTaxCredit(input: IrpInput) {
  const taxCreditRate = input.annualSalary <= 55_000_000 ? 0.15 : 0.12;
  const recognizedPensionSavings = Math.min(6_000_000, input.pensionSavings);
  const recognizedIrp = Math.min(
    Math.max(0, 9_000_000 - recognizedPensionSavings),
    input.irpContribution
  );
  const recognizedContribution = recognizedPensionSavings + recognizedIrp;
  const overflowAmount =
    Math.max(0, input.pensionSavings - recognizedPensionSavings) +
    Math.max(0, input.irpContribution - recognizedIrp);
  const taxCredit = Math.floor(recognizedContribution * taxCreditRate);

  return {
    taxCreditRate,
    recognizedPensionSavings,
    recognizedIrp,
    recognizedContribution,
    overflowAmount,
    // 소득세 산출세액에서 빼는 금액 (소득세법 제59조의3제1항: 총급여 5,500만원 이하 15%, 초과 12%)
    taxCredit,
    // 지방소득세까지 줄어든 뒤의 실제 절세 총액 (지방세특례제한법 제167조의2제1항)
    taxCreditWithLocalTax: withLocalIncomeTax(taxCredit),
  };
}

// ── 지역가입자 건강보험료 추정 ──

export type RegionalHealthInput = {
  /** 퇴직 전 월급 (세전) */
  monthlySalary: number;
  /** 연간 금융소득 (이자·배당) */
  financialIncome: number;
  /** 부동산 과세표준 */
  propertyTaxBase: number;
  /** 자동차 과세표준 */
  carTaxBase: number;
};

/**
 * 임의계속가입자 보험료 경감률.
 *
 * 왜 상수로 빼는가: 이 값을 빼먹으면 임의계속가입료가 정확히 2배로 부풀고, 그 상태로
 * "퇴사하면 보험료가 2배가 된다"는 결론까지 뒤집힌다(실제로는 임의계속을 신청하면 재직
 * 중과 같은 금액이다). 근거는 보험료 경감고시 제9조(임의계속가입자 경감) — "법 제110조에
 * 따른 임의계속가입자에 대하여는 그 가입자 보수월액보험료의 100분의 50을 경감한다".
 * 출처: 보험료 경감고시 [시행 2026. 1. 1.] [보건복지부고시 제2025-221호, 2025. 12. 24.]
 */
export const VOLUNTARY_CONTINUATION_REDUCTION = 0.5;

/**
 * 이 계산기가 지역가입자 월 보험료(소득·재산·자동차 합산분)에 두는 하한.
 * scripts/calc-engine.mjs의 REGIONAL_HEALTH_MIN_MONTHLY와 같은 값이어야 한다 —
 * 다르면 같은 페이지의 프리렌더 산문과 화면 계산 결과가 갈린다.
 */
export const REGIONAL_HEALTH_MIN_MONTHLY = 19_780;

export function calculateRegionalHealth(input: RegionalHealthInput) {
  const r = RATES_2026;

  // 직장가입자 건보료 (현재 근로자 부담분)
  const employeeHealth = Math.floor(input.monthlySalary * r.healthInsurance.employee);
  const employeeLongTerm = Math.floor(employeeHealth * r.longTermCare.rateOfHealth);
  const currentMonthly = employeeHealth + employeeLongTerm;

  // 임의계속가입: 보수월액보험료 "전액"을 본인이 부담하되(국민건강보험법 제110조 제5항),
  // 그 100분의 50을 경감받는다(같은 조 제4항 위임 → 보험료 경감고시 제9조). 두 규정을 함께
  // 적용한 뒤의 금액이 실제 고지액이고, 그 값은 재직 중 급여명세서의 건강보험 본인부담분과
  // 원 단위까지 같아진다. 경감 전 전액(voluntaryGrossMonthly)은 "왜 절반만 내는가"를 보여
  // 주기 위해 함께 반환한다 — 둘 중 하나만 쓰면 나머지 하나가 거짓이 된다.
  const voluntaryGrossHealth = Math.floor(input.monthlySalary * r.healthInsurance.total);
  const voluntaryGrossLongTerm = Math.floor(voluntaryGrossHealth * r.longTermCare.rateOfHealth);
  const voluntaryGrossMonthly = voluntaryGrossHealth + voluntaryGrossLongTerm;
  const voluntaryHealth = Math.floor(voluntaryGrossHealth * (1 - VOLUNTARY_CONTINUATION_REDUCTION));
  const voluntaryLongTerm = Math.floor(voluntaryHealth * r.longTermCare.rateOfHealth);
  const voluntaryMonthly = voluntaryHealth + voluntaryLongTerm;

  // 지역가입자 추정 (간이): 소득 + 재산 점수 기반
  // 소득보험료: (연 소득 × 건보율) / 12
  // 재산보험료: 재산 과세표준 × 소정 요율
  //
  // 시나리오 주의: 여기서 소득은 "퇴사 후"의 금융소득이다. 퇴사 전 월급은 임의계속가입료의
  // 기준(보수월액)일 뿐 지역가입자 소득분에는 들어가지 않는다. 두 값을 같은 소득으로 섞으면
  // 재직 중 월급이 퇴사 후에도 계속 나온다는 다른 시나리오를 계산하게 된다.
  const annualIncome = input.financialIncome; // 퇴사 후 근로소득 없으므로 금융소득만
  const incomeComponent = Math.floor((annualIncome * r.healthInsurance.total) / 12);

  // 재산: 과세표준 × 0.18% (주택 공시가격 기준 간이 추정)
  const propertyComponent = Math.floor(input.propertyTaxBase * 0.0018 / 12);
  const carComponent = Math.floor(input.carTaxBase * 0.0018 / 12);

  const regionalBase = Math.max(
    incomeComponent + propertyComponent + carComponent,
    REGIONAL_HEALTH_MIN_MONTHLY,
  );
  const regionalLongTerm = Math.floor(regionalBase * r.longTermCare.rateOfHealth);
  const regionalMonthly = regionalBase + regionalLongTerm;

  // 피부양자: 조건 충족 시 0원
  const dependentEligible = annualIncome <= 20_000_000 && input.propertyTaxBase <= 540_000_000;

  // 비교 결과
  const cheapestOption = dependentEligible
    ? "dependent" as const
    : regionalMonthly <= voluntaryMonthly
      ? "regional" as const
      : "voluntary" as const;

  return {
    currentMonthly,
    voluntaryMonthly,
    voluntaryGrossMonthly,
    voluntaryHealth,
    voluntaryLongTerm,
    regionalMonthly,
    regionalBase,
    dependentEligible,
    cheapestOption,
    cheapestMonthly: cheapestOption === "dependent" ? 0
      : cheapestOption === "regional" ? regionalMonthly : voluntaryMonthly,
    monthlySaving: currentMonthly - (cheapestOption === "dependent" ? 0
      : cheapestOption === "regional" ? regionalMonthly : voluntaryMonthly),
    // 상세 내역
    incomeComponent,
    propertyComponent,
    carComponent,
  };
}

export function calculateEmployerInsuranceBurden(input: EmployerInsuranceInput) {
  const pensionBase = clamp(
    input.monthlySalary,
    RATES_2026.nationalPension.minMonthlyIncome,
    RATES_2026.nationalPension.maxMonthlyIncome
  );
  const nationalPension = Math.floor(pensionBase * RATES_2026.nationalPension.employer);
  const healthInsurance = Math.floor(input.monthlySalary * RATES_2026.healthInsurance.employer);
  const longTermCare = Math.floor(healthInsurance * RATES_2026.longTermCare.rateOfHealth);
  const employmentInsurance = Math.floor(
    input.monthlySalary * (input.employmentRatePercent / 100)
  );
  const industrialAccident = Math.floor(
    input.monthlySalary * (input.accidentRatePercent / 100)
  );
  const totalMonthlyBurden =
    nationalPension +
    healthInsurance +
    longTermCare +
    employmentInsurance +
    industrialAccident;

  return {
    nationalPension,
    healthInsurance,
    longTermCare,
    employmentInsurance,
    industrialAccident,
    totalMonthlyBurden,
    totalAnnualBurden: totalMonthlyBurden * 12,
    employerRate: input.monthlySalary > 0 ? totalMonthlyBurden / input.monthlySalary : 0,
  };
}
