import {
  CHILD_TAX_CREDIT,
  getEarnedIncomeTaxCreditLimit,
  LOCAL_INCOME_TAX_RATE,
  PERSONAL_DEDUCTION_PER_PERSON,
  RATES_2026,
  STANDARD_TAX_CREDIT,
} from "@/data/taxRates2026";
import {
  EARNED_INCOME_DEDUCTION_BRACKETS,
  INCOME_TAX_BRACKETS,
} from "@/data/taxBrackets";

export type SalaryCalcInput = {
  grossAnnual: number;
  nonTaxableMonthly: number;
  dependents: number;
  children: number;
  retirementIncluded: boolean;
};

export type InsuranceDeduction = {
  nationalPension: number;
  healthInsurance: number;
  longTermCare: number;
  employmentInsurance: number;
  totalInsurance: number;
};

export type IncomeTaxBundle = {
  annualTaxableIncome: number;
  earnedIncomeDeduction: number;
  personalDeduction: number;
  annualInsuranceDeduction: number;
  taxableBase: number;
  calculatedTax: number;
  taxCredit: number;
  standardTaxCredit: number;
  childTaxCredit: number;
  determinedTax: number;
  annualLocalTax: number;
  monthlyIncomeTax: number;
  monthlyLocalTax: number;
};

export type SalaryBreakdown = SalaryCalcInput &
  InsuranceDeduction &
  IncomeTaxBundle & {
    monthlyGross: number;
    taxableMonthly: number;
    totalTax: number;
    totalDeduction: number;
    monthlyNet: number;
    annualNet: number;
    effectiveTaxRate: number;
    employerCost: {
      nationalPension: number;
      healthInsurance: number;
      employmentInsurance: number;
      total: number;
    };
  };

// 정수 범위 보정
export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// 근로소득공제 계산 (한도 2,000만원, 소득세법 제47조)
export function calcEarnedIncomeDeduction(annualSalary: number): number {
  for (const bracket of EARNED_INCOME_DEDUCTION_BRACKETS) {
    if (annualSalary <= bracket.limit) {
      const deduction = Math.floor(
        bracket.baseDeduction +
          (annualSalary - bracket.baseSalary) * bracket.rate
      );
      return Math.min(deduction, 20_000_000);
    }
  }
  return 0;
}

// 종합소득세 구간 계산
export function calcIncomeTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;

  for (const bracket of INCOME_TAX_BRACKETS) {
    if (taxableIncome <= bracket.limit) {
      return Math.floor(
        bracket.progressiveTax +
          (taxableIncome - bracket.baseIncome) * bracket.rate
      );
    }
  }

  return 0;
}

