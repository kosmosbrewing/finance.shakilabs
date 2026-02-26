<script setup lang="ts">
import type { QuitReason } from "@/data/unemploymentTable";
import { computed } from "vue";

const props = defineProps<{
  startDate: string;
  endDate: string;
  monthlySalary: number;
  nonTaxableMonthly: number;
  age: number;
  quitReason: QuitReason;
  dependents: number;
  childrenUnder20: number;
  unusedLeaveDays: number;
  annualBonus: number;
  monthlyLivingCost: number;
}>();

const emit = defineEmits<{
  "update:startDate": [value: string];
  "update:endDate": [value: string];
  "update:monthlySalary": [value: number];
  "update:nonTaxableMonthly": [value: number];
  "update:age": [value: number];
  "update:quitReason": [value: QuitReason];
  "update:dependents": [value: number];
  "update:childrenUnder20": [value: number];
  "update:unusedLeaveDays": [value: number];
  "update:annualBonus": [value: number];
  "update:monthlyLivingCost": [value: number];
}>();

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.floor(value || 0)));
}

const salaryManWon = computed({
  get: () => Math.floor(props.monthlySalary / 10_000),
  set: (value: number) => emit("update:monthlySalary", clampInt(value, 100, 10000) * 10_000),
});

const nonTaxManWon = computed({
  get: () => Math.floor(props.nonTaxableMonthly / 10_000),
  set: (value: number) => emit("update:nonTaxableMonthly", clampInt(value, 0, 500) * 10_000),
});

const bonusManWon = computed({
  get: () => Math.floor(props.annualBonus / 10_000),
  set: (value: number) => emit("update:annualBonus", clampInt(value, 0, 100000) * 10_000),
});

const livingCostManWon = computed({
  get: () => Math.floor(props.monthlyLivingCost / 10_000),
  set: (value: number) => emit("update:monthlyLivingCost", clampInt(value, 100, 10000) * 10_000),
});

function updateDependents(value: number): void {
  const safe = clampInt(value, 1, 20);
  emit("update:dependents", safe);
  const maxChildren = Math.max(0, safe - 1);
  if (props.childrenUnder20 > maxChildren) {
    emit("update:childrenUnder20", maxChildren);
  }
}

function updateChildren(value: number): void {
  const maxChildren = Math.max(0, props.dependents - 1);
  emit("update:childrenUnder20", clampInt(value, 0, maxChildren));
}

const inputIds = {
  startDate: "quit-start-date",
  endDate: "quit-end-date",
  monthlySalary: "quit-monthly-salary",
  nonTaxableMonthly: "quit-nontaxable-monthly",
  age: "quit-age",
  dependents: "quit-dependents",
  children: "quit-children",
  unusedLeaveDays: "quit-unused-leave",
  annualBonus: "quit-annual-bonus",
  monthlyLivingCost: "quit-monthly-living-cost",
} as const;
</script>

