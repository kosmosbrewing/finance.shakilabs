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
              <th class="px-3 py-2.5 text-left font-semibold">항목</th>
              <th class="px-3 py-2.5 text-right font-semibold">근로자 요율</th>
              <th class="px-3 py-2.5 text-right font-semibold">근로자(월)</th>
              <th class="px-3 py-2.5 text-right font-semibold">사업주 요율</th>
              <th class="px-3 py-2.5 text-right font-semibold">사업주(월)</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-t border-border/40 even:bg-muted/10 hover:bg-primary/5 transition-colors">
              <td class="px-3 py-2.5 whitespace-nowrap">국민연금</td>
              <td class="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{{ formatPercent(RATES_2026.nationalPension.employee, 3) }}</td>
              <td class="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{{ formatWon(calc.nationalPension.value) }}</td>
              <td class="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{{ formatPercent(RATES_2026.nationalPension.employer, 3) }}</td>
              <td class="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{{ formatWon(calc.employerCost.value.nationalPension) }}</td>
            </tr>
            <tr class="border-t border-border/40 even:bg-muted/10 hover:bg-primary/5 transition-colors">
              <td class="px-3 py-2.5 whitespace-nowrap">건강보험</td>
              <td class="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{{ formatPercent(RATES_2026.healthInsurance.employee, 3) }}</td>
              <td class="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{{ formatWon(calc.healthInsurance.value) }}</td>
              <td class="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{{ formatPercent(RATES_2026.healthInsurance.employer, 3) }}</td>
              <td class="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{{ formatWon(calc.employerCost.value.healthInsurance) }}</td>
            </tr>
            <tr class="border-t border-border/40 even:bg-muted/10 hover:bg-primary/5 transition-colors">
              <td class="px-3 py-2.5 whitespace-nowrap">장기요양</td>
              <td class="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">건보의 {{ formatPercent(RATES_2026.longTermCare.rateOfHealth, 2) }}</td>
              <td class="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{{ formatWon(calc.longTermCare.value) }}</td>
              <td class="px-3 py-2.5 text-right tabular-nums">-</td>
              <td class="px-3 py-2.5 text-right tabular-nums">-</td>
            </tr>
            <tr class="border-t border-border/40 even:bg-muted/10 hover:bg-primary/5 transition-colors">
              <td class="px-3 py-2.5 whitespace-nowrap">고용보험</td>
              <td class="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{{ formatPercent(RATES_2026.employmentInsurance.employee, 2) }}</td>
              <td class="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{{ formatWon(calc.employmentInsurance.value) }}</td>
              <td class="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{{ formatPercent(RATES_2026.employmentInsurance.employer, 2) }}</td>
              <td class="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{{ formatWon(calc.employerCost.value.employmentInsurance) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="border-t-2 border-primary/20 bg-primary/5 font-semibold">
              <td class="px-3 py-2.5">합계</td>
              <td class="px-3 py-2.5 text-right">-</td>
              <td class="px-3 py-2.5 text-right tabular-nums">{{ formatWon(calc.totalInsurance.value) }}</td>
              <td class="px-3 py-2.5 text-right">-</td>
              <td class="px-3 py-2.5 text-right tabular-nums">{{ formatWon(calc.employerCost.value.total) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p class="text-caption text-muted-foreground">
        국민연금은 기준소득월액 상하한, 장기요양보험은 근로자 건강보험료 기준으로 계산합니다.
      </p>
    </div>
  </section>
</template>
