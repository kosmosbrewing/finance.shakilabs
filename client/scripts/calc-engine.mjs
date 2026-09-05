// 프리렌더 전용 계산 엔진 (src/utils/calculator.ts 미러)
// 목적: 빌드 시점에 실제 계산값을 정적 HTML에 주입하여 SEO/AdSense 콘텐츠 가치 향상

// --- 2026년 요율 (src/data/taxRates2026.ts 미러) ---
export const RATES_2026 = {
  nationalPension: {
    total: 0.095,
    employee: 0.0475,
    employer: 0.0475,
    minMonthlyIncome: 410_000,
    maxMonthlyIncome: 6_590_000,
  },
  healthInsurance: { total: 0.0719, employee: 0.03595, employer: 0.03595 },
  longTermCare: { rateOfHealth: 0.1314 },
  employmentInsurance: { employee: 0.009, employer: 0.009 },
};

export const PERSONAL_DEDUCTION_PER_PERSON = 1_500_000;
export const LOCAL_INCOME_TAX_RATE = 0.1;
export const STANDARD_TAX_CREDIT = 130_000;

export const CHILD_TAX_CREDIT = {
  oneChild: 250_000,
  twoChildren: 550_000,
  extraPerChildOverTwo: 400_000,
};

// --- 근로소득공제 구간 (src/data/taxBrackets.ts 미러) ---
export const EARNED_INCOME_DEDUCTION_BRACKETS = [
  { limit: 5_000_000, rate: 0.7, baseDeduction: 0, baseSalary: 0 },
  { limit: 15_000_000, rate: 0.4, baseDeduction: 3_500_000, baseSalary: 5_000_000 },
  { limit: 45_000_000, rate: 0.15, baseDeduction: 7_500_000, baseSalary: 15_000_000 },
  { limit: 100_000_000, rate: 0.05, baseDeduction: 12_000_000, baseSalary: 45_000_000 },
  { limit: Number.POSITIVE_INFINITY, rate: 0.02, baseDeduction: 14_750_000, baseSalary: 100_000_000 },
];

