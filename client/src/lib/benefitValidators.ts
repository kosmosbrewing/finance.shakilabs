import { z } from "zod";
import { RATES_2026 } from "@/data/taxRates2026";
import type {
  AnnualLeaveInput,
  EmployerInsuranceInput,
  IrpInput,
  MonthlyRentDeductionInput,
  PensionInput,
  RegionalHealthInput,
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

// 평균 기준소득월액이 놓일 수 있는 구간. 화면 슬라이더의 min·max와 같은 상수에서 나오므로
// 슬라이더와 검증 계층이 서로 다른 범위를 주장할 수 없다.
export const PENSION_INCOME_MIN = RATES_2026.nationalPension.minMonthlyIncome;
export const PENSION_INCOME_MAX = RATES_2026.nationalPension.maxMonthlyIncome;

// 슬라이더는 어포던스일 뿐 보증이 아니다. 저장된 상태·URL 쿼리·붙여넣은 값은 슬라이더를 거치지
// 않고 들어오고, salarySchema는 3억까지 통과시키므로 상한 위 소득이 그대로 엔진에 닿았다.
//
// 범위 밖 값을 기본값으로 되돌리지 않고 경계값으로 자르는 이유: 1,200만원을 넣은 사람에게
// 3,200,000원짜리 답을 돌려주면 그 답이 어느 질문에 대한 것인지 알 수 없다. 경계로 자르면
// 답은 사용자가 물어본 것에 가장 가까운 값으로 남고, 화면은 잘렸다는 사실을 함께 알린다.
// (범위 밖 입력을 경계로 자르고 알리는 것은 loan·invest에서 쓰는 함대 공통 규약이다.)
const pensionIncomeSchema = z.number().finite().int().min(0).max(300_000_000);

function clampPensionIncome(value: unknown, fallback: number): number {
  const result = pensionIncomeSchema.safeParse(value);
  // 숫자가 아니거나 NaN·무한대면 자를 대상 자체가 없다. 그때만 기본값으로 돌아간다.
  if (!result.success) return fallback;
  return Math.min(PENSION_INCOME_MAX, Math.max(PENSION_INCOME_MIN, result.data));
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
    averageMonthlyIncome: clampPensionIncome(input.averageMonthlyIncome, 3_200_000),
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

const bigMoneySchema = z.number().finite().int().min(0).max(5_000_000_000);

export function normalizeRegionalHealthInput(
  input: Partial<RegionalHealthInput>,
): RegionalHealthInput {
  return {
    monthlySalary: parseWithFallback(salarySchema, input.monthlySalary, 3_500_000),
    financialIncome: parseWithFallback(moneySchema, input.financialIncome, 0),
    propertyTaxBase: parseWithFallback(bigMoneySchema, input.propertyTaxBase, 0),
    carTaxBase: parseWithFallback(bigMoneySchema, input.carTaxBase, 0),
  };
}
