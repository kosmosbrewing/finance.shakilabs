<script setup lang="ts">
import { computed } from "vue";
import { formatNumber } from "@/lib/utils";

const props = defineProps<{
  mode: "reverse" | "forward";
  healthInsuranceFee: number;
  annualGross: number;
  dependents: number;
  childrenUnder20: number;
  nonTaxableMonthly: number;
  retirementIncluded?: boolean;
}>();

const emit = defineEmits<{
  "update:healthInsuranceFee": [value: number];
  "update:annualGross": [value: number];
  "update:dependents": [value: number];
  "update:childrenUnder20": [value: number];
  "update:nonTaxableMonthly": [value: number];
  "update:retirementIncluded": [value: boolean];
}>();

// 천단위 콤마 포맷 (건보료, 원 단위)
const formattedHealthFee = computed(() =>
  formatNumber(props.healthInsuranceFee)
);

function onHealthFeeInput(event: Event): void {
  const raw = (event.target as HTMLInputElement).value.replace(/[^0-9]/g, "");
  const value = parseInt(raw, 10);
  if (Number.isFinite(value)) {
    emit("update:healthInsuranceFee", Math.max(0, Math.min(5_000_000, value)));
  }
}

// 연봉 천단위 콤마 포맷 (원 단위)
const formattedGross = computed(() => formatNumber(props.annualGross));

function onGrossInput(event: Event): void {
  const raw = (event.target as HTMLInputElement).value.replace(/[^0-9]/g, "");
  const value = parseInt(raw, 10);
  if (Number.isFinite(value)) {
    emit("update:annualGross", Math.max(10_000_000, Math.min(3_000_000_000, value)));
  }
}

function onGrossRangeInput(event: Event): void {
  const value = parseInt((event.target as HTMLInputElement).value, 10);
  if (Number.isFinite(value)) {
    emit("update:annualGross", value);
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
  const safe = Math.max(0, Math.min(maxChildren, Math.floor(value || 0)));
  emit("update:childrenUnder20", safe);
}

const inputIds = {
  reverseHealthInsurance: "insurance-health-fee",
  reverseHealthInsuranceRange: "insurance-health-fee-range",
  forwardAnnualGross: "insurance-annual-gross",
  forwardAnnualGrossRange: "insurance-annual-gross-range",
  dependents: "insurance-dependents",
  children: "insurance-children",
  nonTaxableMonthly: "insurance-nontaxable-monthly",
} as const;

function onHealthFeeRangeInput(event: Event): void {
  const value = parseInt((event.target as HTMLInputElement).value, 10);
  if (Number.isFinite(value)) {
    emit("update:healthInsuranceFee", Math.max(0, Math.min(500_000, value)));
  }
}

function updateRetirementIncluded(value: boolean): void {
  emit("update:retirementIncluded", value);
}

</script>

<template>
  <section class="retro-panel">
    <div class="retro-titlebar">
      <h2 class="retro-title">{{ mode === "reverse" ? "건강보험료 입력" : "연봉 입력" }}</h2>
    </div>

    <div class="retro-panel-content space-y-4">
      <Transition name="slide-fade" mode="out-in">
        <!-- 건보료 → 연봉 추정 모드 -->
        <div v-if="mode === 'reverse'" key="reverse" class="space-y-3">
        <label :for="inputIds.reverseHealthInsurance" class="mb-0.5 block text-caption font-semibold text-foreground">
          월 건강보험료 (원)
        </label>
        <p class="text-caption text-muted-foreground">
          급여명세서의 <strong>건강보험(근로자 부담분)</strong>만 입력하세요.
        </p>
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="touch-target flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-lg font-bold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              aria-label="1만원 감소"
              @click="emit('update:healthInsuranceFee', Math.max(0, healthInsuranceFee - 10_000))"
            >
              −
            </button>
            <input
              :id="inputIds.reverseHealthInsurance"
              :value="formattedHealthFee"
              type="text"
              inputmode="numeric"
              class="retro-input min-w-0 flex-1 text-center text-heading font-bold tabular-nums"
              @input="onHealthFeeInput"
            />
            <button
              type="button"
              class="touch-target flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-lg font-bold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              aria-label="1만원 증가"
              @click="emit('update:healthInsuranceFee', Math.min(5_000_000, healthInsuranceFee + 10_000))"
            >
              +
            </button>
          </div>
          <input
            :id="inputIds.reverseHealthInsuranceRange"
            :value="healthInsuranceFee"
            type="range"
            min="0"
            max="500000"
            step="1000"
            class="retro-range"
            aria-label="건보료 슬라이더"
            @input="onHealthFeeRangeInput"
          />
        </div>
      </div>

        <!-- 연봉 → 건보료 계산 모드 -->
        <div v-else key="forward" class="space-y-3">
        <label :for="inputIds.forwardAnnualGross" class="mb-0.5 block text-caption font-semibold text-foreground">
          연봉 (원)
        </label>
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="touch-target flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-lg font-bold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              aria-label="100만원 감소"
              @click="emit('update:annualGross', Math.max(10_000_000, annualGross - 1_000_000))"
            >
              −
            </button>
            <input
              :id="inputIds.forwardAnnualGross"
              :value="formattedGross"
              type="text"
              inputmode="numeric"
              class="retro-input min-w-0 flex-1 text-center text-heading font-bold tabular-nums"
              @input="onGrossInput"
            />
            <button
              type="button"
              class="touch-target flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-lg font-bold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              aria-label="100만원 증가"
              @click="emit('update:annualGross', Math.min(200_000_000, annualGross + 1_000_000))"
            >
              +
            </button>
          </div>
          <input
            :id="inputIds.forwardAnnualGrossRange"
            :value="annualGross"
            type="range"
            min="10000000"
            max="200000000"
            step="1000000"
            class="retro-range"
            aria-label="연봉 슬라이더"
            @input="onGrossRangeInput"
          />
        </div>

        <div>
          <span class="mb-0.5 block text-caption font-semibold text-foreground">퇴직금 포함 여부</span>
          <div class="flex gap-2.5">
            <button
              type="button"
              class="touch-target rounded-xl border px-3 py-1.5 text-caption font-semibold transition-colors"
              :class="!props.retirementIncluded ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:text-foreground'"
              @click="updateRetirementIncluded(false)"
            >
              퇴직금 별도
            </button>
            <button
              type="button"
              class="touch-target rounded-xl border px-3 py-1.5 text-caption font-semibold transition-colors"
              :class="props.retirementIncluded ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:text-foreground'"
              @click="updateRetirementIncluded(true)"
            >
              퇴직금 포함
            </button>
          </div>
        </div>
        </div>
      </Transition>

      <details class="retro-details">
        <summary class="retro-details-summary">
          <span>상세 설정 보기</span>
          <span class="retro-details-chevron" aria-hidden="true">▾</span>
        </summary>
        <div class="grid grid-cols-1 gap-3 p-3 sm:grid-cols-3">
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
            <span class="text-caption text-muted-foreground">8~20세 자녀</span>
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
          <label class="space-y-1" :for="inputIds.nonTaxableMonthly">
            <span class="text-caption text-muted-foreground">비과세(원/월)</span>
            <input
              :id="inputIds.nonTaxableMonthly"
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
