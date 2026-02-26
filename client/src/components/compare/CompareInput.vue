<script setup lang="ts">
import { computed } from "vue";

type CompanyInput = {
  annualGross: number;
  nonTaxableMonthly: number;
  bonusAnnual: number;
  welfareMonthly: number;
  retirementIncluded: boolean;
};

const props = defineProps<{
  companyA: CompanyInput;
  companyB: CompanyInput;
  dependents: number;
  childrenUnder20: number;
}>();

const emit = defineEmits<{
  "update:companyA": [value: CompanyInput];
  "update:companyB": [value: CompanyInput];
  "update:dependents": [value: number];
  "update:childrenUnder20": [value: number];
}>();

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.floor(value || 0)));
}

function updateCompany(
  key: "companyA" | "companyB",
  patch: Partial<CompanyInput>
): void {
  if (key === "companyA") {
    emit("update:companyA", {
      ...props.companyA,
      ...patch,
    });
    return;
  }

  emit("update:companyB", {
    ...props.companyB,
    ...patch,
  });
}

const annualAManWon = computed({
  get: () => Math.floor(props.companyA.annualGross / 10_000),
  set: (value: number) =>
    updateCompany("companyA", { annualGross: clampInt(value, 1_000, 300_000) * 10_000 }),
});

const annualBManWon = computed({
  get: () => Math.floor(props.companyB.annualGross / 10_000),
  set: (value: number) =>
    updateCompany("companyB", { annualGross: clampInt(value, 1_000, 300_000) * 10_000 }),
});

const nonTaxAManWon = computed({
  get: () => Math.floor(props.companyA.nonTaxableMonthly / 10_000),
  set: (value: number) =>
    updateCompany("companyA", {
      nonTaxableMonthly: clampInt(value, 0, 500) * 10_000,
    }),
});

const nonTaxBManWon = computed({
  get: () => Math.floor(props.companyB.nonTaxableMonthly / 10_000),
  set: (value: number) =>
    updateCompany("companyB", {
      nonTaxableMonthly: clampInt(value, 0, 500) * 10_000,
    }),
});

const bonusAManWon = computed({
  get: () => Math.floor(props.companyA.bonusAnnual / 10_000),
  set: (value: number) =>
    updateCompany("companyA", { bonusAnnual: clampInt(value, 0, 100_000) * 10_000 }),
});

const bonusBManWon = computed({
  get: () => Math.floor(props.companyB.bonusAnnual / 10_000),
  set: (value: number) =>
    updateCompany("companyB", { bonusAnnual: clampInt(value, 0, 100_000) * 10_000 }),
});

const welfareAManWon = computed({
  get: () => Math.floor(props.companyA.welfareMonthly / 10_000),
  set: (value: number) =>
    updateCompany("companyA", { welfareMonthly: clampInt(value, 0, 1_000) * 10_000 }),
});

const welfareBManWon = computed({
  get: () => Math.floor(props.companyB.welfareMonthly / 10_000),
  set: (value: number) =>
    updateCompany("companyB", { welfareMonthly: clampInt(value, 0, 1_000) * 10_000 }),
});

// 천단위 콤마 포맷 (연봉)
const formattedAnnualA = computed(() => annualAManWon.value.toLocaleString("ko-KR"));
const formattedAnnualB = computed(() => annualBManWon.value.toLocaleString("ko-KR"));

function onAnnualInput(key: "companyA" | "companyB", event: Event): void {
  const raw = (event.target as HTMLInputElement).value.replace(/[^0-9]/g, "");
  const value = parseInt(raw, 10);
  if (Number.isFinite(value)) {
    updateCompany(key, { annualGross: clampInt(value, 1_000, 300_000) * 10_000 });
  }
}

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
  annualA: "compare-annual-a",
  nonTaxA: "compare-nontax-a",
  bonusA: "compare-bonus-a",
  welfareA: "compare-welfare-a",
  annualB: "compare-annual-b",
  nonTaxB: "compare-nontax-b",
  bonusB: "compare-bonus-b",
  welfareB: "compare-welfare-b",
  dependents: "compare-dependents",
  children: "compare-children",
} as const;
</script>

