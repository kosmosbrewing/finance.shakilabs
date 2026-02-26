<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { SALARY_TABLE_PRESETS } from "@/data/insurancePresets";
import { calculateSalaryBreakdown } from "@/utils/calculator";
import { formatManWon, formatPercent, formatWon } from "@/lib/utils";

const rows = computed(() =>
  SALARY_TABLE_PRESETS.map((annualSalary) => {
    const breakdown = calculateSalaryBreakdown({
      grossAnnual: annualSalary,
      dependents: 1,
      children: 0,
      nonTaxableMonthly: 200_000,
      retirementIncluded: false,
    });

    return {
      annualSalary,
      manWon: Math.round(annualSalary / 10_000),
      ...breakdown,
    };
  })
);
</script>

<template>
  <section class="retro-panel">
    <div class="retro-titlebar">
      <h2 class="retro-title">2026 연봉별 건보료·4대보험·실수령 표</h2>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-caption border-collapse">
        <thead>
          <tr class="border-b-2 border-primary/20 bg-muted/40">
            <th class="px-3 py-2.5 text-left font-semibold">연봉</th>
            <th class="px-3 py-2.5 text-right font-semibold">월 건보료</th>
            <th class="px-3 py-2.5 text-right font-semibold">4대보험</th>
            <th class="px-3 py-2.5 text-right font-semibold">소득세</th>
            <th class="px-3 py-2.5 text-right font-semibold">월 실수령</th>
            <th class="px-3 py-2.5 text-right font-semibold">실수령률</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows"
            :key="row.annualSalary"
            class="border-t border-border/40 even:bg-muted/10 hover:bg-primary/5 transition-colors"
          >
            <td class="px-3 py-2.5">
              <RouterLink :to="`/salary/${row.manWon}`" class="font-semibold text-primary hover:underline whitespace-nowrap">
                {{ formatManWon(row.annualSalary) }}
              </RouterLink>
            </td>
            <td class="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{{ formatWon(row.healthInsurance) }}</td>
            <td class="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{{ formatWon(row.totalInsurance) }}</td>
            <td class="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{{ formatWon(row.totalTax) }}</td>
            <td class="px-3 py-2.5 text-right tabular-nums font-semibold whitespace-nowrap">{{ formatWon(row.monthlyNet) }}</td>
            <td class="px-3 py-2.5 text-right tabular-nums">{{ formatPercent(row.monthlyNet / row.monthlyGross, 1) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="border-t border-border/60 px-4 py-3 text-caption text-muted-foreground">
      부양가족 1명, 비과세 20만원, 퇴직금 별도 기준의 참고값입니다.
    </div>
  </section>
</template>
