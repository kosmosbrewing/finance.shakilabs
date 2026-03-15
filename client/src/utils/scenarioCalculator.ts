import type { IndustryKey, IncomeType } from "@/data/freelanceTaxRates";
import {
  calculateFreelanceTax,
  type FreelanceCalcResult,
} from "@/composables/useFreelanceCalc";
import {
  calculateSalaryBreakdown,
  type SalaryBreakdown,
} from "@/utils/calculator";

type PayrollSharedInput = {
  dependents: number;
  children: number;
  nonTaxableMonthly: number;
};

export type RaiseInput = PayrollSharedInput & {
  currentAnnual: number;
  raisePercent: number;
};

export type BonusInput = PayrollSharedInput & {
  annualSalary: number;
  bonusAmount: number;
};

export type OvertimeInput = PayrollSharedInput & {
  monthlySalary: number;
  overtimeHours: number;
  nightHours: number;
  holidayHours: number;
  monthlyBaseHours: number;
};

export type FreelanceRateInput = {
  targetMonthlyNet: number;
  workDaysMonthly: number;
  billableHoursDaily: number;
  dependents: number;
  incomeType: IncomeType;
  industryKey: IndustryKey;
};

export type RaiseResult = {
  current: SalaryBreakdown;
  next: SalaryBreakdown;
  raiseAmount: number;
  monthlyNetDiff: number;
  annualNetDiff: number;
  insuranceDelta: number;
  taxDelta: number;
};

export type BonusResult = {
  base: SalaryBreakdown;
  withBonus: SalaryBreakdown;
  netBonus: number;
  effectiveBonusRate: number;
  bonusTax: number;
};

export type OvertimeResult = {
  before: SalaryBreakdown;
  after: SalaryBreakdown;
  hourlyRate: number;
  overtimePay: number;
  nightPay: number;
  holidayPay: number;
  totalExtraGross: number;
  totalExtraNet: number;
};

export type FreelanceRateResult = {
  annualGross: number;
  monthlyInvoice: number;
  dailyRate: number;
  hourlyRate: number;
  annualTargetNet: number;
  cashAfterWithholdingMonthly: number;
  settlementDelta: number;
  tax: FreelanceCalcResult;
};

function buildSalaryBreakdown(
  grossAnnual: number,
  shared: PayrollSharedInput
): SalaryBreakdown {
  return calculateSalaryBreakdown({
    grossAnnual,
    dependents: shared.dependents,
    children: shared.children,
    nonTaxableMonthly: shared.nonTaxableMonthly,
    retirementIncluded: false,
  });
}

export function calculateRaiseImpact(input: RaiseInput): RaiseResult {
  const raiseAmount = Math.round(input.currentAnnual * (input.raisePercent / 100));
  const current = buildSalaryBreakdown(input.currentAnnual, input);
  const next = buildSalaryBreakdown(input.currentAnnual + raiseAmount, input);

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

export function calculateBonusImpact(input: BonusInput): BonusResult {
  const base = buildSalaryBreakdown(input.annualSalary, input);
  const withBonus = buildSalaryBreakdown(input.annualSalary + input.bonusAmount, input);
  const netBonus = withBonus.annualNet - base.annualNet;

  return {
    base,
    withBonus,
    netBonus,
    effectiveBonusRate: input.bonusAmount > 0 ? netBonus / input.bonusAmount : 0,
    bonusTax: input.bonusAmount - netBonus,
  };
}

export function calculateOvertimeImpact(input: OvertimeInput): OvertimeResult {
  const hourlyRate = Math.floor(input.monthlySalary / input.monthlyBaseHours);
  const overtimePay = Math.floor(hourlyRate * input.overtimeHours * 1.5);
  const nightPay = Math.floor(hourlyRate * input.nightHours * 0.5);
  const holidayPay = Math.floor(hourlyRate * input.holidayHours * 1.5);
  const totalExtraGross = overtimePay + nightPay + holidayPay;

  const before = buildSalaryBreakdown(input.monthlySalary * 12, input);
  const after = buildSalaryBreakdown((input.monthlySalary + totalExtraGross) * 12, input);

  return {
    before,
    after,
    hourlyRate,
    overtimePay,
    nightPay,
    holidayPay,
    totalExtraGross,
    totalExtraNet: after.monthlyNet - before.monthlyNet,
  };
}

export function calculateFreelanceRateImpact(
  input: FreelanceRateInput
): FreelanceRateResult {
  const annualTargetNet = input.targetMonthlyNet * 12;
  let low = annualTargetNet;
  let high = Math.max(annualTargetNet + 12_000_000, Math.floor(annualTargetNet * 1.4));

  const netAnnualFromGross = (gross: number): number =>
    gross -
    calculateFreelanceTax({
      annualIncome: gross,
      incomeType: input.incomeType,
      industryKey: input.industryKey,
      dependents: input.dependents,
    }).totalTax;

  while (netAnnualFromGross(high) < annualTargetNet && high < 2_000_000_000) {
    high = Math.floor(high * 1.35);
  }

  for (let index = 0; index < 42; index += 1) {
    const middle = Math.floor((low + high) / 2);
    if (netAnnualFromGross(middle) >= annualTargetNet) {
      high = middle;
    } else {
      low = middle + 1;
    }
  }

  const annualGross = Math.ceil(high / 1_000) * 1_000;
  const tax = calculateFreelanceTax({
    annualIncome: annualGross,
    incomeType: input.incomeType,
    industryKey: input.industryKey,
    dependents: input.dependents,
  });
  const monthlyInvoice = Math.ceil(annualGross / 12);
  const dailyRate = Math.ceil(monthlyInvoice / input.workDaysMonthly / 1_000) * 1_000;
  const hourlyRate = Math.ceil(dailyRate / input.billableHoursDaily / 100) * 100;

  return {
    annualGross,
    monthlyInvoice,
    dailyRate,
    hourlyRate,
    annualTargetNet,
    cashAfterWithholdingMonthly: Math.floor((annualGross - tax.withheld) / 12),
    settlementDelta: tax.totalTax - tax.withheld,
    tax,
  };
}
