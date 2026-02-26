<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  mode: "reverse" | "forward";
  healthInsuranceFee: number;
  annualGross: number;
  dependents: number;
  childrenUnder20: number;
  nonTaxableMonthly: number;
  presets: readonly number[];
}>();

const emit = defineEmits<{
  "update:mode": [value: "reverse" | "forward"];
  "update:healthInsuranceFee": [value: number];
  "update:annualGross": [value: number];
  "update:dependents": [value: number];
  "update:childrenUnder20": [value: number];
  "update:nonTaxableMonthly": [value: number];
}>();

// 천단위 콤마 포맷 (건보료, 원 단위)
const formattedHealthFee = computed(() =>
  props.healthInsuranceFee.toLocaleString("ko-KR")
);

function onHealthFeeInput(event: Event): void {
  const raw = (event.target as HTMLInputElement).value.replace(/[^0-9]/g, "");
  const value = parseInt(raw, 10);
  if (Number.isFinite(value)) {
    emit("update:healthInsuranceFee", Math.max(0, Math.min(5_000_000, value)));
  }
}

// 증감 버튼 (건보료)
const HEALTH_STEPS = [
  { label: "-5만", delta: -50_000 },
  { label: "-2만", delta: -20_000 },
  { label: "-1만", delta: -10_000 },
  { label: "+1만", delta: 10_000 },
  { label: "+2만", delta: 20_000 },
  { label: "+5만", delta: 50_000 },
] as const;

function adjustHealthFee(delta: number): void {
  const next = Math.max(0, Math.min(5_000_000, props.healthInsuranceFee + delta));
  emit("update:healthInsuranceFee", next);
}

// 천단위 콤마 포맷 (연봉, 만원 단위)
const annualGrossManWon = computed(() =>
  Math.floor(props.annualGross / 10_000)
);

const formattedGrossManWon = computed(() =>
  annualGrossManWon.value.toLocaleString("ko-KR")
);

function onGrossInput(event: Event): void {
  const raw = (event.target as HTMLInputElement).value.replace(/[^0-9]/g, "");
  const value = parseInt(raw, 10);
  if (Number.isFinite(value)) {
    const safe = Math.max(0, Math.min(1_000_000, value));
    emit("update:annualGross", safe * 10_000);
  }
}

// 증감 버튼 (연봉 만원 단위)
const GROSS_STEPS = [
  { label: "-500만", delta: -500 },
  { label: "-100만", delta: -100 },
  { label: "+100만", delta: 100 },
  { label: "+500만", delta: 500 },
] as const;

function adjustGross(delta: number): void {
  const next = Math.max(0, Math.min(1_000_000, annualGrossManWon.value + delta));
  emit("update:annualGross", next * 10_000);
}

// 비과세
const nonTaxableManWon = computed({
  get: () => Math.floor(props.nonTaxableMonthly / 10_000),
  set: (value: number) => {
    const safe = Math.max(0, Math.min(500, Math.floor(value || 0)));
    emit("update:nonTaxableMonthly", safe * 10_000);
  },
});

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
  forwardAnnualGross: "insurance-annual-gross",
  dependents: "insurance-dependents",
  children: "insurance-children",
  nonTaxableMonthly: "insurance-nontaxable-monthly",
} as const;
</script>

<template>
  <section class="retro-panel">
    <div class="retro-titlebar">
      <h2 class="retro-title">건보료/연봉 입력</h2>
    </div>

    <div class="retro-panel-content space-y-4">
      <div class="flex gap-2">
        <button
          type="button"
          class="touch-target rounded border px-3 py-1.5 text-caption font-semibold transition-colors"
          :class="mode === 'reverse' ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:text-foreground'"
          @click="emit('update:mode', 'reverse')"
        >
          건보료 → 연봉 추정
        </button>
        <button
          type="button"
          class="touch-target rounded border px-3 py-1.5 text-caption font-semibold transition-colors"
          :class="mode === 'forward' ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:text-foreground'"
          @click="emit('update:mode', 'forward')"
        >
          연봉 → 건보료 계산
        </button>
      </div>

      <!-- 건보료 → 연봉 추정 모드 -->
      <div v-if="mode === 'reverse'" class="space-y-3">
        <label :for="inputIds.reverseHealthInsurance" class="block text-caption font-semibold text-foreground">
          월 건강보험료 (원)
        </label>
        <input
          :id="inputIds.reverseHealthInsurance"
          :value="formattedHealthFee"
          type="text"
          inputmode="numeric"
          class="retro-input text-heading font-bold tabular-nums"
          @input="onHealthFeeInput"
        />

        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="step in HEALTH_STEPS"
            :key="step.delta"
            type="button"
            class="touch-target rounded border border-border px-3 py-1.5 text-caption font-semibold transition-colors"
            :class="step.delta < 0 ? 'text-muted-foreground hover:border-destructive/50 hover:text-destructive' : 'text-muted-foreground hover:border-primary hover:text-primary'"
            :disabled="step.delta < 0 && healthInsuranceFee + step.delta < 0"
            @click="adjustHealthFee(step.delta)"
          >
            {{ step.label }}
          </button>
        </div>

        <p class="text-caption text-muted-foreground">
          급여명세서의 <strong>건강보험(근로자 부담분)</strong>만 입력하세요.
        </p>
      </div>

      <!-- 연봉 → 건보료 계산 모드 -->
      <div v-else class="space-y-3">
        <label :for="inputIds.forwardAnnualGross" class="block text-caption font-semibold text-foreground">
          연봉 (만원)
        </label>
        <input
          :id="inputIds.forwardAnnualGross"
          :value="formattedGrossManWon"
          type="text"
          inputmode="numeric"
          class="retro-input text-heading font-bold tabular-nums"
          @input="onGrossInput"
        />

        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="step in GROSS_STEPS"
            :key="step.delta"
            type="button"
            class="touch-target rounded border border-border px-3 py-1.5 text-caption font-semibold transition-colors"
            :class="step.delta < 0 ? 'text-muted-foreground hover:border-destructive/50 hover:text-destructive' : 'text-muted-foreground hover:border-primary hover:text-primary'"
            :disabled="step.delta < 0 && annualGrossManWon + step.delta < 0"
            @click="adjustGross(step.delta)"
          >
            {{ step.label }}
          </button>
        </div>
      </div>

      <details class="rounded-xl border border-border/60 bg-muted/20 overflow-hidden">
        <summary class="cursor-pointer px-3 py-2 text-caption font-semibold text-foreground">
          상세 설정
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
            <span class="text-caption text-muted-foreground">비과세(만원/월)</span>
            <input
              :id="inputIds.nonTaxableMonthly"
              v-model.number="nonTaxableManWon"
              type="number"
              inputmode="numeric"
              min="0"
              max="500"
              class="retro-input"
            />
          </label>
        </div>
      </details>
    </div>
  </section>
</template>
