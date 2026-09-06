import { RATES_2026 } from "@/data/taxRates2026";

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

export function calculatePensionEstimate(input: PensionInput) {
  const recognizedYears = clamp(input.insuredYears, 1, 40);
  const ageFactor = pensionAgeFactors[input.claimAge] ?? 1;
  const baseMonthlyPension =
    (360_000 + input.averageMonthlyIncome * 0.22) * (recognizedYears / 40);
  const estimatedMonthlyPension = Math.floor(baseMonthlyPension * ageFactor);
  const estimatedAnnualPension = estimatedMonthlyPension * 12;
  const employeeContribution = Math.floor(input.averageMonthlyIncome * RATES_2026.nationalPension.total);

  return {
    ageFactor,
    recognizedYears,
    eligible: input.insuredYears >= 10,
    estimatedMonthlyPension,
    estimatedAnnualPension,
    employeeContribution,
  };
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
    taxCredit,
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

  return {
    taxCreditRate,
    recognizedPensionSavings,
    recognizedIrp,
    recognizedContribution,
    overflowAmount,
    taxCredit: Math.floor(recognizedContribution * taxCreditRate),
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
