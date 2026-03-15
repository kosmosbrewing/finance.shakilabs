import { z } from "zod";
import type {
  BonusInput,
  FreelanceRateInput,
  OvertimeInput,
  RaiseInput,
} from "@/utils/scenarioCalculator";
import { FREELANCE_INDUSTRIES } from "@/data/freelanceTaxRates";

const annualSalarySchema = z.number().finite().int().min(12_000_000).max(300_000_000);
const monthlyMoneySchema = z.number().finite().int().min(0).max(20_000_000);
const percentSchema = z.number().finite().min(0).max(100);
const dependentsSchema = z.number().finite().int().min(1).max(20);
const childrenSchema = z.number().finite().int().min(0).max(10);
const workDaysSchema = z.number().finite().int().min(1).max(31);
const workHoursSchema = z.number().finite().min(1).max(24);
const baseHoursSchema = z.number().finite().int().min(160).max(240);

function parseWithFallback<T>(schema: z.ZodType<T>, value: unknown, fallback: T): T {
  const result = schema.safeParse(value);
  return result.success ? result.data : fallback;
}

function clampChildren(children: number, dependents: number): number {
  return Math.max(0, Math.min(Math.max(0, dependents - 1), children));
}

export function normalizeRaiseInput(input: Partial<RaiseInput>): RaiseInput {
  const dependents = parseWithFallback(dependentsSchema, input.dependents, 1);

  return {
    currentAnnual: parseWithFallback(annualSalarySchema, input.currentAnnual, 52_000_000),
    raisePercent: parseWithFallback(percentSchema, input.raisePercent, 8),
    dependents,
    children: clampChildren(
      parseWithFallback(childrenSchema, input.children, 0),
      dependents
    ),
    nonTaxableMonthly: parseWithFallback(monthlyMoneySchema, input.nonTaxableMonthly, 200_000),
  };
}

export function normalizeBonusInput(input: Partial<BonusInput>): BonusInput {
  const dependents = parseWithFallback(dependentsSchema, input.dependents, 1);

  return {
    annualSalary: parseWithFallback(annualSalarySchema, input.annualSalary, 52_000_000),
    bonusAmount: parseWithFallback(monthlyMoneySchema, input.bonusAmount, 5_000_000),
    dependents,
    children: clampChildren(
      parseWithFallback(childrenSchema, input.children, 0),
      dependents
    ),
    nonTaxableMonthly: parseWithFallback(monthlyMoneySchema, input.nonTaxableMonthly, 200_000),
  };
}

export function normalizeOvertimeInput(input: Partial<OvertimeInput>): OvertimeInput {
  const dependents = parseWithFallback(dependentsSchema, input.dependents, 1);

  return {
    monthlySalary: parseWithFallback(monthlyMoneySchema, input.monthlySalary, 3_200_000),
    overtimeHours: parseWithFallback(workDaysSchema, input.overtimeHours, 12),
    nightHours: parseWithFallback(workDaysSchema, input.nightHours, 6),
    holidayHours: parseWithFallback(workDaysSchema, input.holidayHours, 8),
    monthlyBaseHours: parseWithFallback(baseHoursSchema, input.monthlyBaseHours, 209),
    dependents,
    children: clampChildren(
      parseWithFallback(childrenSchema, input.children, 0),
      dependents
    ),
    nonTaxableMonthly: parseWithFallback(monthlyMoneySchema, input.nonTaxableMonthly, 200_000),
  };
}

export function normalizeFreelanceRateInput(
  input: Partial<FreelanceRateInput>
): FreelanceRateInput {
  const dependents = parseWithFallback(dependentsSchema, input.dependents, 1);
  const incomeType = input.incomeType === "other_income" ? "other_income" : "business";
  const industryKey =
    typeof input.industryKey === "string" && input.industryKey in FREELANCE_INDUSTRIES
      ? input.industryKey
      : "it";

  return {
    targetMonthlyNet: parseWithFallback(monthlyMoneySchema, input.targetMonthlyNet, 4_000_000),
    workDaysMonthly: parseWithFallback(workDaysSchema, input.workDaysMonthly, 18),
    billableHoursDaily: parseWithFallback(workHoursSchema, input.billableHoursDaily, 6),
    dependents,
    incomeType,
    industryKey,
  };
}
