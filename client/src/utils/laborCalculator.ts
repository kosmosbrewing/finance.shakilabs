// 근로 계산기 (주휴수당, 시급환산, 퇴직금)

// ── 주휴수당 계산기 ──────────────────────────────────────
export interface WeeklyHolidayPayInput {
  /** 시급 (원) */
  hourlyWage: number;
  /** 주 근무일수 (1~6) */
  workDaysPerWeek: number;
  /** 일 근무시간 (1~12) */
  hoursPerDay: number;
}

export type WeeklyHolidayPayResult = {
  /** 주 총 근무시간 */
  weeklyHours: number;
  /** 주휴수당 발생 여부 (주 15시간 이상) */
  isEligible: boolean;
  /** 주휴수당 (원) */
  weeklyHolidayPay: number;
  /** 주급 (주휴수당 미포함) */
  weeklyWage: number;
  /** 실질 시급 (주휴수당 포함) */
  effectiveHourlyWage: number;
  /** 월급 예상 (주급+주휴 × 4.345주) */
  estimatedMonthlyPay: number;
  /** 주휴 미포함 월급 */
  monthlyPayWithout: number;
  /** 주휴수당 월 차이 */
  monthlyDifference: number;
};

export function calculateWeeklyHolidayPay(input: WeeklyHolidayPayInput): WeeklyHolidayPayResult {
  const { hourlyWage, workDaysPerWeek, hoursPerDay } = input;
  const weeklyHours = workDaysPerWeek * hoursPerDay;
  const isEligible = weeklyHours >= 15;

  // 주휴수당 = 시급 × (주 총 근무시간 / 40) × 8
  const weeklyHolidayPay = isEligible ? Math.round(hourlyWage * (weeklyHours / 40) * 8) : 0;
  const weeklyWage = hourlyWage * weeklyHours;
  const effectiveHourlyWage = weeklyHours > 0
    ? Math.round((weeklyWage + weeklyHolidayPay) / weeklyHours)
    : 0;

  const WEEKS_PER_MONTH = 4.345;
  const estimatedMonthlyPay = Math.round((weeklyWage + weeklyHolidayPay) * WEEKS_PER_MONTH);
  const monthlyPayWithout = Math.round(weeklyWage * WEEKS_PER_MONTH);
  const monthlyDifference = estimatedMonthlyPay - monthlyPayWithout;

  return {
    weeklyHours,
    isEligible,
    weeklyHolidayPay,
    weeklyWage,
    effectiveHourlyWage,
    estimatedMonthlyPay,
    monthlyPayWithout,
    monthlyDifference,
  };
}

// ── 시급↔월급↔연봉 환산기 ────────────────────────────────
export interface WageConverterInput {
  /** 입력 기준 (어느 값을 기준으로 환산할지) */
  base: "hourly" | "monthly" | "annual";
  /** 금액 (원) */
  amount: number;
  /** 주 근무시간 (기본 40) */
  weeklyWorkHours: number;
  /** 주휴수당 포함 여부 */
  includeWeeklyHoliday: boolean;
}

export type WageConverterResult = {
  /** 시급 */
  hourly: number;
  /** 일급 (8시간 기준) */
  daily: number;
  /** 주급 */
  weekly: number;
  /** 월급 */
  monthly: number;
  /** 연봉 */
  annual: number;
  /** 주휴 포함 유효 주 시간 */
  effectiveWeeklyHours: number;
  /** 월 근무시간 */
  monthlyHours: number;
};

export function calculateWageConversion(input: WageConverterInput): WageConverterResult {
  const { base, amount, weeklyWorkHours, includeWeeklyHoliday } = input;
  const WEEKS_PER_MONTH = 4.345;

  // 주휴 포함 시: 유효 주 시간 = 근무시간 + 8 (주 15시간 이상 가정)
  const effectiveWeeklyHours = includeWeeklyHoliday
    ? weeklyWorkHours + 8
    : weeklyWorkHours;
  const monthlyHours = Math.round(effectiveWeeklyHours * WEEKS_PER_MONTH * 10) / 10;

  let hourly: number;

  switch (base) {
    case "hourly":
      hourly = amount;
      break;
    case "monthly":
      hourly = monthlyHours > 0 ? Math.round(amount / monthlyHours) : 0;
      break;
    case "annual":
      hourly = monthlyHours > 0 ? Math.round(amount / 12 / monthlyHours) : 0;
      break;
  }

  const daily = hourly * 8;
  const weekly = hourly * effectiveWeeklyHours;
  const monthly = Math.round(hourly * monthlyHours);
  const annual = monthly * 12;

  return {
    hourly,
    daily,
    weekly,
    monthly,
    annual,
    effectiveWeeklyHours,
    monthlyHours,
  };
}

