<script setup lang="ts">
import { computed } from "vue";
import { ShSlider } from "@shakilabs/ui";
import { formatNumber } from "@/lib/utils";

const props = defineProps<{
  monthlyIncomeTax: number;
  dependents: number;
  childrenUnder20: number;
  nonTaxableMonthly: number;
}>();

const emit = defineEmits<{
  "update:monthlyIncomeTax": [value: number];
  "update:dependents": [value: number];
  "update:childrenUnder20": [value: number];
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
  const maxChildren = Math.max(0, safe - 1);
  if (props.childrenUnder20 > maxChildren) {
    emit("update:childrenUnder20", maxChildren);
  }
}

function updateChildren(value: number): void {
  const maxChildren = Math.max(0, props.dependents - 1);
  emit("update:childrenUnder20", Math.max(0, Math.min(maxChildren, Math.floor(value || 0))));
}

const taxPresets = [
  { label: "5만", value: 50_000 },
  { label: "10만", value: 100_000 },
  { label: "20만", value: 200_000 },
  { label: "50만", value: 500_000 },
  { label: "100만", value: 1_000_000 },
];

const inputIds = {
  monthlyIncomeTax: "withholding-income-tax",
  monthlyIncomeTaxRange: "withholding-income-tax-range",
  dependents: "withholding-dependents",
  children: "withholding-children",
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
          <ShSlider
            :id="inputIds.monthlyIncomeTaxRange"
            :model-value="monthlyIncomeTax"
            :min="0"
            :max="MAX_TAX"
            :step="5_000"
            :value-text="`월 소득세 ${formattedTax}원`"
            aria-label="소득세 슬라이더"
            @update:model-value="emit('update:monthlyIncomeTax', $event)"
          />
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="preset in taxPresets"
              :key="preset.value"
              type="button"
              class="retro-chip"
              :class="monthlyIncomeTax === preset.value ? 'border-primary text-primary' : ''"
              :aria-label="`소득세 ${preset.label}원으로 설정`"
              @click="emit('update:monthlyIncomeTax', preset.value)"
            >
              {{ preset.label }}
            </button>
          </div>
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
          <label class="space-y-1" :for="inputIds.children">
            <span class="text-caption text-muted-foreground">8~20세 자녀 수</span>
            <input
              :id="inputIds.children"
              :value="childrenUnder20"
              type="number"
              inputmode="numeric"
              min="0"
              max="20"
              class="retro-input"
              @input="updateChildren(parseInt(($event.target as HTMLInputElement).value, 10))"
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