// 근로소득세액공제 계산
export function calcEarnedIncomeTaxCredit(
  calculatedTax: number,
  annualTaxableIncome: number
): number {
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

// 자녀세액공제 계산
export function calcChildTaxCredit(children: number): number {
  if (children <= 0) return 0;
  if (children === 1) return CHILD_TAX_CREDIT.oneChild;
  if (children === 2) return CHILD_TAX_CREDIT.twoChildren;

  return (
    CHILD_TAX_CREDIT.twoChildren +
    (children - 2) * CHILD_TAX_CREDIT.extraPerChildOverTwo
  );
}

// 4대보험 계산 (근로자 부담)
export function calcInsuranceDeduction(taxableMonthly: number): InsuranceDeduction {
  const safeTaxable = Math.max(0, Math.floor(taxableMonthly));

  const pensionBase = clampNumber(
    safeTaxable,
    RATES_2026.nationalPension.minMonthlyIncome,
    RATES_2026.nationalPension.maxMonthlyIncome
  );

  const nationalPension =
    safeTaxable > 0
      ? Math.floor(pensionBase * RATES_2026.nationalPension.employee)
      : 0;
  const healthInsurance = Math.floor(
    safeTaxable * RATES_2026.healthInsurance.employee
  );
  const longTermCare = Math.floor(
    healthInsurance * RATES_2026.longTermCare.rateOfHealth
  );
  const employmentInsurance = Math.floor(
    safeTaxable * RATES_2026.employmentInsurance.employee
  );

  return {
    nationalPension,
    healthInsurance,
    longTermCare,
    employmentInsurance,
    totalInsurance:
      nationalPension + healthInsurance + longTermCare + employmentInsurance,
  };
}

// 세액 계산 묶음
export function calcIncomeTaxBundle(input: {
  annualTaxableIncome: number;
  dependents: number;
  children: number;
  monthlyInsuranceTotal: number;
}): IncomeTaxBundle {
  const safeDependents = clampNumber(Math.floor(input.dependents || 1), 1, 20);
  const maxChildren = Math.max(0, safeDependents - 1);
  const safeChildren = clampNumber(Math.floor(input.children || 0), 0, maxChildren);
  const annualTaxableIncome = Math.max(0, Math.floor(input.annualTaxableIncome));

  const earnedIncomeDeduction = calcEarnedIncomeDeduction(annualTaxableIncome);
  const personalDeduction = safeDependents * PERSONAL_DEDUCTION_PER_PERSON;
  const annualInsuranceDeduction = Math.floor(
    Math.max(0, input.monthlyInsuranceTotal) * 12
  );

  const taxableBase = Math.max(
    0,
    annualTaxableIncome -
      earnedIncomeDeduction -
      personalDeduction -
      annualInsuranceDeduction
  );

  const calculatedTax = calcIncomeTax(taxableBase);
  const taxCredit = calcEarnedIncomeTaxCredit(calculatedTax, annualTaxableIncome);
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
    annualTaxableIncome,
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

// 실수령액 종합 계산
export function calculateSalaryBreakdown(input: SalaryCalcInput): SalaryBreakdown {
  const safeGrossAnnual = Math.max(0, Math.floor(input.grossAnnual || 0));
  const safeNonTaxableMonthly = clampNumber(
    Math.floor(input.nonTaxableMonthly || 0),
    0,
    5_000_000
  );
  const safeDependents = clampNumber(Math.floor(input.dependents || 1), 1, 20);
  const maxChildren = Math.max(0, safeDependents - 1);
  const safeChildren = clampNumber(Math.floor(input.children || 0), 0, maxChildren);

  const monthlyGross = Math.floor(
    safeGrossAnnual / (input.retirementIncluded ? 13 : 12)
  );
  const taxableMonthly = Math.max(0, monthlyGross - safeNonTaxableMonthly);

  const insurance = calcInsuranceDeduction(taxableMonthly);

  const annualTaxableIncome = Math.max(0, monthlyGross * 12 - safeNonTaxableMonthly * 12);
  const tax = calcIncomeTaxBundle({
    annualTaxableIncome,
    dependents: safeDependents,
    children: safeChildren,
    monthlyInsuranceTotal: insurance.totalInsurance,
  });

  const totalTax = tax.monthlyIncomeTax + tax.monthlyLocalTax;
  const totalDeduction = insurance.totalInsurance + totalTax;
  const monthlyNet = monthlyGross - totalDeduction;
  const annualNet = monthlyNet * 12;
  const effectiveTaxRate = monthlyGross > 0 ? totalDeduction / monthlyGross : 0;

  const employerCost = {
    nationalPension:
      taxableMonthly > 0
        ? Math.floor(
            clampNumber(
              taxableMonthly,
              RATES_2026.nationalPension.minMonthlyIncome,
              RATES_2026.nationalPension.maxMonthlyIncome
            ) * RATES_2026.nationalPension.employer
          )
        : 0,
    healthInsurance: Math.floor(
      taxableMonthly * RATES_2026.healthInsurance.employer
    ),
    employmentInsurance: Math.floor(
      taxableMonthly * RATES_2026.employmentInsurance.employer
    ),
    total: 0,
  };

  employerCost.total =
    employerCost.nationalPension +
    employerCost.healthInsurance +
    employerCost.employmentInsurance;

  return {
    grossAnnual: safeGrossAnnual,
    nonTaxableMonthly: safeNonTaxableMonthly,
    dependents: safeDependents,
    children: safeChildren,
    retirementIncluded: Boolean(input.retirementIncluded),
    monthlyGross,
    taxableMonthly,
    ...insurance,
    ...tax,
    totalTax,
    totalDeduction,
    monthlyNet,
    annualNet,
    effectiveTaxRate,
    employerCost,
  };
}
