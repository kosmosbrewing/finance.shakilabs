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
      <span class="retro-kbd">INSURANCE</span>
    </div>

    <div class="retro-panel-content space-y-3">
      <div class="overflow-x-auto rounded-xl border border-border/70">
        <table class="w-full min-w-[760px] text-body">
          <thead class="sticky top-0 z-10 bg-muted/70 text-foreground backdrop-blur">
            <tr>
              <th class="px-3 py-2.5 text-left">항목</th>
              <th class="px-3 py-2.5 text-right">근로자 요율</th>
              <th class="px-3 py-2.5 text-right">근로자 금액(월)</th>
              <th class="px-3 py-2.5 text-right">사업주 요율</th>
              <th class="px-3 py-2.5 text-right">사업주 금액(월)</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-t border-border/60">
              <td class="px-3 py-2.5">국민연금</td>
              <td class="px-3 py-2.5 text-right tabular-nums">{{ formatPercent(RATES_2026.nationalPension.employee, 3) }}</td>
              <td class="px-3 py-2.5 text-right tabular-nums">{{ formatWon(calc.nationalPension.value) }}</td>
              <td class="px-3 py-2.5 text-right tabular-nums">{{ formatPercent(RATES_2026.nationalPension.employer, 3) }}</td>
              <td class="px-3 py-2.5 text-right tabular-nums">{{ formatWon(calc.employerCost.value.nationalPension) }}</td>
            </tr>
            <tr class="border-t border-border/60">
              <td class="px-3 py-2.5">건강보험</td>
              <td class="px-3 py-2.5 text-right tabular-nums">{{ formatPercent(RATES_2026.healthInsurance.employee, 3) }}</td>
              <td class="px-3 py-2.5 text-right tabular-nums">{{ formatWon(calc.healthInsurance.value) }}</td>
              <td class="px-3 py-2.5 text-right tabular-nums">{{ formatPercent(RATES_2026.healthInsurance.employer, 3) }}</td>
              <td class="px-3 py-2.5 text-right tabular-nums">{{ formatWon(calc.employerCost.value.healthInsurance) }}</td>
            </tr>
            <tr class="border-t border-border/60">
              <td class="px-3 py-2.5">장기요양보험</td>
              <td class="px-3 py-2.5 text-right tabular-nums">건보의 {{ formatPercent(RATES_2026.longTermCare.rateOfHealth, 2) }}</td>
              <td class="px-3 py-2.5 text-right tabular-nums">{{ formatWon(calc.longTermCare.value) }}</td>
              <td class="px-3 py-2.5 text-right tabular-nums">-</td>
              <td class="px-3 py-2.5 text-right tabular-nums">-</td>
            </tr>
            <tr class="border-t border-border/60">
              <td class="px-3 py-2.5">고용보험</td>
              <td class="px-3 py-2.5 text-right tabular-nums">{{ formatPercent(RATES_2026.employmentInsurance.employee, 2) }}</td>
              <td class="px-3 py-2.5 text-right tabular-nums">{{ formatWon(calc.employmentInsurance.value) }}</td>
              <td class="px-3 py-2.5 text-right tabular-nums">{{ formatPercent(RATES_2026.employmentInsurance.employer, 2) }}</td>
              <td class="px-3 py-2.5 text-right tabular-nums">{{ formatWon(calc.employerCost.value.employmentInsurance) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="border-t border-border font-semibold">
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
