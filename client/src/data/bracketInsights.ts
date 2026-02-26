import { INCOME_TAX_BRACKETS } from "@/data/taxBrackets";
import { RATES_2026 } from "@/data/taxRates2026";
import { formatPercent, formatManWon, formatWon } from "@/lib/utils";
import type { SalaryCalcResult } from "@/composables/useSalaryCalc";

export type BracketInsight = {
  icon: string;
  text: string;
};

// 현재 과세표준이 속한 소득세 구간 찾기
function findBracketIndex(taxableBase: number): number {
  return INCOME_TAX_BRACKETS.findIndex((b) => taxableBase <= b.limit);
}

export function getBracketInsights(
  annualGross: number,
  calc: SalaryCalcResult
): BracketInsight[] {
  const insights: BracketInsight[] = [];
  const taxableBase = calc.taxableBase.value;
  const idx = findBracketIndex(taxableBase);
  if (idx < 0) return insights;

  const bracket = INCOME_TAX_BRACKETS[idx];

  // 1. 소득세 구간
  insights.push({
    icon: "📊",
    text: `과세표준 기준 소득세율 ${formatPercent(bracket.rate, 0)} 구간입니다.`,
  });

  // 2. 실수령 비율
  const effectiveRate = calc.effectiveTaxRate.value;
  const takeHome = 1 - effectiveRate;
  insights.push({
    icon: "💰",
    text: `실수령 비율 ${formatPercent(takeHome, 1)} — 세전 100만원 중 ${formatWon(Math.round(takeHome * 1_000_000))}을 가져갑니다.`,
  });

  // 3. 다음 구간까지 거리 (마지막 구간이 아니고, 3,000만원 이내일 때만)
  if (idx < INCOME_TAX_BRACKETS.length - 1) {
    const gap = bracket.limit - taxableBase;
    if (gap <= 30_000_000) {
      const nextRate = INCOME_TAX_BRACKETS[idx + 1].rate;
      insights.push({
        icon: "📈",
        text: `과세표준이 ${formatManWon(gap)} 더 늘면 ${formatPercent(nextRate, 0)} 구간으로 넘어갑니다.`,
      });
    }
  }

  // 4. 국민연금 상한 안내
  const maxPensionIncome = RATES_2026.nationalPension.maxMonthlyIncome;
  const taxableMonthly = calc.taxableMonthly.value;
  const pensionGap = maxPensionIncome - taxableMonthly;

  if (pensionGap <= 0) {
    insights.push({
      icon: "🔒",
      text: `국민연금 상한(월 ${formatWon(maxPensionIncome)})에 도달해 보험료가 더 이상 오르지 않습니다.`,
    });
  } else if (pensionGap <= 1_000_000) {
    insights.push({
      icon: "⚡",
      text: `과세 월급이 ${formatWon(pensionGap)} 더 오르면 국민연금 상한에 도달합니다.`,
    });
  }

  return insights.slice(0, 3);
}
