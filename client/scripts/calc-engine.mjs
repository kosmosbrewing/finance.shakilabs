// 프리렌더 전용 계산 엔진 (src/utils/calculator.ts 미러)
// 목적: 빌드 시점에 실제 계산값을 정적 HTML에 주입하여 SEO/AdSense 콘텐츠 가치 향상

// --- 2026년 요율 (src/data/taxRates2026.ts 미러) ---
export const RATES_2026 = {
  nationalPension: {
    employee: 0.0475,
    employer: 0.0475,
    minMonthlyIncome: 410_000,
    maxMonthlyIncome: 6_590_000,
  },
  healthInsurance: { employee: 0.03595, employer: 0.03595 },
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
