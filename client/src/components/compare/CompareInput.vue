<script setup lang="ts">
import { computed } from "vue";
import { formatNumber } from "@/lib/utils";

type CompanyInput = {
  annualGross: number;
  nonTaxableMonthly: number;
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

// 천단위 콤마 포맷 (원 단위)
const formattedAnnualA = computed(() => formatNumber(props.companyA.annualGross));
const formattedAnnualB = computed(() => formatNumber(props.companyB.annualGross));
const formattedNonTaxA = computed(() => formatNumber(props.companyA.nonTaxableMonthly));
const formattedNonTaxB = computed(() => formatNumber(props.companyB.nonTaxableMonthly));

function onAnnualInput(key: "companyA" | "companyB", event: Event): void {
  const raw = (event.target as HTMLInputElement).value.replace(/[^0-9]/g, "");
  const value = parseInt(raw, 10);
  if (Number.isFinite(value)) {
    updateCompany(key, { annualGross: clampInt(value, 10_000_000, 3_000_000_000) });
  }
}

function onNonTaxInput(key: "companyA" | "companyB", event: Event): void {
  const raw = (event.target as HTMLInputElement).value.replace(/[^0-9]/g, "");
  const value = parseInt(raw, 10);
  if (Number.isFinite(value)) {
    updateCompany(key, { nonTaxableMonthly: clampInt(value, 0, 5_000_000) });
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
  annualB: "compare-annual-b",
  nonTaxB: "compare-nontax-b",
  dependents: "compare-dependents",
  children: "compare-children",
} as const;
</script>

<template>
  <section class="retro-panel overflow-hidden">
    <div class="retro-titlebar">
      <h2 class="retro-title">연봉 비교 입력</h2>
    </div>

    <div class="retro-panel-content space-y-4">
      <div class="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_56px_minmax(0,1fr)] md:items-stretch">
        <div class="rounded-xl border-2 border-status-info/35 bg-status-info/10 p-3 space-y-3">
          <div class="rounded-lg border border-status-info/35 bg-background/60 px-2.5 py-2">
            <div class="flex items-center justify-between gap-2">
              <p class="text-caption font-semibold text-status-info">현재 회사</p>
              <span class="retro-kbd border-status-info/45 bg-status-info/10 px-2 py-0.5 text-status-info">STEP 1</span>
            </div>
          </div>
          <label class="block space-y-1" :for="inputIds.annualA">
            <span class="text-caption text-muted-foreground">연봉 (원)</span>
            <input
              :id="inputIds.annualA"
              :value="formattedAnnualA"
              type="text"
              inputmode="numeric"
              class="retro-input tabular-nums font-bold border-status-info/35 focus:border-status-info focus:ring-status-info"
              @input="onAnnualInput('companyA', $event)"
            />
          </label>
          <label class="block space-y-1" :for="inputIds.nonTaxA">
            <span class="text-caption text-muted-foreground">비과세 (원/월)</span>
            <input :id="inputIds.nonTaxA" :value="formattedNonTaxA" type="text" class="retro-input" inputmode="numeric" @input="onNonTaxInput('companyA', $event)" />
          </label>
          <details class="retro-details border-status-info/30 bg-background/60">
            <summary class="retro-details-summary text-status-info">
              <span>상세 설정 보기</span>
              <span class="retro-details-chevron" aria-hidden="true">▾</span>
            </summary>
            <div class="space-y-2 p-2">
              <label class="inline-flex items-center gap-2 text-caption">
                <input
                  type="checkbox"
                  class="retro-checkbox"
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
          <span class="retro-kbd mx-3 px-3 py-1 font-extrabold">비교</span>
          <div class="h-px flex-1 bg-border/60" />
        </div>
        <div class="hidden md:flex items-center justify-center">
          <span class="retro-kbd px-3 py-1 font-extrabold">비교</span>
        </div>

        <div class="rounded-xl border-2 border-status-success/35 bg-status-success/10 p-3 space-y-3">
          <div class="rounded-lg border border-status-success/35 bg-background/60 px-2.5 py-2">
            <div class="flex items-center justify-between gap-2">
              <p class="text-caption font-semibold text-status-success">이직 회사</p>
              <span class="retro-kbd border-status-success/45 bg-status-success/10 px-2 py-0.5 text-status-success">STEP 2</span>
            </div>
          </div>
          <label class="block space-y-1" :for="inputIds.annualB">
            <span class="text-caption text-muted-foreground">연봉 (원)</span>
            <input
              :id="inputIds.annualB"
              :value="formattedAnnualB"
              type="text"
              inputmode="numeric"
              class="retro-input tabular-nums font-bold border-status-success/35 focus:border-status-success focus:ring-status-success"
              @input="onAnnualInput('companyB', $event)"
            />
          </label>
          <label class="block space-y-1" :for="inputIds.nonTaxB">
            <span class="text-caption text-muted-foreground">비과세 (원/월)</span>
            <input :id="inputIds.nonTaxB" :value="formattedNonTaxB" type="text" class="retro-input" inputmode="numeric" @input="onNonTaxInput('companyB', $event)" />
          </label>
          <details class="retro-details border-status-success/30 bg-background/60">
            <summary class="retro-details-summary text-status-success">
              <span>상세 설정 보기</span>
              <span class="retro-details-chevron" aria-hidden="true">▾</span>
            </summary>
            <div class="space-y-2 p-2">
              <label class="inline-flex items-center gap-2 text-caption">
                <input
                  type="checkbox"
                  class="retro-checkbox"
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

      <div v-if="$slots.result" class="border-t border-border/60 pt-4">
        <slot name="result" />
      </div>
    </div>
  </section>
</template>
