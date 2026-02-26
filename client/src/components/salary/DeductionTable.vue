<script setup lang="ts">
import { formatWon, formatPercent } from "@/lib/utils";
import {
  NATIONAL_PENSION,
  HEALTH_INSURANCE,
  LONG_TERM_CARE,
  EMPLOYMENT_INSURANCE,
  LOCAL_INCOME_TAX_RATE,
} from "@/lib/tax-constants";
import type { SalaryCalcResult } from "@/composables/useSalaryCalc";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

defineProps<{
  calc: SalaryCalcResult;
}>();
</script>

<template>
  <section class="retro-panel overflow-hidden">
    <div class="retro-titlebar">
      <h2 class="retro-title">공제 내역 상세</h2>
      <span class="retro-kbd">DETAIL</span>
    </div>
    <div class="retro-panel-content">
      <Accordion type="multiple" :default-value="['insurance', 'tax']">
        <!-- 4대보험 -->
        <AccordionItem value="insurance">
          <AccordionTrigger class="text-caption">
            <div class="flex items-center gap-2">
              <span>4대보험</span>
              <span class="text-caption text-muted-foreground font-normal">
                월 {{ formatWon(calc.totalInsurance.value) }}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div class="retro-board-list">
              <div class="retro-board-item">
                <div>
                  <span>국민연금</span>
                  <span class="text-caption text-muted-foreground ml-1.5">{{ formatPercent(NATIONAL_PENSION.employeeRate) }}</span>
                </div>
                <span class="font-semibold tabular-nums">{{ formatWon(calc.nationalPension.value) }}</span>
              </div>
              <div class="retro-board-item">
                <div>
                  <span>건강보험</span>
                  <span class="text-caption text-muted-foreground ml-1.5">{{ formatPercent(HEALTH_INSURANCE.employeeRate) }}</span>
                </div>
                <span class="font-semibold tabular-nums">{{ formatWon(calc.healthInsurance.value) }}</span>
              </div>
              <div class="retro-board-item">
                <div>
                  <span>장기요양보험</span>
                  <span class="text-caption text-muted-foreground ml-1.5">건보의 {{ formatPercent(LONG_TERM_CARE.rateOfHealth) }}</span>
                </div>
                <span class="font-semibold tabular-nums">{{ formatWon(calc.longTermCare.value) }}</span>
              </div>
              <div class="retro-board-item">
                <div>
                  <span>고용보험</span>
                  <span class="text-caption text-muted-foreground ml-1.5">{{ formatPercent(EMPLOYMENT_INSURANCE.employeeRate) }}</span>
                </div>
                <span class="font-semibold tabular-nums">{{ formatWon(calc.employmentInsurance.value) }}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <!-- 세금 -->
        <AccordionItem value="tax">
          <AccordionTrigger class="text-caption">
            <div class="flex items-center gap-2">
              <span>세금</span>
              <span class="text-caption text-muted-foreground font-normal">
                월 {{ formatWon(calc.totalTax.value) }}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div class="retro-board-list">
              <div class="retro-board-item">
                <span>소득세</span>
                <span class="font-semibold tabular-nums">{{ formatWon(calc.monthlyIncomeTax.value) }}</span>
              </div>
              <div class="retro-board-item">
                <div>
                  <span>지방소득세</span>
                  <span class="text-caption text-muted-foreground ml-1.5">소득세의 {{ formatPercent(LOCAL_INCOME_TAX_RATE, 0) }}</span>
                </div>
                <span class="font-semibold tabular-nums">{{ formatWon(calc.monthlyLocalTax.value) }}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <!-- 산출 과정 -->
        <AccordionItem value="breakdown">
          <AccordionTrigger class="text-caption">
            <span>세금 산출 과정</span>
          </AccordionTrigger>
          <AccordionContent>
            <!-- 과세표준 산출 -->
            <p class="text-caption font-semibold text-muted-foreground uppercase tracking-wide mb-1">과세표준 산출</p>
            <div class="retro-board-list mb-3">
              <div class="retro-board-item">
                <span>과세대상 총급여 (연)</span>
                <span class="font-semibold tabular-nums">{{ formatWon(calc.annualTaxableIncome.value) }}</span>
              </div>
              <div class="retro-board-item pl-6 sm:pl-8">
                <span class="text-muted-foreground">(-) 근로소득공제</span>
                <span class="font-semibold tabular-nums text-primary">{{ formatWon(calc.earnedIncomeDeduction.value) }}</span>
              </div>
              <div class="retro-board-item pl-6 sm:pl-8">
                <span class="text-muted-foreground">(-) 인적공제 ({{ calc.dependents.value }}인)</span>
                <span class="font-semibold tabular-nums text-primary">{{ formatWon(calc.personalDeduction.value) }}</span>
              </div>
              <div class="retro-board-item pl-6 sm:pl-8">
                <span class="text-muted-foreground">(-) 보험료공제 (연)</span>
                <span class="font-semibold tabular-nums text-primary">{{ formatWon(calc.annualInsuranceDeduction.value) }}</span>
              </div>
              <div class="retro-board-item bg-muted/50">
                <span class="font-bold">= 과세표준</span>
                <span class="font-bold tabular-nums">{{ formatWon(calc.taxableBase.value) }}</span>
              </div>
            </div>

            <!-- 세액 산출 -->
            <p class="text-caption font-semibold text-muted-foreground uppercase tracking-wide mb-1">세액 산출</p>
            <div class="retro-board-list">
              <div class="retro-board-item">
                <span>산출세액</span>
                <span class="font-semibold tabular-nums">{{ formatWon(calc.calculatedTax.value) }}</span>
              </div>
              <div class="retro-board-item pl-6 sm:pl-8">
                <span class="text-muted-foreground">(-) 근로소득세액공제</span>
                <span class="font-semibold tabular-nums text-primary">{{ formatWon(calc.taxCredit.value) }}</span>
              </div>
              <div class="retro-board-item pl-6 sm:pl-8">
                <span class="text-muted-foreground">(-) 표준세액공제</span>
                <span class="font-semibold tabular-nums text-primary">{{ formatWon(calc.standardTaxCredit.value) }}</span>
              </div>
              <div v-if="calc.childTaxCredit.value > 0" class="retro-board-item pl-6 sm:pl-8">
                <span class="text-muted-foreground">(-) 자녀세액공제</span>
                <span class="font-semibold tabular-nums text-primary">{{ formatWon(calc.childTaxCredit.value) }}</span>
              </div>
              <div class="retro-board-item bg-muted/50">
                <span class="font-bold">= 결정세액 (연)</span>
                <span class="font-bold tabular-nums">{{ formatWon(calc.determinedTax.value) }}</span>
              </div>
              <div class="retro-board-item">
                <span>지방소득세 (연)</span>
                <span class="font-semibold tabular-nums">{{ formatWon(calc.annualLocalTax.value) }}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  </section>
</template>
