<script setup lang="ts">
import { computed } from "vue";
import { ShPresetGroup, ShSlider, ShStepper, ShToggleGroup } from "@shakilabs/ui";
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

const salaryPresets = [
  { label: "3,000만", value: 30_000_000 },
  { label: "4,000만", value: 40_000_000 },
  { label: "5,000만", value: 50_000_000 },
  { label: "6,000만", value: 60_000_000 },
  { label: "8,000만", value: 80_000_000 },
  { label: "1억", value: 100_000_000 },
];

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
    emit("update:annualGross", Math.max(10_000_000, Math.min(300_000_000, value)));
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

// 스텝 UI는 ShStepper 소유, 부양가족↔자녀 결합 규칙(자녀 ≤ 부양가족−1)만 앱이 유지
function onDependentsChange(next: number): void {
  emit("update:dependents", next);

  const maxChildren = Math.max(0, next - 1);
  if (props.childrenUnder20 > maxChildren) {
    emit("update:childrenUnder20", maxChildren);
  }
}

const maxChildren = computed(() => Math.max(0, props.dependents - 1));

const retirementOptions = [
  { label: "퇴직금 별도", value: false },
  { label: "퇴직금 포함", value: true },
];
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
          <ShStepper
            class="w-full"
            :model-value="annualGross"
            :min="10_000_000"
            :max="300_000_000"
            :step="1_000_000"
            label="연봉 100만원 단위"
            @update:model-value="emit('update:annualGross', $event)"
          >
            <!-- 연봉은 직접 입력이 핵심 UX — 값 표시 대신 기존 입력창을 slot으로 유지 -->
            <input
              :id="inputIds.annualGross"
              :value="formattedGross"
              type="text"
              class="retro-input w-full text-center text-heading font-bold tabular-nums"
              placeholder="30,000,000"
              inputmode="numeric"
              @input="onGrossInput"
            />
          </ShStepper>
          <ShSlider
            :id="inputIds.annualGrossRange"
            :model-value="annualGross"
            :min="10_000_000"
            :max="300_000_000"
            :step="1_000_000"
            :value-text="`연봉 ${formattedGross}원`"
            aria-label="연봉 슬라이더"
            @update:model-value="emit('update:annualGross', $event)"
          />
          <ShPresetGroup
            :model-value="annualGross"
            :options="salaryPresets"
            label="연봉 빠른 선택"
            @update:model-value="emit('update:annualGross', $event)"
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
            <ShToggleGroup
              :model-value="props.retirementIncluded ?? false"
              :options="retirementOptions"
              label="퇴직금 포함 여부"
              @update:model-value="emit('update:retirementIncluded', $event)"
            />
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p class="mb-0.5 block text-caption font-semibold text-foreground">
                부양가족 수 (본인 포함)
              </p>
              <ShStepper
                :model-value="props.dependents"
                :min="1"
                :max="20"
                label="부양가족 수"
                @update:model-value="onDependentsChange"
              />
            </div>

            <div>
              <p class="mb-0.5 block text-caption font-semibold text-foreground">
                8~20세 자녀 수
              </p>
              <ShStepper
                :model-value="props.childrenUnder20"
                :min="0"
                :max="maxChildren"
                label="8~20세 자녀 수"
                @update:model-value="emit('update:childrenUnder20', $event)"
              />
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
