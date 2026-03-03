<script setup lang="ts">
import type { SalaryCalcResult } from "@/composables/useSalaryCalc";
import { formatPercent, formatWon } from "@/lib/utils";
import { RATES_2026 } from "@/data/taxRates2026";

defineProps<{
  calc: SalaryCalcResult;
}>();
</script>

<template>
  <section class="retro-panel overflow-hidden">
    <div class="retro-titlebar">
      <h2 class="retro-title">4대보험 상세 (근로자/사업주)</h2>
    </div>

    <div class="retro-panel-content space-y-3">
      <div class="overflow-x-auto">
        <table class="w-full text-caption border-collapse">
          <thead>
            <tr class="border-b-2 border-primary/20 bg-muted/40">
              <th class="px-2 py-2 text-left font-semibold md:px-3 md:py-2.5">항목</th>
              <th class="hidden px-3 py-2.5 text-right font-semibold md:table-cell">근로자 요율</th>
              <th class="px-2 py-2 text-right font-semibold md:px-3 md:py-2.5">근로자(월)</th>
              <th class="hidden px-3 py-2.5 text-right font-semibold md:table-cell">사업주 요율</th>
              <th class="px-2 py-2 text-right font-semibold md:px-3 md:py-2.5">사업주(월)</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-t border-border/40 even:bg-muted/10 hover:bg-primary/5 transition-colors">
              <td class="px-2 py-2 whitespace-nowrap md:px-3 md:py-2.5">국민연금</td>
              <td class="hidden px-3 py-2.5 text-right tabular-nums whitespace-nowrap md:table-cell">{{ formatPercent(RATES_2026.nationalPension.employee, 3) }}</td>
              <td class="px-2 py-2 text-right tabular-nums whitespace-nowrap md:px-3 md:py-2.5">{{ formatWon(calc.nationalPension.value) }}</td>
              <td class="hidden px-3 py-2.5 text-right tabular-nums whitespace-nowrap md:table-cell">{{ formatPercent(RATES_2026.nationalPension.employer, 3) }}</td>
              <td class="px-2 py-2 text-right tabular-nums whitespace-nowrap md:px-3 md:py-2.5">{{ formatWon(calc.employerCost.value.nationalPension) }}</td>
            </tr>
            <tr class="border-t border-border/40 even:bg-muted/10 hover:bg-primary/5 transition-colors">
              <td class="px-2 py-2 whitespace-nowrap md:px-3 md:py-2.5">건강보험</td>
              <td class="hidden px-3 py-2.5 text-right tabular-nums whitespace-nowrap md:table-cell">{{ formatPercent(RATES_2026.healthInsurance.employee, 3) }}</td>
              <td class="px-2 py-2 text-right tabular-nums whitespace-nowrap md:px-3 md:py-2.5">{{ formatWon(calc.healthInsurance.value) }}</td>
              <td class="hidden px-3 py-2.5 text-right tabular-nums whitespace-nowrap md:table-cell">{{ formatPercent(RATES_2026.healthInsurance.employer, 3) }}</td>
              <td class="px-2 py-2 text-right tabular-nums whitespace-nowrap md:px-3 md:py-2.5">{{ formatWon(calc.employerCost.value.healthInsurance) }}</td>
            </tr>
            <tr class="border-t border-border/40 even:bg-muted/10 hover:bg-primary/5 transition-colors">
              <td class="px-2 py-2 whitespace-nowrap md:px-3 md:py-2.5">장기요양</td>
              <td class="hidden px-3 py-2.5 text-right tabular-nums whitespace-nowrap md:table-cell">건보의 {{ formatPercent(RATES_2026.longTermCare.rateOfHealth, 2) }}</td>
              <td class="px-2 py-2 text-right tabular-nums whitespace-nowrap md:px-3 md:py-2.5">{{ formatWon(calc.longTermCare.value) }}</td>
              <td class="hidden px-3 py-2.5 text-right tabular-nums md:table-cell">-</td>
              <td class="px-2 py-2 text-right tabular-nums md:px-3 md:py-2.5">-</td>
            </tr>
            <tr class="border-t border-border/40 even:bg-muted/10 hover:bg-primary/5 transition-colors">
              <td class="px-2 py-2 whitespace-nowrap md:px-3 md:py-2.5">고용보험</td>
              <td class="hidden px-3 py-2.5 text-right tabular-nums whitespace-nowrap md:table-cell">{{ formatPercent(RATES_2026.employmentInsurance.employee, 2) }}</td>
              <td class="px-2 py-2 text-right tabular-nums whitespace-nowrap md:px-3 md:py-2.5">{{ formatWon(calc.employmentInsurance.value) }}</td>
              <td class="hidden px-3 py-2.5 text-right tabular-nums whitespace-nowrap md:table-cell">{{ formatPercent(RATES_2026.employmentInsurance.employer, 2) }}</td>
              <td class="px-2 py-2 text-right tabular-nums whitespace-nowrap md:px-3 md:py-2.5">{{ formatWon(calc.employerCost.value.employmentInsurance) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="border-t-2 border-primary/20 bg-primary/5 font-semibold">
              <td class="px-2 py-2 md:px-3 md:py-2.5">합계</td>
              <td class="hidden px-3 py-2.5 text-right md:table-cell">-</td>
              <td class="px-2 py-2 text-right tabular-nums md:px-3 md:py-2.5">{{ formatWon(calc.totalInsurance.value) }}</td>
              <td class="hidden px-3 py-2.5 text-right md:table-cell">-</td>
              <td class="px-2 py-2 text-right tabular-nums md:px-3 md:py-2.5">{{ formatWon(calc.employerCost.value.total) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <details class="retro-details md:hidden">
        <summary class="retro-details-summary">
          <span>요율 보기</span>
          <span class="retro-details-chevron" aria-hidden="true">▾</span>
        </summary>
        <ul class="space-y-1.5 p-3 text-tiny text-muted-foreground">
          <li class="flex items-center justify-between gap-2">
            <span>국민연금</span>
            <span class="tabular-nums">
              근로자 {{ formatPercent(RATES_2026.nationalPension.employee, 3) }} / 사업주 {{ formatPercent(RATES_2026.nationalPension.employer, 3) }}
            </span>
          </li>
          <li class="flex items-center justify-between gap-2">
            <span>건강보험</span>
            <span class="tabular-nums">
              근로자 {{ formatPercent(RATES_2026.healthInsurance.employee, 3) }} / 사업주 {{ formatPercent(RATES_2026.healthInsurance.employer, 3) }}
            </span>
          </li>
          <li class="flex items-center justify-between gap-2">
            <span>장기요양</span>
            <span class="tabular-nums">건강보험의 {{ formatPercent(RATES_2026.longTermCare.rateOfHealth, 2) }}</span>
          </li>
          <li class="flex items-center justify-between gap-2">
            <span>고용보험</span>
            <span class="tabular-nums">
              근로자 {{ formatPercent(RATES_2026.employmentInsurance.employee, 2) }} / 사업주 {{ formatPercent(RATES_2026.employmentInsurance.employer, 2) }}
            </span>
          </li>
        </ul>
      </details>

      <p class="text-caption text-muted-foreground">
        국민연금은 기준소득월액 상하한, 장기요양보험은 근로자 건강보험료 기준으로 계산합니다.
      </p>
    </div>
  </section>
</template>
