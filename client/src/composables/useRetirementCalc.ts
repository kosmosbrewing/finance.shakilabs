import { computed, toValue, type MaybeRefOrGetter } from "vue";
import {
  averageWageWindowDays,
  calcAverageDailyWage,
  calculateSeveranceTaxParts,
} from "@/utils/laborCalculator";

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

const EMPTY = {
  serviceDays: 0,
  serviceYears: 0,
  averageDailyWage: 0,
  windowDays: 0,
  severanceGross: 0,
  retirementIncomeTax: 0,
  retirementLocalTax: 0,
  retirementTax: 0,
  severanceNet: 0,
};

// 퇴직금 + 퇴직소득세 계산.
// Shares the statutory core with /severance-pay (laborCalculator): the daily
// average wage divides the 3-month wages by the ACTUAL window days (89-92,
// 근로기준법 제2조 제1항 제6호) -- the former fixed /92 was an approximation --
// and the tax is the same 연분연승 formula, split into national income tax and
// 10% local income tax so both screens show identical, honestly-labeled values.
export function useRetirementCalc(input: MaybeRefOrGetter<RetirementInput>) {
  return computed(() => {
    const resolved = toValue(input);
    const startDate = parseDate(resolved.startDate);
    const endDate = parseDate(resolved.endDate);

    if (!startDate || !endDate || endDate < startDate) {
      return { ...EMPTY, servicePeriodLabel: "0년 0개월 0일" };
    }

    const dayMs = 24 * 60 * 60 * 1000;
    const serviceDays = Math.floor((endDate.getTime() - startDate.getTime()) / dayMs) + 1;

    // 퇴직금 지급 요건: 계속근로 1년 이상 (근로기준법 제34조)
    if (serviceDays < 365) {
      return { ...EMPTY, serviceDays, servicePeriodLabel: formatPeriod(serviceDays) };
    }

    const serviceYears = Math.floor(serviceDays / 365); // serviceDays >= 365이므로 항상 >= 1

    // 평균임금: 최근 3개월 임금 + 상여 3/12를 실제 산정기간 총일수로 나눈다
    const threeMonthSalary = Math.max(0, resolved.monthlySalary) * 3;
    const threeMonthBonus = Math.max(0, resolved.annualBonus) * 0.25;
    const windowDays = averageWageWindowDays(endDate);
    const averageDailyWage = calcAverageDailyWage(threeMonthSalary + threeMonthBonus, windowDays);

    const severanceGross = Math.floor(averageDailyWage * 30 * (serviceDays / 365));

    // 퇴직소득세: 근속연수공제 → 환산급여 → 환산급여공제 → 세율 (소득세법 제48조),
    // 지방소득세 10% 분리 산출 -- laborCalculator와 동일 구현 공유
    const { incomeTax, localTax } = calculateSeveranceTaxParts(severanceGross, serviceYears);
    const retirementTax = incomeTax + localTax;

    return {
      serviceDays,
      serviceYears,
      servicePeriodLabel: formatPeriod(serviceDays),
      averageDailyWage,
      windowDays,
      severanceGross,
      retirementIncomeTax: incomeTax,
      retirementLocalTax: localTax,
      retirementTax,
      severanceNet: Math.max(0, severanceGross - retirementTax),
    };
  });
}
