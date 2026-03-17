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
