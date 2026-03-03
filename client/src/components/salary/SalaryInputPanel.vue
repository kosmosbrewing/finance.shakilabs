<script setup lang="ts">
import { computed } from "vue";
import { formatNumber } from "@/lib/utils";

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

const inputIds = {
  annualGross: "salary-annual-gross",
  annualGrossRange: "salary-annual-gross-range",
  nonTaxableMonthly: "salary-nontaxable-monthly",
} as const;

// 천단위 콤마 포맷 (원 단위)
const formattedGross = computed(() => formatNumber(props.annualGross));

function onGrossInput(event: Event): void {
  const raw = (event.target as HTMLInputElement).value.replace(/[^0-9]/g, "");
  const value = parseInt(raw, 10);
  if (Number.isFinite(value)) {
    emit("update:annualGross", Math.max(10_000_000, Math.min(200_000_000, value)));
  }
}

function onGrossRangeInput(event: Event): void {
  const value = parseInt((event.target as HTMLInputElement).value, 10);
  if (Number.isFinite(value)) {
    emit("update:annualGross", value);
  }
}

const formattedNonTaxable = computed(() => formatNumber(props.nonTaxableMonthly));

function onNonTaxableInput(event: Event): void {
  const raw = (event.target as HTMLInputElement).value.replace(/[^0-9]/g, "");
  const value = parseInt(raw, 10);
  if (Number.isFinite(value)) {
    emit("update:nonTaxableMonthly", Math.max(0, Math.min(5_000_000, value)));
  }
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
    </div>

    <div class="retro-panel-content space-y-4">
      <div>
        <label :for="inputIds.annualGross" class="mb-0.5 block text-caption font-semibold text-foreground">
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
              :id="inputIds.annualGross"
              :value="formattedGross"
              type="text"
              class="retro-input min-w-0 flex-1 text-center text-heading font-bold tabular-nums"
              placeholder="30,000,000"
              inputmode="numeric"
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
            :id="inputIds.annualGrossRange"
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
      </div>

      <details class="retro-details" open>
        <summary class="retro-details-summary">
          <span>상세 설정 보기</span>
          <span class="retro-details-chevron" aria-hidden="true">▾</span>
        </summary>

        <div class="space-y-3 p-3">
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

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p class="mb-0.5 block text-caption font-semibold text-foreground">
                부양가족 수 (본인 포함)
              </p>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="touch-target flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-lg font-bold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  aria-label="부양가족 수 감소"
                  @click="adjustDependents(-1)"
                >
                  −
                </button>
                <span class="w-12 text-center text-heading font-bold tabular-nums">{{ props.dependents }}</span>
                <button
                  type="button"
                  class="touch-target flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-lg font-bold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  aria-label="부양가족 수 증가"
                  @click="adjustDependents(1)"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <p class="mb-0.5 block text-caption font-semibold text-foreground">
                8~20세 자녀 수
              </p>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="touch-target flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-lg font-bold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  aria-label="8~20세 자녀 수 감소"
                  @click="adjustChildren(-1)"
                >
                  −
                </button>
                <span class="w-12 text-center text-heading font-bold tabular-nums">{{ props.childrenUnder20 }}</span>
                <button
                  type="button"
                  class="touch-target flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-lg font-bold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  aria-label="8~20세 자녀 수 증가"
                  @click="adjustChildren(1)"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label :for="inputIds.nonTaxableMonthly" class="mb-0.5 block text-caption font-semibold text-foreground">
                비과세 금액 (원/월)
              </label>
              <input
                :id="inputIds.nonTaxableMonthly"
                :value="formattedNonTaxable"
                type="text"
                class="retro-input tabular-nums"
                placeholder="200,000"
                inputmode="numeric"
                @input="onNonTaxableInput"
              />
            </div>
          </div>
        </div>
      </details>
    </div>
  </section>
</template>
