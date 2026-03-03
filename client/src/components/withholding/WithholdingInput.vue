<script setup lang="ts">
import { computed } from "vue";
import { formatNumber } from "@/lib/utils";

const props = defineProps<{
  monthlyIncomeTax: number;
  dependents: number;
  nonTaxableMonthly: number;
}>();

const emit = defineEmits<{
  "update:monthlyIncomeTax": [value: number];
  "update:dependents": [value: number];
  "update:nonTaxableMonthly": [value: number];
}>();

// 소득세 범위 제한 (최대 1,000만원)
const MAX_TAX = 10_000_000;

const formattedTax = computed(() => formatNumber(props.monthlyIncomeTax));

function onTaxInput(event: Event): void {
  const raw = (event.target as HTMLInputElement).value.replace(/[^0-9]/g, "");
  const value = parseInt(raw, 10);
  if (Number.isFinite(value)) {
    emit("update:monthlyIncomeTax", Math.max(0, Math.min(MAX_TAX, value)));
  }
}

// 비과세 천단위 콤마 포맷 (원 단위)
const formattedNonTaxable = computed(() => formatNumber(props.nonTaxableMonthly));

function onNonTaxableInput(event: Event): void {
  const raw = (event.target as HTMLInputElement).value.replace(/[^0-9]/g, "");
  const value = parseInt(raw, 10);
  if (Number.isFinite(value)) {
    emit("update:nonTaxableMonthly", Math.max(0, Math.min(5_000_000, value)));
  }
}

function updateDependents(value: number): void {
  const safe = Math.max(1, Math.min(20, Math.floor(value || 1)));
  emit("update:dependents", safe);
}

function onTaxRangeInput(event: Event): void {
  const value = parseInt((event.target as HTMLInputElement).value, 10);
  if (Number.isFinite(value)) {
    emit("update:monthlyIncomeTax", Math.max(0, Math.min(1_000_000, value)));
  }
}

const inputIds = {
  monthlyIncomeTax: "withholding-income-tax",
  monthlyIncomeTaxRange: "withholding-income-tax-range",
  dependents: "withholding-dependents",
  nonTaxable: "withholding-nontaxable",
} as const;
</script>

<template>
  <section class="retro-panel">
    <div class="retro-titlebar">
      <h2 class="retro-title">월 소득세 입력</h2>
    </div>

    <div class="retro-panel-content space-y-4">
      <div class="space-y-2">
        <label :for="inputIds.monthlyIncomeTax" class="block text-caption font-semibold text-foreground">
          월 소득세 (원)
        </label>
        <p class="text-caption text-muted-foreground">
          급여명세서의 <strong>소득세</strong> 항목만 입력하세요. 지방소득세(10%)는 별도 계산됩니다.
        </p>

        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="touch-target flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-lg font-bold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              aria-label="1만원 감소"
              @click="emit('update:monthlyIncomeTax', Math.max(0, monthlyIncomeTax - 10_000))"
            >
              −
            </button>
            <input
              :id="inputIds.monthlyIncomeTax"
              :value="formattedTax"
              type="text"
              inputmode="numeric"
              class="retro-input min-w-0 flex-1 text-center text-heading font-bold tabular-nums"
              @input="onTaxInput"
            />
            <button
              type="button"
              class="touch-target flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-lg font-bold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              aria-label="1만원 증가"
              @click="emit('update:monthlyIncomeTax', Math.min(MAX_TAX, monthlyIncomeTax + 10_000))"
            >
              +
            </button>
          </div>
          <input
            :id="inputIds.monthlyIncomeTaxRange"
            :value="monthlyIncomeTax"
            type="range"
            min="0"
            max="1000000"
            step="5000"
            class="retro-range"
            aria-label="소득세 슬라이더"
            @input="onTaxRangeInput"
          />
        </div>


      </div>

      <details class="retro-details">
        <summary class="retro-details-summary">
          <span>상세 설정 보기</span>
          <span class="retro-details-chevron" aria-hidden="true">▾</span>
        </summary>
        <div class="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2">
          <label class="space-y-1" :for="inputIds.dependents">
            <span class="text-caption text-muted-foreground">부양가족(본인 포함)</span>
            <input
              :id="inputIds.dependents"
              :value="dependents"
              type="number"
              inputmode="numeric"
              min="1"
              max="20"
              class="retro-input"
              @input="updateDependents(parseInt(($event.target as HTMLInputElement).value, 10))"
            />
          </label>
          <label class="space-y-1" :for="inputIds.nonTaxable">
            <span class="text-caption text-muted-foreground">비과세(원/월)</span>
            <input
              :id="inputIds.nonTaxable"
              :value="formattedNonTaxable"
              type="text"
              inputmode="numeric"
              class="retro-input"
              @input="onNonTaxableInput"
            />
          </label>
        </div>
      </details>
    </div>
  </section>
</template>