// ── 퇴직금 계산기 ──────────────────────────────────────
export interface SeverancePayInput {
  /** 근속 연수 */
  yearsOfService: number;
  /** 최근 3개월 평균 월급 (원) */
  averageMonthlySalary: number;
  /**
   * 마지막 근무일 (YYYY-MM-DD). Determines the statutory average-wage window
   * length (89-92 days). Defaults to today ("if you quit today").
   */
  lastWorkedDay?: string;
}

export type SeverancePayResult = {
  /** 퇴직금 총액 */
  severancePay: number;
  /** 1일 평균임금 */
  dailyAvgWage: number;
  /** 평균임금 산정 기간 총일수 (89~92일) */
  windowDays: number;
  /** 총 근속일수 */
  totalDays: number;
  /** 수급 요건 충족 여부 (1년 이상) */
  isEligible: boolean;
  /** 퇴직소득세 (국세) */
  severanceIncomeTax: number;
  /** 지방소득세 (퇴직소득세의 10%) */
  severanceLocalTax: number;
  /** 세금 합계 (퇴직소득세 + 지방소득세) */
  severanceTax: number;
  /** 실수령 퇴직금 */
  netSeverancePay: number;
  /** 근속연수별 비교 데이터 */
  comparisonData: { years: number; amount: number }[];
};

// Statutory average-wage window (근로기준법 제2조 제1항 제6호): total wages of
// the 3 calendar months before the separation date, divided by the ACTUAL
// number of days in that window. That is 89-92 days depending on the month --
// a fixed 90 or 92 is only an approximation, not the statute. This mirrors the
// MOEL severance calculator (its worked example divides by 92).
// The separation date (사유 발생일) is the day AFTER the last worked day.
export function averageWageWindowDays(lastWorkedDay: Date): number {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const separation = new Date(
    lastWorkedDay.getFullYear(),
    lastWorkedDay.getMonth(),
    lastWorkedDay.getDate() + 1
  );
  const windowStart = new Date(
    separation.getFullYear(),
    separation.getMonth() - 3,
    separation.getDate()
  );
  // month-end overflow (e.g. 5/31 minus 3 months -> 2/31 spills into March):
  // pull back to the last day of the intended month
  if (windowStart.getDate() !== separation.getDate()) windowStart.setDate(0);
  return Math.round((separation.getTime() - windowStart.getTime()) / DAY_MS);
}

export function calcAverageDailyWage(threeMonthTotalWage: number, windowDays: number): number {
  if (windowDays <= 0) return 0;
  return Math.floor(threeMonthTotalWage / windowDays);
}

/**
 * 퇴직소득세 간이 계산
 * 2026년 기준 퇴직소득 과세표준 계산:
 * 1. 퇴직소득금액 = 퇴직금
 * 2. 근속연수공제
 * 3. 환산급여 = (퇴직소득금액 - 근속연수공제) × 12 / 근속연수
 * 4. 환산급여공제
 * 5. 환산산출세액 (종합소득세 누진세율 적용)
 * 6. 산출세액 = 환산산출세액 × 근속연수 / 12
 * 7. 지방소득세 = 산출세액 × 10%
 */
export type SeveranceTaxParts = {
  /** 퇴직소득세 (국세) */
  incomeTax: number;
  /** 지방소득세 (퇴직소득세의 10%) */
  localTax: number;
};

