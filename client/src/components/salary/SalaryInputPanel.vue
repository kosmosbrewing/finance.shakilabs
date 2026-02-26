<script setup lang="ts">
import { computed } from "vue";
import { Minus, Plus } from "lucide-vue-next";

const props = defineProps<{
  annualGross: number;
  dependents: number;
  childrenUnder20: number;
  nonTaxableMonthly: number;
  retirementIncluded?: boolean;
}>();

const emit = defineEmits<{
  "update:annualGross": [value: number];
  "update:dependents": [value: number];
  "update:childrenUnder20": [value: number];
  "update:nonTaxableMonthly": [value: number];
  "update:retirementIncluded": [value: boolean];
}>();

// 빠른 선택 버튼 (만원 단위 표시, 실제값은 원)
const quickAmounts = [
  { label: "2천", value: 20_000_000 },
  { label: "3천", value: 30_000_000 },
  { label: "4천", value: 40_000_000 },
  { label: "5천", value: 50_000_000 },
  { label: "7천", value: 70_000_000 },
  { label: "1억", value: 100_000_000 },
] as const;

const inputIds = {
  annualGross: "salary-annual-gross",
  annualGrossRange: "salary-annual-gross-range",
  nonTaxableMonthly: "salary-nontaxable-monthly",
} as const;

// 연봉 입력값 만원 단위로 변환
const grossInManWon = computed({
  get: () => Math.round(props.annualGross / 10_000),
  set: (value: number) => {
    const safe = Math.max(1_000, Math.min(300_000, Math.floor(value || 0)));
    emit("update:annualGross", safe * 10_000);
  },
});

const nonTaxableManWon = computed({
  get: () => Math.round(props.nonTaxableMonthly / 10_000),
  set: (value: number) => {
    const safe = Math.max(0, Math.min(500, Math.floor(value || 0)));
    emit("update:nonTaxableMonthly", safe * 10_000);
  },
});

function setQuickAmount(value: number): void {
  emit("update:annualGross", value);
}

function adjustDependents(delta: number): void {
  const next = Math.max(1, Math.min(20, props.dependents + delta));
  emit("update:dependents", next);

  const maxChildren = Math.max(0, next - 1);
  if (props.childrenUnder20 > maxChildren) {
    emit("update:childrenUnder20", maxChildren);
  }
}

function adjustChildren(delta: number): void {
  const maxChildren = Math.max(0, props.dependents - 1);
  const next = Math.max(0, Math.min(maxChildren, props.childrenUnder20 + delta));
  emit("update:childrenUnder20", next);
}

function updateRetirementIncluded(value: boolean): void {
  emit("update:retirementIncluded", value);
}
</script>

<template>
  <section class="retro-panel overflow-hidden">
    <div class="retro-titlebar">
      <h2 class="retro-title">급여 정보 입력</h2>
      <span class="retro-kbd">INPUT</span>
    </div>

    <div class="retro-panel-content space-y-5">
      <div>
        <label :for="inputIds.annualGross" class="mb-2 block text-caption font-semibold text-foreground">
          연봉 (만원)
        </label>
        <div class="space-y-2">
          <input
            :id="inputIds.annualGross"
            v-model.number="grossInManWon"
            type="number"
            class="retro-input text-h2 font-bold tabular-nums"
            placeholder="3000"
            min="1000"
            max="300000"
            inputmode="numeric"
          />
          <input
            :id="inputIds.annualGrossRange"
            v-model.number="grossInManWon"
            type="range"
            min="1000"
            max="300000"
            step="100"
            class="h-3 w-full cursor-pointer appearance-none rounded bg-muted"
            aria-label="연봉 슬라이더"
          />
        </div>

        <div class="mt-3 flex flex-wrap gap-1.5">
          <button
            v-for="item in quickAmounts"
            :key="item.value"
            type="button"
            :class="[
              'touch-target rounded border px-3 py-1.5 text-caption font-semibold transition-colors',
              props.annualGross === item.value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border text-muted-foreground hover:border-primary hover:text-primary',
            ]"
            @click="setQuickAmount(item.value)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>

      <details class="rounded-xl border border-border/60 bg-muted/20 overflow-hidden" open>
        <summary class="cursor-pointer px-3 py-2 text-caption font-semibold text-foreground">
          상세 설정
        </summary>

        <div class="space-y-4 p-3">
          <div>
            <span class="mb-2 block text-caption font-semibold text-foreground">퇴직금 포함 여부</span>
            <div class="flex gap-2">
              <button
                type="button"
                class="touch-target rounded border px-3 py-1.5 text-caption font-semibold"
                :class="!props.retirementIncluded ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground'"
                @click="updateRetirementIncluded(false)"
              >
                퇴직금 별도
              </button>
              <button
                type="button"
                class="touch-target rounded border px-3 py-1.5 text-caption font-semibold"
                :class="props.retirementIncluded ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground'"
                @click="updateRetirementIncluded(true)"
              >
                퇴직금 포함
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p class="mb-2 block text-caption font-semibold text-foreground">
                부양가족 수 (본인 포함)
              </p>
              <div class="flex items-center gap-3">
                <button
                  type="button"
                  class="inline-flex touch-target h-11 w-11 items-center justify-center rounded border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  aria-label="부양가족 수 감소"
                  @click="adjustDependents(-1)"
                >
                  <Minus class="h-4 w-4" />
                </button>
                <span class="w-12 text-center text-h2 font-bold tabular-nums">{{ props.dependents }}</span>
                <button
                  type="button"
                  class="inline-flex touch-target h-11 w-11 items-center justify-center rounded border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  aria-label="부양가족 수 증가"
                  @click="adjustDependents(1)"
                >
                  <Plus class="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <p class="mb-2 block text-caption font-semibold text-foreground">
                8~20세 자녀 수
              </p>
              <div class="flex items-center gap-3">
                <button
                  type="button"
                  class="inline-flex touch-target h-11 w-11 items-center justify-center rounded border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  aria-label="8~20세 자녀 수 감소"
                  @click="adjustChildren(-1)"
                >
                  <Minus class="h-4 w-4" />
                </button>
                <span class="w-12 text-center text-h2 font-bold tabular-nums">{{ props.childrenUnder20 }}</span>
                <button
                  type="button"
                  class="inline-flex touch-target h-11 w-11 items-center justify-center rounded border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  aria-label="8~20세 자녀 수 증가"
                  @click="adjustChildren(1)"
                >
                  <Plus class="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <label :for="inputIds.nonTaxableMonthly" class="mb-2 block text-caption font-semibold text-foreground">
                비과세 금액 (만원/월)
              </label>
              <input
                :id="inputIds.nonTaxableMonthly"
                v-model.number="nonTaxableManWon"
                type="number"
                class="retro-input tabular-nums"
                placeholder="20"
                min="0"
                max="500"
                inputmode="numeric"
              />
            </div>
          </div>
        </div>
      </details>
    </div>
  </section>
</template>
