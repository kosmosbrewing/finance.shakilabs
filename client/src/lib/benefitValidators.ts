import { z } from "zod";
import type {
  AnnualLeaveInput,
  EmployerInsuranceInput,
  IrpInput,
  MonthlyRentDeductionInput,
  PensionInput,
} from "@/utils/benefitCalculators";

const moneySchema = z.number().finite().int().min(0).max(500_000_000);
const salarySchema = z.number().finite().int().min(1_000_000).max(300_000_000);
const monthsSchema = z.number().finite().int().min(1).max(60);
const yearsSchema = z.number().finite().int().min(1).max(40);
const ageSchema = z.number().finite().int().min(60).max(70);
const percentSchema = z.number().finite().min(0).max(30);
const leaveDaysSchema = z.number().finite().int().min(0).max(30);

function parseWithFallback<T>(schema: z.ZodType<T>, value: unknown, fallback: T): T {
  const result = schema.safeParse(value);
  return result.success ? result.data : fallback;
}

export function normalizeAnnualLeaveInput(input: Partial<AnnualLeaveInput>): AnnualLeaveInput {
  return {
    monthlySalary: parseWithFallback(salarySchema, input.monthlySalary, 3_600_000),
    fixedAllowance: parseWithFallback(moneySchema, input.fixedAllowance, 200_000),
    monthsWorked: parseWithFallback(monthsSchema, input.monthsWorked, 24),
    unusedLeaveDays: parseWithFallback(leaveDaysSchema, input.unusedLeaveDays, 5),
  };
}

export function normalizePensionInput(input: Partial<PensionInput>): PensionInput {
  return {
    averageMonthlyIncome: parseWithFallback(salarySchema, input.averageMonthlyIncome, 3_200_000),
    insuredYears: parseWithFallback(yearsSchema, input.insuredYears, 20),
    claimAge: parseWithFallback(ageSchema, input.claimAge, 65),
  };
}

export function normalizeMonthlyRentDeductionInput(
  input: Partial<MonthlyRentDeductionInput>
): MonthlyRentDeductionInput {
  return {
    annualSalary: parseWithFallback(salarySchema, input.annualSalary, 48_000_000),
    monthlyRent: parseWithFallback(moneySchema, input.monthlyRent, 700_000),
    paidMonths: parseWithFallback(monthsSchema, input.paidMonths, 12),
  };
}

export function normalizeIrpInput(input: Partial<IrpInput>): IrpInput {
  return {
    annualSalary: parseWithFallback(salarySchema, input.annualSalary, 52_000_000),
    pensionSavings: parseWithFallback(moneySchema, input.pensionSavings, 4_000_000),
    irpContribution: parseWithFallback(moneySchema, input.irpContribution, 3_000_000),
  };
}

export function normalizeEmployerInsuranceInput(
  input: Partial<EmployerInsuranceInput>
): EmployerInsuranceInput {
  return {
    monthlySalary: parseWithFallback(salarySchema, input.monthlySalary, 3_200_000),
    employmentRatePercent: parseWithFallback(percentSchema, input.employmentRatePercent, 0.9),
    accidentRatePercent: parseWithFallback(percentSchema, input.accidentRatePercent, 1.5),
  };
}