// export인 이유: scripts/calc-engine.mjs가 프리렌더 본문에 같은 세액을 찍어야 해서 이 산식을
// 미러링한다. 두 구현이 같은 답을 내는지 calcEngineParity.test.ts가 직접 비교한다.
// The two on-screen labels (퇴직소득세 / 지방소득세) must never be merged into a
// single number labeled "퇴직소득세" -- that is what parts exist for.
export function calculateSeveranceTaxParts(severancePay: number, years: number): SeveranceTaxParts {
  if (years <= 0 || severancePay <= 0) return { incomeTax: 0, localTax: 0 };

  // 근속연수공제
  let serviceDeduction: number;
  if (years <= 5) {
    serviceDeduction = 1_000_000 * years;
  } else if (years <= 10) {
    serviceDeduction = 5_000_000 + 2_000_000 * (years - 5);
  } else if (years <= 20) {
    serviceDeduction = 15_000_000 + 2_500_000 * (years - 10);
  } else {
    serviceDeduction = 40_000_000 + 3_000_000 * (years - 20);
  }

  const afterServiceDeduction = Math.max(0, severancePay - serviceDeduction);

  // 환산급여
  const convertedSalary = Math.round(afterServiceDeduction * 12 / years);

  // 환산급여공제
  let convertedDeduction: number;
  if (convertedSalary <= 8_000_000) {
    convertedDeduction = convertedSalary;
  } else if (convertedSalary <= 70_000_000) {
    convertedDeduction = 8_000_000 + (convertedSalary - 8_000_000) * 0.6;
  } else if (convertedSalary <= 100_000_000) {
    convertedDeduction = 45_200_000 + (convertedSalary - 70_000_000) * 0.55;
  } else if (convertedSalary <= 300_000_000) {
    convertedDeduction = 61_700_000 + (convertedSalary - 100_000_000) * 0.45;
  } else {
    convertedDeduction = 151_700_000 + (convertedSalary - 300_000_000) * 0.35;
  }

  const taxBase = Math.max(0, convertedSalary - Math.round(convertedDeduction));

  // 종합소득세 누진세율 적용
  let convertedTax: number;
  if (taxBase <= 14_000_000) {
    convertedTax = taxBase * 0.06;
  } else if (taxBase <= 50_000_000) {
    convertedTax = 840_000 + (taxBase - 14_000_000) * 0.15;
  } else if (taxBase <= 88_000_000) {
    convertedTax = 6_240_000 + (taxBase - 50_000_000) * 0.24;
  } else if (taxBase <= 150_000_000) {
    convertedTax = 15_360_000 + (taxBase - 88_000_000) * 0.35;
  } else if (taxBase <= 300_000_000) {
    convertedTax = 37_060_000 + (taxBase - 150_000_000) * 0.38;
  } else if (taxBase <= 500_000_000) {
    convertedTax = 94_060_000 + (taxBase - 300_000_000) * 0.40;
  } else if (taxBase <= 1_000_000_000) {
    convertedTax = 174_060_000 + (taxBase - 500_000_000) * 0.42;
  } else {
    convertedTax = 384_060_000 + (taxBase - 1_000_000_000) * 0.45;
  }

  // 산출세액 = 환산산출세액 × 근속연수 / 12
  const incomeTax = Math.round(convertedTax * years / 12);

  // 지방소득세 10%
  const localTax = Math.round(incomeTax * 0.1);

  return { incomeTax, localTax };
}

// Combined total (national + local), kept because the prerender mirror
// (scripts/calc-engine.mjs severanceIncomeTax) prints this exact sum and
// calcEngineParity.test.ts compares the two implementations number-for-number.
export function calculateSeveranceTax(severancePay: number, years: number): number {
  const { incomeTax, localTax } = calculateSeveranceTaxParts(severancePay, years);
  return incomeTax + localTax;
}

export function calculateSeverancePay(input: SeverancePayInput): SeverancePayResult {
  const { yearsOfService, averageMonthlySalary } = input;
  const isEligible = yearsOfService >= 1;

  // Daily average wage: 3-month wages / actual window days (89-92, statute),
  // not the former fixed /90. Same core as useRetirementCalc so /severance-pay
  // and /quit answer identically for the same scenario.
  const lastWorkedDay = input.lastWorkedDay
    ? new Date(`${input.lastWorkedDay}T00:00:00`)
    : new Date();
  const windowDays = averageWageWindowDays(lastWorkedDay);
  const dailyAvgWage = calcAverageDailyWage(averageMonthlySalary * 3, windowDays);
  const totalDays = Math.round(yearsOfService * 365);

  // 퇴직금 = 1일 평균임금 × 30일 × (총 근속일수 / 365)
  const severancePay = Math.floor(dailyAvgWage * 30 * (totalDays / 365));

  const { incomeTax, localTax } = calculateSeveranceTaxParts(severancePay, yearsOfService);
  const severanceTax = incomeTax + localTax;
  const netSeverancePay = severancePay - severanceTax;

  // 비교 데이터 (1, 3, 5, 10, 15, 20년)
  const comparisonYears = [1, 3, 5, 10, 15, 20];
  const comparisonData = comparisonYears.map((y) => ({
    years: y,
    amount: Math.floor(dailyAvgWage * 30 * y),
  }));

  return {
    severancePay,
    dailyAvgWage,
    windowDays,
    totalDays,
    isEligible,
    severanceIncomeTax: incomeTax,
    severanceLocalTax: localTax,
    severanceTax,
    netSeverancePay,
    comparisonData,
  };
}
