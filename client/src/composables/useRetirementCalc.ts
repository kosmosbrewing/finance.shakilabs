import { computed, toValue, type MaybeRefOrGetter } from "vue";
import { calcIncomeTax } from "@/utils/calculator";

export type RetirementInput = {
  startDate: string;
  endDate: string;
  monthlySalary: number;
  annualBonus: number;
};

function parseDate(value: string): Date | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function formatPeriod(serviceDays: number): string {
  const years = Math.floor(serviceDays / 365);
  const remainDays = serviceDays % 365;
  const months = Math.floor(remainDays / 30);
  const days = remainDays % 30;
  return `${years}년 ${months}개월 ${days}일`;
}

// 근속연수공제 (소득세법 제48조 제1항)
function calcServiceDeduction(years: number): number {
  if (years <= 5) return years * 1_000_000;
  if (years <= 10) return 5_000_000 + (years - 5) * 2_000_000;
  if (years <= 20) return 15_000_000 + (years - 10) * 2_500_000;
  return 40_000_000 + (years - 20) * 3_000_000;
}

// 환산급여공제 (소득세법 제48조 제3항)
function calcConvertedSalaryDeduction(convertedSalary: number): number {
  if (convertedSalary <= 8_000_000) return convertedSalary;
  if (convertedSalary <= 70_000_000) return 8_000_000 + (convertedSalary - 8_000_000) * 0.6;
  if (convertedSalary <= 100_000_000) return 45_200_000 + (convertedSalary - 70_000_000) * 0.55;
  if (convertedSalary <= 300_000_000) return 61_700_000 + (convertedSalary - 100_000_000) * 0.45;
  return 151_700_000 + (convertedSalary - 300_000_000) * 0.35;
}

// 퇴직금 + 퇴직소득세 계산
export function useRetirementCalc(input: MaybeRefOrGetter<RetirementInput>) {
  return computed(() => {
    const resolved = toValue(input);
    const startDate = parseDate(resolved.startDate);
    const endDate = parseDate(resolved.endDate);

    if (!startDate || !endDate || endDate < startDate) {
      return {
        serviceDays: 0,
        serviceYears: 0,
        servicePeriodLabel: "0년 0개월 0일",
        averageDailyWage: 0,
        severanceGross: 0,
        retirementTax: 0,
        severanceNet: 0,
      };
    }

    const dayMs = 24 * 60 * 60 * 1000;
    const serviceDays = Math.floor((endDate.getTime() - startDate.getTime()) / dayMs) + 1;
    const serviceYears = Math.max(1, Math.floor(serviceDays / 365));

    // 평균임금: 최근 3개월 임금 + 상여 3/12를 92일로 나눈 간이 계산
    const threeMonthSalary = Math.max(0, resolved.monthlySalary) * 3;
    const threeMonthBonus = Math.max(0, resolved.annualBonus) * 0.25;
    const averageDailyWage = Math.floor((threeMonthSalary + threeMonthBonus) / 92);

    const severanceGross = Math.floor(
      averageDailyWage * 30 * (serviceDays / 365)
    );

    // 퇴직소득세: 근속연수공제 → 환산급여 → 환산급여공제 → 세율 적용 (소득세법 제48조)
    const serviceDeduction = calcServiceDeduction(serviceYears);
    const retirementTaxBase = Math.max(0, severanceGross - serviceDeduction);

    // 환산급여 = (퇴직소득금액 - 근속연수공제) / 근속연수 × 12
    const convertedSalary = Math.floor((retirementTaxBase / serviceYears) * 12);
    const convertedDeduction = calcConvertedSalaryDeduction(convertedSalary);
    const taxBase = Math.max(0, convertedSalary - convertedDeduction);

    // 환산산출세액 → 최종 퇴직소득세
    const convertedTax = calcIncomeTax(taxBase);
    const retirementTax = Math.floor((convertedTax / 12) * serviceYears);

    return {
      serviceDays,
      serviceYears,
      servicePeriodLabel: formatPeriod(serviceDays),
      averageDailyWage,
      severanceGross,
      retirementTax,
      severanceNet: Math.max(0, severanceGross - retirementTax),
    };
  });
}