// --- 종합소득세 세율 구간 ---
export const INCOME_TAX_BRACKETS = [
  { limit: 14_000_000, rate: 0.06, progressiveTax: 0, baseIncome: 0 },
  { limit: 50_000_000, rate: 0.15, progressiveTax: 840_000, baseIncome: 14_000_000 },
  { limit: 88_000_000, rate: 0.24, progressiveTax: 6_240_000, baseIncome: 50_000_000 },
  { limit: 150_000_000, rate: 0.35, progressiveTax: 15_360_000, baseIncome: 88_000_000 },
  { limit: 300_000_000, rate: 0.38, progressiveTax: 37_060_000, baseIncome: 150_000_000 },
  { limit: 500_000_000, rate: 0.4, progressiveTax: 94_060_000, baseIncome: 300_000_000 },
  { limit: 1_000_000_000, rate: 0.42, progressiveTax: 174_060_000, baseIncome: 500_000_000 },
  { limit: Number.POSITIVE_INFINITY, rate: 0.45, progressiveTax: 384_060_000, baseIncome: 1_000_000_000 },
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function getEarnedIncomeTaxCreditLimit(totalSalary) {
  if (totalSalary <= 33_000_000) return 740_000;
  if (totalSalary <= 70_000_000) {
    return Math.max(660_000, 740_000 - (totalSalary - 33_000_000) * 0.008);
  }
  if (totalSalary <= 120_000_000) {
    return Math.max(500_000, 660_000 - Math.floor((totalSalary - 70_000_000) / 2));
  }
  return Math.max(200_000, 500_000 - Math.floor((totalSalary - 120_000_000) / 2));
}

export function calcEarnedIncomeDeduction(annualSalary) {
  for (const bracket of EARNED_INCOME_DEDUCTION_BRACKETS) {
    if (annualSalary <= bracket.limit) {
      const deduction = Math.floor(
        bracket.baseDeduction + (annualSalary - bracket.baseSalary) * bracket.rate
      );
      return Math.min(deduction, 20_000_000);
    }
  }
  return 0;
}

export function calcIncomeTax(taxableIncome) {
  if (taxableIncome <= 0) return 0;
  for (const bracket of INCOME_TAX_BRACKETS) {
    if (taxableIncome <= bracket.limit) {
      return Math.floor(
        bracket.progressiveTax + (taxableIncome - bracket.baseIncome) * bracket.rate
      );
    }
  }
  return 0;
}

export function calcEarnedIncomeTaxCredit(calculatedTax, annualTaxableIncome) {
  if (calculatedTax <= 0) return 0;
  let credit = 0;
  if (calculatedTax <= 1_300_000) {
    credit = calculatedTax * 0.55;
  } else {
    credit = 715_000 + (calculatedTax - 1_300_000) * 0.3;
  }
  const maxCredit = getEarnedIncomeTaxCreditLimit(annualTaxableIncome);
  return Math.floor(Math.min(credit, maxCredit));
}

export function calcChildTaxCredit(children) {
  if (children <= 0) return 0;
  if (children === 1) return CHILD_TAX_CREDIT.oneChild;
  if (children === 2) return CHILD_TAX_CREDIT.twoChildren;
  return CHILD_TAX_CREDIT.twoChildren + (children - 2) * CHILD_TAX_CREDIT.extraPerChildOverTwo;
}

export function calcInsuranceDeduction(taxableMonthly) {
  const safe = Math.max(0, Math.floor(taxableMonthly));
  const pensionBase = clamp(
    safe,
    RATES_2026.nationalPension.minMonthlyIncome,
    RATES_2026.nationalPension.maxMonthlyIncome
  );
  const nationalPension =
    safe > 0 ? Math.floor(pensionBase * RATES_2026.nationalPension.employee) : 0;
  const healthInsurance = Math.floor(safe * RATES_2026.healthInsurance.employee);
  const longTermCare = Math.floor(healthInsurance * RATES_2026.longTermCare.rateOfHealth);
  const employmentInsurance = Math.floor(safe * RATES_2026.employmentInsurance.employee);
  return {
    nationalPension,
    healthInsurance,
    longTermCare,
    employmentInsurance,
    totalInsurance: nationalPension + healthInsurance + longTermCare + employmentInsurance,
  };
}

export function calcIncomeTaxBundle({
  annualTaxableIncome,
  dependents,
  children,
  monthlyInsuranceTotal,
}) {
  const safeDependents = clamp(Math.floor(dependents || 1), 1, 20);
  const maxChildren = Math.max(0, safeDependents - 1);
  const safeChildren = clamp(Math.floor(children || 0), 0, maxChildren);
  const income = Math.max(0, Math.floor(annualTaxableIncome));

  const earnedIncomeDeduction = calcEarnedIncomeDeduction(income);
  const personalDeduction = safeDependents * PERSONAL_DEDUCTION_PER_PERSON;
  const annualInsuranceDeduction = Math.floor(Math.max(0, monthlyInsuranceTotal) * 12);

  const taxableBase = Math.max(
    0,
    income - earnedIncomeDeduction - personalDeduction - annualInsuranceDeduction
  );
  const calculatedTax = calcIncomeTax(taxableBase);
  const taxCredit = calcEarnedIncomeTaxCredit(calculatedTax, income);
  const standardTaxCredit = STANDARD_TAX_CREDIT;
  const childTaxCredit = calcChildTaxCredit(safeChildren);

  const determinedTax = Math.max(
    0,
    calculatedTax - taxCredit - standardTaxCredit - childTaxCredit
  );
  const annualLocalTax = Math.floor(determinedTax * LOCAL_INCOME_TAX_RATE);
  const monthlyIncomeTax = Math.floor(determinedTax / 12);
  const monthlyLocalTax = Math.floor(annualLocalTax / 12);

  return {
    annualTaxableIncome: income,
    earnedIncomeDeduction,
    personalDeduction,
    annualInsuranceDeduction,
    taxableBase,
    calculatedTax,
    taxCredit,
    standardTaxCredit,
    childTaxCredit,
    determinedTax,
    annualLocalTax,
    monthlyIncomeTax,
    monthlyLocalTax,
  };
}

/**
 * 연봉 실수령액 종합 계산 (기본값: 부양가족 1인, 비과세 월 20만원, 퇴직금 별도)
 */
export function calculateSalaryBreakdown(input) {
  const grossAnnual = Math.max(0, Math.floor(input.grossAnnual || 0));
  const nonTaxableMonthly = clamp(Math.floor(input.nonTaxableMonthly ?? 200_000), 0, 5_000_000);
  const dependents = clamp(Math.floor(input.dependents || 1), 1, 20);
  const children = clamp(Math.floor(input.children || 0), 0, Math.max(0, dependents - 1));
  const retirementIncluded = Boolean(input.retirementIncluded);

  const monthlyGross = Math.floor(grossAnnual / (retirementIncluded ? 13 : 12));
  const taxableMonthly = Math.max(0, monthlyGross - nonTaxableMonthly);

  const insurance = calcInsuranceDeduction(taxableMonthly);
  const annualTaxable = Math.max(0, monthlyGross * 12 - nonTaxableMonthly * 12);
  const tax = calcIncomeTaxBundle({
    annualTaxableIncome: annualTaxable,
    dependents,
    children,
    monthlyInsuranceTotal: insurance.totalInsurance,
  });

  const totalTax = tax.monthlyIncomeTax + tax.monthlyLocalTax;
  const totalDeduction = insurance.totalInsurance + totalTax;
  const monthlyNet = monthlyGross - totalDeduction;
  const annualNet = monthlyNet * 12;
  const effectiveTaxRate = monthlyGross > 0 ? totalDeduction / monthlyGross : 0;

  return {
    grossAnnual,
    monthlyGross,
    taxableMonthly,
    nonTaxableMonthly,
    dependents,
    children,
    retirementIncluded,
    ...insurance,
    ...tax,
    totalTax,
    totalDeduction,
    monthlyNet,
    annualNet,
    effectiveTaxRate,
  };
}

// --- 종합소득세 (인적용역 단순경비율 기준) ---
// 변종 페이지(/comprehensive-tax/:manWon)와 허브(/comprehensive-tax)가 같은 금액에 대해 다른
// 세액을 보여주면 그 자체가 결함이라, 두 곳이 공유하도록 엔진으로 올렸다.
export function progressiveComprehensiveTax(taxableBase) {
  let calculatedTax = 0;
  if (taxableBase <= 14_000_000) calculatedTax = taxableBase * 0.06;
  else if (taxableBase <= 50_000_000)
    calculatedTax = 840_000 + (taxableBase - 14_000_000) * 0.15;
  else if (taxableBase <= 88_000_000)
    calculatedTax = 6_240_000 + (taxableBase - 50_000_000) * 0.24;
  else if (taxableBase <= 150_000_000)
    calculatedTax = 15_360_000 + (taxableBase - 88_000_000) * 0.35;
  else calculatedTax = 37_060_000 + (taxableBase - 150_000_000) * 0.38;
  return Math.floor(calculatedTax);
}

// 결정세액+지방소득세 — 표준세액공제 7만원 차감 후 10% 가산
export function comprehensiveTotalTaxOf(taxableBase) {
  const determinedTax = Math.max(0, progressiveComprehensiveTax(taxableBase) - 70_000);
  return determinedTax + Math.floor(determinedTax * 0.1);
}

// IT·디자인·작가 등 인적용역 기준 단순경비율 (src/data/freelanceTaxRates.ts)
export const SIMPLE_EXPENSE_RATE_BASE = 0.641;
export const SIMPLE_EXPENSE_RATE_EXCESS = 0.497;
export const SIMPLE_EXPENSE_THRESHOLD = 40_000_000;

export function computeComprehensiveTax(income) {
  const expenses = income <= SIMPLE_EXPENSE_THRESHOLD
    ? Math.floor(income * SIMPLE_EXPENSE_RATE_BASE)
    : Math.floor(
        SIMPLE_EXPENSE_THRESHOLD * SIMPLE_EXPENSE_RATE_BASE +
          (income - SIMPLE_EXPENSE_THRESHOLD) * SIMPLE_EXPENSE_RATE_EXCESS
      );
  const netIncome = income - expenses;
  const personalDeduction = 1_500_000;
  const taxableBase = Math.max(0, netIncome - personalDeduction);

  const calculatedTax = progressiveComprehensiveTax(taxableBase);

  const standardCredit = 70_000;
  const determinedTax = Math.max(0, calculatedTax - standardCredit);
  const localTax = Math.floor(determinedTax * 0.1);
  const totalTax = determinedTax + localTax;

  // 3.3% 원천징수 비교
  const withholdingPrepaid = Math.floor(income * 0.033);
  const refund = withholdingPrepaid - totalTax;
  // 추가 수입 1원당 경비 인정률 — 4천만원 초과 여부로 갈린다
  const marginalExpenseRate =
    income <= SIMPLE_EXPENSE_THRESHOLD ? SIMPLE_EXPENSE_RATE_BASE : SIMPLE_EXPENSE_RATE_EXCESS;

  return {
    income,
    expenses,
    netIncome,
    personalDeduction,
    taxableBase,
    calculatedTax,
    standardCredit,
    determinedTax,
    localTax,
    totalTax,
    withholdingPrepaid,
    refund,
    marginalExpenseRate,
  };
}

// --- 계산기 패밀리별 공용 산식 ---
// Hub pages (/unemployment, /severance-pay …) quote the same headline figure their amount
// variants render. The formulas used to live inline inside each variant's HTML template, so a
// hub could only restate them by copying — and a copy drifts the moment one side is edited.
// Every family below is the verbatim formula lifted out of prerender-content.mjs, now imported
// by both sides. Changing a rate here changes the hub and the variants together or not at all.

// 구직급여 일액 상·하한 (2026 고용노동부 고시)
export const UNEMPLOYMENT_DAILY_MAX = 68_100;
export const UNEMPLOYMENT_DAILY_MIN = 66_048;

export function unemploymentDailyAllowance(monthlyWage) {
  const avgDailyWage = Math.floor(monthlyWage / 30);
  const rawDaily = Math.floor(avgDailyWage * 0.6);
  const dailyAmount = Math.min(
    UNEMPLOYMENT_DAILY_MAX,
    Math.max(UNEMPLOYMENT_DAILY_MIN, rawDaily),
  );
  return { avgDailyWage, rawDaily, dailyAmount };
}

// 퇴직금 — 평균 월급 300만원·상여 포함 평균임금 1.1배 시나리오
export const SEVERANCE_ASSUMED_MONTHLY = 3_000_000;

export function severanceYearDeduction(years) {
  if (years <= 5) return 1_000_000 * years;
  if (years <= 10) return 5_000_000 + 2_000_000 * (years - 5);
  if (years <= 20) return 15_000_000 + 2_500_000 * (years - 10);
  return 40_000_000 + 3_000_000 * (years - 20);
}

// 환산급여공제 (소득세법 제48조② 별표) — 환산급여 구간별 공제액
function severanceConvertedDeduction(convertedSalary) {
  if (convertedSalary <= 8_000_000) return convertedSalary;
  if (convertedSalary <= 70_000_000) return 8_000_000 + (convertedSalary - 8_000_000) * 0.6;
  if (convertedSalary <= 100_000_000) return 45_200_000 + (convertedSalary - 70_000_000) * 0.55;
  if (convertedSalary <= 300_000_000) return 61_700_000 + (convertedSalary - 100_000_000) * 0.45;
  return 151_700_000 + (convertedSalary - 300_000_000) * 0.35;
}

// 퇴직소득세 (지방소득세 포함) — src/utils/laborCalculator.ts의 calculateSeveranceTax 미러.
//
// 왜 미러인가: 이 값은 /severance-pay 본문 표에 그대로 찍히고, 같은 입력을 인터랙티브 계산기에
// 넣으면 사용자가 두 숫자를 나란히 보게 된다. 이전 구현은 환산급여공제를 통째로 빼먹은 6% 근사치라
// 근속 3년·퇴직금 990만 기준 414,000원(정답 129,360원의 3.2배)을 냈다. 산식을 줄이지 말고
// 연분연승법 전 단계를 그대로 따라간다. laborCalculator.ts를 고치면 이 함수도 같이 고쳐야 한다.
export function severanceIncomeTax(severancePay, years) {
  if (years <= 0 || severancePay <= 0) return 0;

  const afterServiceDeduction = Math.max(0, severancePay - severanceYearDeduction(years));
  // 환산급여 = (퇴직급여 - 근속연수공제) × 12 / 근속연수
  const convertedSalary = Math.round((afterServiceDeduction * 12) / years);
  const taxBase = Math.max(
    0,
    convertedSalary - Math.round(severanceConvertedDeduction(convertedSalary)),
  );

  let convertedTax;
  if (taxBase <= 14_000_000) convertedTax = taxBase * 0.06;
  else if (taxBase <= 50_000_000) convertedTax = 840_000 + (taxBase - 14_000_000) * 0.15;
  else if (taxBase <= 88_000_000) convertedTax = 6_240_000 + (taxBase - 50_000_000) * 0.24;
  else if (taxBase <= 150_000_000) convertedTax = 15_360_000 + (taxBase - 88_000_000) * 0.35;
  else if (taxBase <= 300_000_000) convertedTax = 37_060_000 + (taxBase - 150_000_000) * 0.38;
  else if (taxBase <= 500_000_000) convertedTax = 94_060_000 + (taxBase - 300_000_000) * 0.4;
  else if (taxBase <= 1_000_000_000) convertedTax = 174_060_000 + (taxBase - 500_000_000) * 0.42;
  else convertedTax = 384_060_000 + (taxBase - 1_000_000_000) * 0.45;

  // 산출세액 = 환산산출세액 × 근속연수 / 12, 지방소득세 10% 별도
  const calculatedTax = Math.round((convertedTax * years) / 12);
  return calculatedTax + Math.round(calculatedTax * 0.1);
}

// 평균임금 산정기간 총일수 — src/utils/laborCalculator.ts averageWageWindowDays 미러.
// 근로기준법 제2조 제1항 제6호: 퇴직일(마지막 근무일 다음날) 이전 3개월의 "실제 달력 일수"(89~92)로
// 나눈다. 고정 90·92는 근사다. 월말 넘침(5/31 - 3개월 → 2/31)은 해당 월 말일로 당긴다.
export function averageWageWindowDays(lastWorkedDay) {
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
  if (windowStart.getDate() !== separation.getDate()) windowStart.setDate(0);
  return Math.round((separation.getTime() - windowStart.getTime()) / DAY_MS);
}

export function severancePayEstimate(years) {
  const avgWage = Math.floor(SEVERANCE_ASSUMED_MONTHLY * 1.1);
  const severance = Math.floor(avgWage * years);
  const yearDeduction = severanceYearDeduction(years);
  const estimatedTax = severanceIncomeTax(severance, years);
  return {
    avgWage,
    severance,
    yearDeduction,
    estimatedTax,
    netSeverance: severance - estimatedTax,
  };
}

// 주휴수당 (근로기준법 제55조) — 주 40시간 기준 8시간분
export function weeklyHolidayPay(hourly) {
  const weeklyBase = hourly * 40;
  const weeklyHoliday = Math.floor(hourly * 8);
  const weeklyTotal = weeklyBase + weeklyHoliday;
  return {
    weeklyBase,
    weeklyHoliday,
    weeklyTotal,
    monthlyTotal: Math.floor(weeklyTotal * 4.345),
    effectiveHourly: Math.floor(hourly * 1.2),
  };
}

// 시급 → 월급·연봉 환산 (월 평균 4.345주 = 365 ÷ 7 ÷ 12)
export function wageConversion(hourly) {
  const weeklyBase = hourly * 40;
  const weeklyTotal = weeklyBase + hourly * 8;
  const monthlyTotal = Math.floor(weeklyTotal * 4.345);
  return {
    dailyWage: hourly * 8,
    weeklyBase,
    weeklyTotal,
    monthlyTotal,
    annualTotal: monthlyTotal * 12,
  };
}

// 육아휴직 급여 (src/data/parentalLeave.ts 미러) — 12개월 일반 육아휴직
export const PARENTAL_LEAVE_FLOOR = 700_000;

export function parentalLeavePay(monthlyWage) {
  const pay1_3 = Math.min(2_500_000, Math.max(PARENTAL_LEAVE_FLOOR, Math.floor(monthlyWage * 1.0)));
  const pay4_6 = Math.min(2_000_000, Math.max(PARENTAL_LEAVE_FLOOR, Math.floor(monthlyWage * 1.0)));
  const pay7_12 = Math.min(1_600_000, Math.max(PARENTAL_LEAVE_FLOOR, Math.floor(monthlyWage * 0.8)));
  return { pay1_3, pay4_6, pay7_12, total: pay1_3 * 3 + pay4_6 * 3 + pay7_12 * 6 };
}

// 퇴사 후 건강보험 — 소득분만 반영한 최소 추정 (재산·자동차 점수는 편차가 커서 제외)
export function regionalHealthEstimate(monthlyIncome) {
  return {
    regionalIncomeOnly: Math.max(20_000, Math.floor(monthlyIncome * 0.0719)),
    formerEmployed: Math.floor(monthlyIncome * RATES_2026.healthInsurance.employee),
  };
}

// 월 원천징수 소득세 → 세전 연봉 역산. src/composables/useWithholdingReverse.ts 미러.
//
// 왜 이진탐색인가: 이전 구현은 (월세액 × 12 + 100만) ÷ 0.05 선형 근사였다. 소득세는 누진 구조에
// 근로소득세액공제까지 얹혀 있어 선형으로 되돌릴 수 없고, 실제로 월 50만원에서 화면(7,613만)과
// 1.8배 어긋난 값(1억 4,000만)을 허브·변종 8쪽에 찍고 있었다. 화면과 같은 방식으로 연봉을 좁혀
// 월 소득세가 입력값과 같아지는 최소 연봉을 찾는다. 기본 가정(부양가족 1인·비과세 식대 20만원)은
// 사이트 전역의 표준 시나리오와 같다.
export function withholdingReverse(
  monthlyTax,
  { dependents = 1, children = 0, nonTaxableMonthly = 200_000 } = {}
) {
  if (monthlyTax <= 0) return { estimatedAnnual: 0, estimatedManWon: 0 };
  let lo = 1_000_000;
  let hi = 3_000_000_000;
  for (let i = 0; i < 60; i += 1) {
    const mid = Math.floor((lo + hi) / 2);
    const { monthlyIncomeTax } = calculateSalaryBreakdown({
      grossAnnual: mid,
      nonTaxableMonthly,
      dependents,
      children,
      retirementIncluded: false,
    });
    if (monthlyIncomeTax < monthlyTax) lo = mid + 1;
    else hi = mid;
  }
  return { estimatedAnnual: lo, estimatedManWon: Math.round(lo / 10_000) };
}

// 임금체불 지연이자 — 적용 이율별 일할 계산
export const UNPAID_WAGE_RATE_TABLE = [
  { label: "민법 연 5% (재직·일반)", rate: 0.05 },
  { label: "상법 연 6% (재직·상사)", rate: 0.06 },
  { label: "소촉법 연 12% (소장 송달 후)", rate: 0.12 },
  { label: "근로기준법 연 20% (퇴직 후)", rate: 0.2 },
];

export function unpaidWageInterest(amount, rate, days) {
  return Math.floor((amount * rate * days) / 365);
}

// 근로장려금 산정 구간 (가구 유형별 점증·평탄·점감)
export const EITC_BRACKET_TABLE = {
  single: {
    label: "단독 가구",
    phaseInEnd: 4_000_000,
    plateauEnd: 9_000_000,
    phaseOutEnd: 22_000_000,
    maxAmount: 1_650_000,
  },
  "single-income": {
    label: "홑벌이 가구",
    phaseInEnd: 7_000_000,
    plateauEnd: 14_000_000,
    phaseOutEnd: 32_000_000,
    maxAmount: 2_850_000,
  },
  "double-income": {
    label: "맞벌이 가구",
    phaseInEnd: 8_000_000,
    plateauEnd: 17_000_000,
    phaseOutEnd: 44_000_000,
    maxAmount: 3_300_000,
  },
};

export function eitcAmountFor(income, bracket) {
  if (income >= bracket.phaseOutEnd) return 0;
  if (income < bracket.phaseInEnd) {
    return Math.floor((bracket.maxAmount * income) / bracket.phaseInEnd);
  }
  if (income <= bracket.plateauEnd) return bracket.maxAmount;
  return Math.floor(
    (bracket.maxAmount * (bracket.phaseOutEnd - income)) / (bracket.phaseOutEnd - bracket.plateauEnd),
  );
}

// --- 부가 계산기 산식 (src/utils/benefitCalculators.ts · scenarioCalculator.ts 미러) ---
// 허브 본문이 인용하는 수치의 출처. 뷰가 쓰는 함수를 그대로 옮겨왔으므로 허브가 말하는 금액과
// 사용자가 계산기를 열어 보는 금액이 같다. 각 허브는 해당 뷰의 기본 입력값을 시나리오로 쓴다.

export function getAnnualLeaveDays(monthsWorked) {
  const safeMonths = clamp(Math.floor(monthsWorked), 1, 600);
  if (safeMonths < 12) return Math.min(11, safeMonths);
  const serviceYears = Math.floor(safeMonths / 12);
  return Math.min(25, 15 + Math.floor(Math.max(0, serviceYears - 1) / 2));
}

export function calcAnnualLeavePay({ monthlySalary, fixedAllowance, monthsWorked, unusedLeaveDays }) {
  const ordinaryMonthly = Math.max(0, monthlySalary + fixedAllowance);
  const dailyOrdinaryWage = Math.floor((ordinaryMonthly / 209) * 8);
  const accruedLeaveDays = getAnnualLeaveDays(monthsWorked);
  const payableDays = Math.min(unusedLeaveDays, accruedLeaveDays);
  return {
    ordinaryMonthly,
    dailyOrdinaryWage,
    accruedLeaveDays,
    payableDays,
    totalAllowance: dailyOrdinaryWage * payableDays,
  };
}

// 조기수령 감액·연기가산 계수 (국민연금법 시행령)
export const PENSION_AGE_FACTORS = {
  60: 0.7, 61: 0.76, 62: 0.82, 63: 0.88, 64: 0.94, 65: 1,
  66: 1.072, 67: 1.144, 68: 1.216, 69: 1.288, 70: 1.36,
};

export function calcPensionEstimate({ averageMonthlyIncome, insuredYears, claimAge }) {
  const recognizedYears = clamp(insuredYears, 1, 40);
  const ageFactor = PENSION_AGE_FACTORS[claimAge] ?? 1;
  const baseMonthlyPension = (360_000 + averageMonthlyIncome * 0.22) * (recognizedYears / 40);
  const estimatedMonthlyPension = Math.floor(baseMonthlyPension * ageFactor);
  return {
    ageFactor,
    recognizedYears,
    eligible: insuredYears >= 10,
    estimatedMonthlyPension,
    estimatedAnnualPension: estimatedMonthlyPension * 12,
    employeeContribution: Math.floor(averageMonthlyIncome * RATES_2026.nationalPension.total),
  };
}

// 월세 세액공제 — 총급여 5,500만 이하 17%, 8,000만 이하 15%, 초과 대상 제외. 한도 연 1,000만원
export function calcMonthlyRentDeduction({ annualSalary, monthlyRent, paidMonths }) {
  const deductionRate = annualSalary <= 55_000_000 ? 0.17 : annualSalary <= 80_000_000 ? 0.15 : 0;
  const yearlyRent = monthlyRent * paidMonths;
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

// 연금계좌 세액공제 — 연금저축 600만 한도, IRP 합산 900만 한도
export function calcIrpTaxCredit({ annualSalary, pensionSavings, irpContribution }) {
  const taxCreditRate = annualSalary <= 55_000_000 ? 0.15 : 0.12;
  const recognizedPensionSavings = Math.min(6_000_000, pensionSavings);
  const recognizedIrp = Math.min(Math.max(0, 9_000_000 - recognizedPensionSavings), irpContribution);
  const recognizedContribution = recognizedPensionSavings + recognizedIrp;
  return {
    taxCreditRate,
    recognizedPensionSavings,
    recognizedIrp,
    recognizedContribution,
    overflowAmount:
      Math.max(0, pensionSavings - recognizedPensionSavings) +
      Math.max(0, irpContribution - recognizedIrp),
    taxCredit: Math.floor(recognizedContribution * taxCreditRate),
  };
}

export function calcEmployerInsuranceBurden({ monthlySalary, employmentRatePercent, accidentRatePercent }) {
  const pensionBase = clamp(
    monthlySalary,
    RATES_2026.nationalPension.minMonthlyIncome,
    RATES_2026.nationalPension.maxMonthlyIncome
  );
  const nationalPension = Math.floor(pensionBase * RATES_2026.nationalPension.employer);
  const healthInsurance = Math.floor(monthlySalary * RATES_2026.healthInsurance.employer);
  const longTermCare = Math.floor(healthInsurance * RATES_2026.longTermCare.rateOfHealth);
  const employmentInsurance = Math.floor(monthlySalary * (employmentRatePercent / 100));
  const industrialAccident = Math.floor(monthlySalary * (accidentRatePercent / 100));
  const totalMonthlyBurden =
    nationalPension + healthInsurance + longTermCare + employmentInsurance + industrialAccident;
  return {
    nationalPension,
    healthInsurance,
    longTermCare,
    employmentInsurance,
    industrialAccident,
    totalMonthlyBurden,
    totalAnnualBurden: totalMonthlyBurden * 12,
    employerRate: monthlySalary > 0 ? totalMonthlyBurden / monthlySalary : 0,
  };
}

const STANDARD_PAYROLL = { dependents: 1, children: 0, nonTaxableMonthly: 200_000, retirementIncluded: false };

export function calcRaiseImpact({ currentAnnual, raisePercent }) {
  const raiseAmount = Math.round(currentAnnual * (raisePercent / 100));
  const current = calculateSalaryBreakdown({ grossAnnual: currentAnnual, ...STANDARD_PAYROLL });
  const next = calculateSalaryBreakdown({ grossAnnual: currentAnnual + raiseAmount, ...STANDARD_PAYROLL });
  return {
    current,
    next,
    raiseAmount,
    monthlyNetDiff: next.monthlyNet - current.monthlyNet,
    annualNetDiff: next.annualNet - current.annualNet,
    insuranceDelta: next.totalInsurance - current.totalInsurance,
    taxDelta: next.totalTax - current.totalTax,
  };
}

export function calcBonusImpact({ annualSalary, bonusAmount }) {
  const base = calculateSalaryBreakdown({ grossAnnual: annualSalary, ...STANDARD_PAYROLL });
  const withBonus = calculateSalaryBreakdown({ grossAnnual: annualSalary + bonusAmount, ...STANDARD_PAYROLL });
  const netBonus = withBonus.annualNet - base.annualNet;
  return {
    base,
    withBonus,
    netBonus,
    effectiveBonusRate: bonusAmount > 0 ? netBonus / bonusAmount : 0,
    bonusTax: bonusAmount - netBonus,
  };
}

export function calcOvertimeImpact({ monthlySalary, monthlyBaseHours, overtimeHours, nightHours, holidayHours }) {
  const hourlyRate = Math.floor(monthlySalary / monthlyBaseHours);
  const overtimePay = Math.floor(hourlyRate * overtimeHours * 1.5);
  const nightPay = Math.floor(hourlyRate * nightHours * 0.5);
  const holidayPay = Math.floor(hourlyRate * holidayHours * 1.5);
  const totalExtraGross = overtimePay + nightPay + holidayPay;
  const before = calculateSalaryBreakdown({ grossAnnual: monthlySalary * 12, ...STANDARD_PAYROLL });
  const after = calculateSalaryBreakdown({
    grossAnnual: (monthlySalary + totalExtraGross) * 12,
    ...STANDARD_PAYROLL,
  });
  return {
    hourlyRate,
    overtimePay,
    nightPay,
    holidayPay,
    totalExtraGross,
    totalExtraNet: after.monthlyNet - before.monthlyNet,
  };
}

// 목표 실수령 → 필요 청구액 역산. 뷰는 업종별 계산기를 쓰지만 프리렌더에서는 /freelancer와 같은
// 단순경비율 엔진으로 이분탐색한다 — 두 프리랜서 페이지가 서로 다른 세액을 말하면 안 되기 때문.
export function calcFreelanceRate({ targetMonthlyNet, workDaysMonthly, billableHoursDaily }) {
  const annualTargetNet = targetMonthlyNet * 12;
  const netFromGross = (gross) => gross - computeComprehensiveTax(gross).totalTax;
  let low = annualTargetNet;
  let high = Math.max(annualTargetNet + 12_000_000, Math.floor(annualTargetNet * 1.4));
  while (netFromGross(high) < annualTargetNet && high < 2_000_000_000) high = Math.floor(high * 1.35);
  for (let i = 0; i < 42; i += 1) {
    const mid = Math.floor((low + high) / 2);
    if (netFromGross(mid) >= annualTargetNet) high = mid;
    else low = mid + 1;
  }
  const annualGross = Math.ceil(high / 1_000) * 1_000;
  const monthlyGross = Math.floor(annualGross / 12);
  return {
    annualTargetNet,
    annualGross,
    monthlyGross,
    dailyRate: Math.floor(monthlyGross / workDaysMonthly),
    hourlyRate: Math.floor(monthlyGross / (workDaysMonthly * billableHoursDaily)),
    tax: computeComprehensiveTax(annualGross),
  };
}

// --- 포맷팅 유틸 ---
export function formatWon(value) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

export function formatManWonValue(manWon) {
  if (manWon >= 10000) {
    const ok = Math.floor(manWon / 10000);
    const rest = manWon % 10000;
    if (rest === 0) return `${ok.toLocaleString("ko-KR")}억`;
    return `${ok}억 ${rest.toLocaleString("ko-KR")}만`;
  }
  return `${manWon.toLocaleString("ko-KR")}만`;
}

export function formatPercent(value, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`;
}