<template>
  <section class="retro-panel overflow-hidden">
    <div class="retro-titlebar">
      <h2 class="retro-title">A사 vs B사 입력</h2>
    </div>

    <div class="retro-panel-content space-y-4">
      <div class="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_56px_minmax(0,1fr)] md:items-stretch">
        <div class="rounded-xl border border-border/60 p-3 space-y-3 bg-muted/20">
          <h3 class="text-caption font-semibold">현재 회사 (A사)</h3>
          <label class="block space-y-1" :for="inputIds.annualA">
            <span class="text-caption text-muted-foreground">연봉 (만원)</span>
            <input :id="inputIds.annualA" :value="formattedAnnualA" type="text" inputmode="numeric" class="retro-input tabular-nums font-bold" @input="onAnnualInput('companyA', $event)" />
          </label>
          <label class="block space-y-1" :for="inputIds.nonTaxA">
            <span class="text-caption text-muted-foreground">비과세 (만원/월)</span>
            <input :id="inputIds.nonTaxA" v-model.number="nonTaxAManWon" type="number" min="0" max="500" class="retro-input" inputmode="numeric" />
          </label>
          <details class="rounded-xl border border-border/60 bg-muted/20 overflow-hidden">
            <summary class="touch-target cursor-pointer px-2 py-1.5 text-caption font-semibold">상세</summary>
            <div class="space-y-2 p-2">
              <label class="block space-y-1" :for="inputIds.bonusA">
                <span class="text-caption text-muted-foreground">성과급 (만원/연)</span>
                <input :id="inputIds.bonusA" v-model.number="bonusAManWon" type="number" min="0" max="100000" class="retro-input" inputmode="numeric" />
              </label>
              <label class="block space-y-1" :for="inputIds.welfareA">
                <span class="text-caption text-muted-foreground">복지포인트 (만원/월)</span>
                <input :id="inputIds.welfareA" v-model.number="welfareAManWon" type="number" min="0" max="1000" class="retro-input" inputmode="numeric" />
              </label>
              <label class="inline-flex items-center gap-2 text-caption">
                <input
                  type="checkbox"
                  :checked="companyA.retirementIncluded"
                  @change="updateCompany('companyA', { retirementIncluded: ($event.target as HTMLInputElement).checked })"
                />
                퇴직금 포함 연봉
              </label>
            </div>
          </details>
        </div>

        <div class="flex md:hidden items-center justify-center -my-1">
          <div class="h-px flex-1 bg-border/60" />
          <span class="retro-kbd mx-3 px-3 py-1 font-extrabold">VS</span>
          <div class="h-px flex-1 bg-border/60" />
        </div>
        <div class="hidden md:flex items-center justify-center">
          <span class="retro-kbd px-3 py-1 font-extrabold">VS</span>
        </div>

        <div class="rounded-xl border border-border/60 p-3 space-y-3 bg-muted/20">
          <h3 class="text-caption font-semibold">이직 회사 (B사)</h3>
          <label class="block space-y-1" :for="inputIds.annualB">
            <span class="text-caption text-muted-foreground">연봉 (만원)</span>
            <input :id="inputIds.annualB" :value="formattedAnnualB" type="text" inputmode="numeric" class="retro-input tabular-nums font-bold" @input="onAnnualInput('companyB', $event)" />
          </label>
          <label class="block space-y-1" :for="inputIds.nonTaxB">
            <span class="text-caption text-muted-foreground">비과세 (만원/월)</span>
            <input :id="inputIds.nonTaxB" v-model.number="nonTaxBManWon" type="number" min="0" max="500" class="retro-input" inputmode="numeric" />
          </label>
          <details class="rounded-xl border border-border/60 bg-muted/20 overflow-hidden">
            <summary class="touch-target cursor-pointer px-2 py-1.5 text-caption font-semibold">상세</summary>
            <div class="space-y-2 p-2">
              <label class="block space-y-1" :for="inputIds.bonusB">
                <span class="text-caption text-muted-foreground">성과급 (만원/연)</span>
                <input :id="inputIds.bonusB" v-model.number="bonusBManWon" type="number" min="0" max="100000" class="retro-input" inputmode="numeric" />
              </label>
              <label class="block space-y-1" :for="inputIds.welfareB">
                <span class="text-caption text-muted-foreground">복지포인트 (만원/월)</span>
                <input :id="inputIds.welfareB" v-model.number="welfareBManWon" type="number" min="0" max="1000" class="retro-input" inputmode="numeric" />
              </label>
              <label class="inline-flex items-center gap-2 text-caption">
                <input
                  type="checkbox"
                  :checked="companyB.retirementIncluded"
                  @change="updateCompany('companyB', { retirementIncluded: ($event.target as HTMLInputElement).checked })"
                />
                퇴직금 포함 연봉
              </label>
            </div>
          </details>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-border/60 bg-muted/20 p-3">
        <label class="space-y-1" :for="inputIds.dependents">
          <span class="text-caption text-muted-foreground">부양가족 수 (공통)</span>
          <input
            :id="inputIds.dependents"
            :value="dependents"
            type="number"
            min="1"
            max="20"
            inputmode="numeric"
            class="retro-input"
            @input="updateDependents(parseInt(($event.target as HTMLInputElement).value, 10))"
          />
        </label>
        <label class="space-y-1" :for="inputIds.children">
          <span class="text-caption text-muted-foreground">8~20세 자녀 수 (공통)</span>
          <input
            :id="inputIds.children"
            :value="childrenUnder20"
            type="number"
            min="0"
            max="20"
            inputmode="numeric"
            class="retro-input"
            @input="updateChildren(parseInt(($event.target as HTMLInputElement).value, 10))"
          />
        </label>
      </div>
    </div>
  </section>
</template>
