import { computed, toValue, type MaybeRefOrGetter } from "vue";
import { UNEMPLOYMENT_2026, type DurationBucket, type QuitReason } from "@/data/unemploymentTable";

export type UnemploymentInput = {
  monthlySalary: number;
  age: number;
  insuranceYears: number;
  quitReason: QuitReason;
  quitDate: string;
};

// 5단계: 1년미만(0), 1~3년(1), 3~5년(3), 5~10년(5), 10년이상(10)
function durationBucket(years: number): DurationBucket {
  if (years >= 10) return 10;
  if (years >= 5) return 5;
  if (years >= 3) return 3;
  if (years >= 1) return 1;
  return 0;
}

function addDays(dateValue: string, days: number): string {
  if (!dateValue) return "-";
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "-";
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString("ko-KR");
}

// 실업급여(간이) 계산
export function useUnemploymentCalc(input: MaybeRefOrGetter<UnemploymentInput>) {
  return computed(() => {
    const resolved = toValue(input);

    const eligibleReasons: QuitReason[] = ["layoff", "dismissal", "contract_end"];
    const isEligible = eligibleReasons.includes(resolved.quitReason);

    const avgDailyWage = Math.floor(Math.max(0, resolved.monthlySalary) / 30);
    const rawDailyBenefit = Math.floor(avgDailyWage * UNEMPLOYMENT_2026.rate);

    const dailyBenefit = isEligible
      ? Math.max(
          UNEMPLOYMENT_2026.dailyMin,
          Math.min(UNEMPLOYMENT_2026.dailyMax, rawDailyBenefit)
        )
      : 0;

    const group = resolved.age >= 50 ? "over50" : "under50";
    const bucket = durationBucket(Math.max(0, Math.floor(resolved.insuranceYears)));
    const durationDays = isEligible
      ? UNEMPLOYMENT_2026.durationTable[group][bucket]
      : 0;

    const totalBenefit = dailyBenefit * durationDays;

    return {
      isEligible,
      avgDailyWage,
      dailyBenefit,
      durationDays,
      totalBenefit,
      endDateLabel: isEligible ? addDays(resolved.quitDate, durationDays) : "-",
    };
  });
}