<template>
  <section class="retro-panel overflow-hidden">
    <div class="retro-titlebar">
      <h2 class="retro-title">퇴사 조건 입력</h2>
      <span class="retro-kbd">INPUT</span>
    </div>

    <div class="retro-panel-content space-y-4">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="space-y-1" :for="inputIds.startDate">
          <span class="text-caption text-muted-foreground">입사일</span>
          <input :id="inputIds.startDate" :value="startDate" type="date" class="retro-input" @input="emit('update:startDate', ($event.target as HTMLInputElement).value)" />
        </label>
        <label class="space-y-1" :for="inputIds.endDate">
          <span class="text-caption text-muted-foreground">퇴사일</span>
          <input :id="inputIds.endDate" :value="endDate" type="date" class="retro-input" @input="emit('update:endDate', ($event.target as HTMLInputElement).value)" />
        </label>
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label class="space-y-1" :for="inputIds.monthlySalary">
          <span class="text-caption text-muted-foreground">월급(세전, 만원)</span>
          <input :id="inputIds.monthlySalary" v-model.number="salaryManWon" type="number" min="100" max="10000" inputmode="numeric" class="retro-input" />
        </label>
        <label class="space-y-1" :for="inputIds.nonTaxableMonthly">
          <span class="text-caption text-muted-foreground">비과세(만원/월)</span>
          <input :id="inputIds.nonTaxableMonthly" v-model.number="nonTaxManWon" type="number" min="0" max="500" inputmode="numeric" class="retro-input" />
        </label>
        <label class="space-y-1" :for="inputIds.age">
          <span class="text-caption text-muted-foreground">나이</span>
          <input :id="inputIds.age" :value="age" type="number" min="20" max="80" inputmode="numeric" class="retro-input" @input="emit('update:age', clampInt(parseInt(($event.target as HTMLInputElement).value, 10), 20, 80))" />
        </label>
      </div>

      <div class="space-y-2 border border-border/60 bg-muted/20 p-3">
        <span class="text-caption font-semibold">퇴사 사유</span>
        <div class="flex flex-wrap gap-2 text-caption">
          <label class="inline-flex items-center gap-1.5"><input type="radio" name="quit-reason" value="layoff" :checked="quitReason === 'layoff'" @change="emit('update:quitReason', 'layoff')" />권고사직</label>
          <label class="inline-flex items-center gap-1.5"><input type="radio" name="quit-reason" value="dismissal" :checked="quitReason === 'dismissal'" @change="emit('update:quitReason', 'dismissal')" />해고</label>
          <label class="inline-flex items-center gap-1.5"><input type="radio" name="quit-reason" value="contract_end" :checked="quitReason === 'contract_end'" @change="emit('update:quitReason', 'contract_end')" />계약만료</label>
          <label class="inline-flex items-center gap-1.5"><input type="radio" name="quit-reason" value="voluntary" :checked="quitReason === 'voluntary'" @change="emit('update:quitReason', 'voluntary')" />자발적 퇴사</label>
        </div>
      </div>

      <details class="rounded-xl border border-border/60 bg-muted/20 overflow-hidden">
        <summary class="touch-target cursor-pointer px-3 py-2 text-caption font-semibold">상세 설정</summary>
        <div class="grid grid-cols-1 gap-3 p-3 sm:grid-cols-3">
          <label class="space-y-1" :for="inputIds.dependents">
            <span class="text-caption text-muted-foreground">부양가족 수</span>
            <input :id="inputIds.dependents" :value="dependents" type="number" min="1" max="20" inputmode="numeric" class="retro-input" @input="updateDependents(parseInt(($event.target as HTMLInputElement).value, 10))" />
          </label>
          <label class="space-y-1" :for="inputIds.children">
            <span class="text-caption text-muted-foreground">8~20세 자녀 수</span>
            <input :id="inputIds.children" :value="childrenUnder20" type="number" min="0" max="20" inputmode="numeric" class="retro-input" @input="updateChildren(parseInt(($event.target as HTMLInputElement).value, 10))" />
          </label>
          <label class="space-y-1" :for="inputIds.unusedLeaveDays">
            <span class="text-caption text-muted-foreground">미사용 연차(일)</span>
            <input :id="inputIds.unusedLeaveDays" :value="unusedLeaveDays" type="number" min="0" max="60" inputmode="numeric" class="retro-input" @input="emit('update:unusedLeaveDays', clampInt(parseInt(($event.target as HTMLInputElement).value, 10), 0, 60))" />
          </label>
          <label class="space-y-1" :for="inputIds.annualBonus">
            <span class="text-caption text-muted-foreground">연간 상여금(만원)</span>
            <input :id="inputIds.annualBonus" v-model.number="bonusManWon" type="number" min="0" max="100000" inputmode="numeric" class="retro-input" />
          </label>
          <label class="space-y-1" :for="inputIds.monthlyLivingCost">
            <span class="text-caption text-muted-foreground">월 생활비(만원)</span>
            <input :id="inputIds.monthlyLivingCost" v-model.number="livingCostManWon" type="number" min="100" max="10000" inputmode="numeric" class="retro-input" />
          </label>
        </div>
      </details>
    </div>
  </section>
</template>
