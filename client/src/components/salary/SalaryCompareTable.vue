<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { SALARY_PRESETS } from "@/data/salaryPresets";
import { calculateSalaryBreakdown } from "@/utils/calculator";
import { formatManWon, formatPercent, formatWon } from "@/lib/utils";

const rows = computed(() =>
  SALARY_PRESETS.map((annualSalary) => {
    const calc = calculateSalaryBreakdown({
      grossAnnual: annualSalary,
      nonTaxableMonthly: 200_000,
      dependents: 1,
      children: 0,
      retirementIncluded: false,
    });

    return {
      annualSalary,
      manWon: Math.round(annualSalary / 10_000),
      monthlyGross: calc.monthlyGross,
      monthlyNet: calc.monthlyNet,
      totalInsurance: calc.totalInsurance,
      totalTax: calc.totalTax,
      effectiveRate: calc.effectiveTaxRate,
    };
  })
);
</script>

<template>
  <section class="retro-panel overflow-hidden">
    <div class="retro-titlebar">
      <h2 class="retro-title">연봉별 실수령액 비교표</h2>
      <span class="retro-kbd">TABLE</span>
    </div>

    <p class="scroll-hint">표를 좌우로 스크롤하세요 →</p>
    <div class="overflow-x-auto">
      <table class="min-w-[920px] w-full text-body">
        <thead class="sticky top-0 z-10 bg-muted/70 text-foreground backdrop-blur">
          <tr>
            <th class="px-3 py-2.5 text-left">연봉</th>
            <th class="px-3 py-2.5 text-right">월급(세전)</th>
            <th class="px-3 py-2.5 text-right">4대보험계</th>
            <th class="px-3 py-2.5 text-right">소득세계</th>
            <th class="px-3 py-2.5 text-right">월 실수령</th>
            <th class="px-3 py-2.5 text-right">실수령률</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.annualSalary" class="border-t border-border/60 even:bg-muted/20">
              <td class="px-3 py-2.5">
              <RouterLink :to="`/salary/${row.manWon}`" class="font-semibold text-primary hover:underline">
                {{ formatManWon(row.annualSalary) }}
              </RouterLink>
            </td>
            <td class="px-3 py-2.5 text-right tabular-nums">{{ formatWon(row.monthlyGross) }}</td>
            <td class="px-3 py-2.5 text-right tabular-nums">{{ formatWon(row.totalInsurance) }}</td>
            <td class="px-3 py-2.5 text-right tabular-nums">{{ formatWon(row.totalTax) }}</td>
            <td class="px-3 py-2.5 text-right tabular-nums font-semibold">{{ formatWon(row.monthlyNet) }}</td>
            <td class="px-3 py-2.5 text-right tabular-nums">{{ formatPercent(1 - row.effectiveRate, 1) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="border-t border-border/60 px-4 py-3 text-caption text-muted-foreground">
      부양가족 1명, 비과세 20만원, 퇴직금 별도 기준의 비교값입니다.
    </div>
  </section>
</template>
