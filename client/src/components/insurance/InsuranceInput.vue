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

const annualGrossManWon = computed({
  get: () => Math.floor(props.annualGross / 10_000),
  set: (value: number) => {
    const safe = Math.max(0, Math.min(1_000_000, Math.floor(value || 0)));
    emit("update:annualGross", safe * 10_000);
  },
});

const nonTaxableManWon = computed({
  get: () => Math.floor(props.nonTaxableMonthly / 10_000),
  set: (value: number) => {
    const safe = Math.max(0, Math.min(500, Math.floor(value || 0)));
    emit("update:nonTaxableMonthly", safe * 10_000);
  },
});

function updateHealthInsurance(value: number): void {
  const safe = Math.max(0, Math.min(5_000_000, Math.floor(value || 0)));
  emit("update:healthInsuranceFee", safe);
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
  forwardAnnualGross: "insurance-annual-gross",
  dependents: "insurance-dependents",
  children: "insurance-children",
  nonTaxableMonthly: "insurance-nontaxable-monthly",
} as const;
</script>

<template>
  <section class="retro-panel border border-border/70">
    <div class="retro-titlebar">
      <h2 class="retro-title">건보료/연봉 입력</h2>
      <span class="retro-kbd">INPUT</span>
    </div>

    <div class="retro-panel-content space-y-4">
      <div class="flex gap-2">
        <button
          type="button"
          class="touch-target rounded border px-3 py-1.5 text-caption font-semibold transition-colors"
          :class="mode === 'reverse' ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:text-foreground'"
          @click="emit('update:mode', 'reverse')"
        >
          건보료 → 연봉 역산
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

      <div v-if="mode === 'reverse'" class="space-y-3">
        <label :for="inputIds.reverseHealthInsurance" class="block text-caption font-semibold text-foreground">
          월 건강보험료 (원)
        </label>
        <input
          :id="inputIds.reverseHealthInsurance"
          :value="healthInsuranceFee"
          type="number"
          inputmode="numeric"
          min="0"
          max="5000000"
          class="retro-input text-h2 font-bold tabular-nums"
          @input="updateHealthInsurance(parseInt(($event.target as HTMLInputElement).value, 10))"
        />

        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="preset in presets"
            :key="preset"
            type="button"
            class="touch-target rounded border px-3 py-1.5 text-caption font-semibold transition-colors"
            :class="healthInsuranceFee === preset ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'"
            @click="emit('update:healthInsuranceFee', preset)"
          >
            {{ Math.round(preset / 10000) }}만
          </button>
        </div>

        <p class="text-caption text-muted-foreground">
          급여명세서의 <strong>건강보험(근로자 부담분)</strong>만 입력하세요.
        </p>
      </div>

      <div v-else class="space-y-3">
        <label :for="inputIds.forwardAnnualGross" class="block text-caption font-semibold text-foreground">
          연봉 (만원)
        </label>
        <input
          :id="inputIds.forwardAnnualGross"
          v-model.number="annualGrossManWon"
          type="number"
          inputmode="numeric"
          min="0"
          max="1000000"
          class="retro-input text-h2 font-bold tabular-nums"
        />
      </div>

      <details class="border border-border/60 bg-muted/20">
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
