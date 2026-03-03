<script setup lang="ts">
import type { QuitReason } from "@/data/unemploymentTable";
import { computed, ref } from "vue";
import { formatNumber } from "@/lib/utils";

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
  "range-apply": [range: { startDate: string; endDate: string }];
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

function toDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDotDate(value: string): string {
  return value.replace(/-/g, ".");
}

// ── 근속 년수 ──
const serviceYears = computed(() => {
  const start = new Date(`${props.startDate}T00:00:00`);
  const end = new Date(`${props.endDate}T00:00:00`);
  const diffMs = end.getTime() - start.getTime();
  return Math.max(1, Math.round(diffMs / (365.25 * 24 * 60 * 60 * 1000)));
});

function setServiceYears(years: number): void {
  const safe = clampInt(years, 1, 40);
  const end = new Date(`${props.endDate}T00:00:00`);
  const start = new Date(end);
  start.setFullYear(start.getFullYear() - safe);
  const newStart = toDateInput(start);
  emit("update:startDate", newStart);
  emit("range-apply", { startDate: newStart, endDate: props.endDate });
}

const quickYears = [1, 3, 5, 7, 10, 15, 20];

// ── 캘린더 모달 ──
type ActiveField = "start" | "end";
const isCalendarOpen = ref(false);
const activeField = ref<ActiveField>("start");
const viewMonth = ref(startOfMonth(new Date()));
const dayHeaders = ["일", "월", "화", "수", "목", "금", "토"] as const;
const todayInput = toDateInput(new Date());

interface CalendarCell {
  value: string;
  day: number;
  inCurrentMonth: boolean;
  disabled: boolean;
}

function parseDateInput(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [yy, mm, dd] = value.split("-");
  const y = Number.parseInt(yy, 10);
  const m = Number.parseInt(mm, 10);
  const d = Number.parseInt(dd, 10);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

const monthLabel = computed(() => {
  const year = viewMonth.value.getFullYear();
  const month = `${viewMonth.value.getMonth() + 1}`.padStart(2, "0");
  return `${year}.${month}`;
});

const calendarCells = computed<CalendarCell[]>(() => {
  const firstDay = startOfMonth(viewMonth.value);
  const offset = firstDay.getDay();
  const gridStart = addDays(firstDay, -offset);
  const currentMonth = firstDay.getMonth();

  return Array.from({ length: 42 }, (_, i) => {
    const date = addDays(gridStart, i);
    const value = toDateInput(date);
    return {
      value,
      day: date.getDate(),
      inCurrentMonth: date.getMonth() === currentMonth,
      disabled: isDateDisabled(value),
    };
  });
});

function isDateDisabled(value: string): boolean {
  if (activeField.value === "start") return value > props.endDate;
  return value < props.startDate;
}

function isToday(value: string): boolean {
  return value === todayInput;
}

function isSelectedEdge(value: string): boolean {
  return value === props.startDate || value === props.endDate;
}

function isInSelectedRange(value: string): boolean {
  return value > props.startDate && value < props.endDate;
}

function openCalendar(field: ActiveField): void {
  activeField.value = field;
  const baseDate = parseDateInput(field === "start" ? props.startDate : props.endDate) ?? new Date();
  viewMonth.value = startOfMonth(baseDate);
  isCalendarOpen.value = true;
}

function closeCalendar(): void {
  isCalendarOpen.value = false;
}

function moveMonth(step: number): void {
  viewMonth.value = new Date(
    viewMonth.value.getFullYear(),
    viewMonth.value.getMonth() + step,
    1,
  );
}

function selectDate(value: string): void {
  if (isDateDisabled(value)) return;

  if (activeField.value === "start") {
    emit("update:startDate", value);
    emit("range-apply", { startDate: value, endDate: props.endDate });
  } else {
    emit("update:endDate", value);
    emit("range-apply", { startDate: props.startDate, endDate: value });
  }

  closeCalendar();
}

// ── 금액 입력 ──
const formattedSalary = computed(() => formatNumber(props.monthlySalary));
const formattedNonTax = computed(() => formatNumber(props.nonTaxableMonthly));
const formattedBonus = computed(() => formatNumber(props.annualBonus));
const formattedLivingCost = computed(() => formatNumber(props.monthlyLivingCost));

function onSalaryInput(event: Event): void {
  const raw = (event.target as HTMLInputElement).value.replace(/[^0-9]/g, "");
  const value = parseInt(raw, 10);
  if (Number.isFinite(value)) {
    emit("update:monthlySalary", clampInt(value, 1_000_000, 100_000_000));
  }
}

function onNonTaxInput(event: Event): void {
  const raw = (event.target as HTMLInputElement).value.replace(/[^0-9]/g, "");
  const value = parseInt(raw, 10);
  if (Number.isFinite(value)) {
    emit("update:nonTaxableMonthly", clampInt(value, 0, 5_000_000));
  }
}

function onBonusInput(event: Event): void {
  const raw = (event.target as HTMLInputElement).value.replace(/[^0-9]/g, "");
  const value = parseInt(raw, 10);
  if (Number.isFinite(value)) {
    emit("update:annualBonus", clampInt(value, 0, 1_000_000_000));
  }
}

function onLivingCostInput(event: Event): void {
  const raw = (event.target as HTMLInputElement).value.replace(/[^0-9]/g, "");
  const value = parseInt(raw, 10);
  if (Number.isFinite(value)) {
    emit("update:monthlyLivingCost", clampInt(value, 1_000_000, 100_000_000));
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

function onSalaryRangeInput(event: Event): void {
  const value = parseInt((event.target as HTMLInputElement).value, 10);
  if (Number.isFinite(value)) {
    emit("update:monthlySalary", value);
  }
}

const inputIds = {
  monthlySalary: "quit-monthly-salary",
  monthlySalaryRange: "quit-monthly-salary-range",
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
    </div>

    <div class="retro-panel-content space-y-4">
      <div class="space-y-2">
        <span class="text-caption font-semibold text-foreground">근속 기간</span>
        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            class="retro-input px-3 py-2 text-left transition-colors hover:border-primary/60"
            @click="openCalendar('start')"
          >
            <p class="text-tiny font-medium text-foreground/70">시작일</p>
            <p class="text-caption font-semibold tabular-nums">{{ formatDotDate(startDate) }}</p>
          </button>
          <button
            type="button"
            class="retro-input px-3 py-2 text-left transition-colors hover:border-primary/60"
            @click="openCalendar('end')"
          >
            <p class="text-tiny font-medium text-foreground/70">종료일</p>
            <p class="text-caption font-semibold tabular-nums">{{ formatDotDate(endDate) }}</p>
          </button>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="y in quickYears"
            :key="y"
            type="button"
            class="touch-target rounded-lg border border-border/60 bg-muted/20 px-2.5 py-1 text-caption font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
            :class="serviceYears === y ? 'border-primary bg-primary/10 text-primary' : ''"
            @click="setServiceYears(y)"
          >
            {{ y }}년
          </button>
        </div>
      </div>

      <div>
        <label :for="inputIds.monthlySalary" class="mb-0.5 block text-caption font-semibold text-foreground">
          월급 (세전, 원)
        </label>
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="touch-target flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-lg font-bold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              aria-label="10만원 감소"
              @click="emit('update:monthlySalary', Math.max(1_000_000, monthlySalary - 100_000))"
            >
              −
            </button>
            <input
              :id="inputIds.monthlySalary"
              :value="formattedSalary"
              type="text"
              inputmode="numeric"
              class="retro-input min-w-0 flex-1 text-center text-heading font-bold tabular-nums"
              @input="onSalaryInput"
            />
            <button
              type="button"
              class="touch-target flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-lg font-bold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              aria-label="10만원 증가"
              @click="emit('update:monthlySalary', Math.min(100_000_000, monthlySalary + 100_000))"
            >
              +
            </button>
          </div>
          <input
            :id="inputIds.monthlySalaryRange"
            :value="monthlySalary"
            type="range"
            min="1000000"
            max="20000000"
            step="100000"
            class="retro-range"
            aria-label="월급 슬라이더"
            @input="onSalaryRangeInput"
          />
        </div>
      </div>

      <div>
        <span class="mb-1.5 block text-caption font-semibold text-foreground">퇴사 사유</span>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="option in ([
              { value: 'layoff', label: '권고사직' },
              { value: 'dismissal', label: '해고' },
              { value: 'contract_end', label: '계약만료' },
              { value: 'voluntary', label: '자발적 퇴사' },
            ] as const)"
            :key="option.value"
            type="button"
            class="touch-target rounded-xl border px-3 py-1.5 text-caption font-semibold transition-colors"
            :class="quitReason === option.value ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:text-foreground'"
            @click="emit('update:quitReason', option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <details class="retro-details">
        <summary class="retro-details-summary">
          <span>상세 설정 보기</span>
          <span class="retro-details-chevron" aria-hidden="true">▾</span>
        </summary>
        <div class="grid grid-cols-1 gap-3 p-3 sm:grid-cols-3">
          <label class="space-y-1" :for="inputIds.nonTaxableMonthly">
            <span class="text-caption text-muted-foreground">비과세(원/월)</span>
            <input :id="inputIds.nonTaxableMonthly" :value="formattedNonTax" type="text" inputmode="numeric" class="retro-input tabular-nums" @input="onNonTaxInput" />
          </label>
          <label class="space-y-1" :for="inputIds.age">
            <span class="text-caption text-muted-foreground">나이</span>
            <input :id="inputIds.age" :value="age" type="number" min="20" max="80" inputmode="numeric" class="retro-input" @input="emit('update:age', clampInt(parseInt(($event.target as HTMLInputElement).value, 10), 20, 80))" />
          </label>
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
            <span class="text-caption text-muted-foreground">연간 상여금(원)</span>
            <input :id="inputIds.annualBonus" :value="formattedBonus" type="text" inputmode="numeric" class="retro-input tabular-nums" @input="onBonusInput" />
          </label>
          <label class="space-y-1" :for="inputIds.monthlyLivingCost">
            <span class="text-caption text-muted-foreground">월 생활비(원)</span>
            <input :id="inputIds.monthlyLivingCost" :value="formattedLivingCost" type="text" inputmode="numeric" class="retro-input tabular-nums" @input="onLivingCostInput" />
          </label>
        </div>
      </details>
    </div>

    <!-- 캘린더 모달 -->
    <Teleport to="body">
      <div
        v-if="isCalendarOpen"
        class="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4"
        @click.self="closeCalendar"
      >
        <section
          class="w-full max-w-sm rounded-xl border border-border bg-card p-3 shadow-lg"
          role="dialog"
          aria-modal="true"
          :aria-label="activeField === 'start' ? '시작일 달력' : '종료일 달력'"
        >
          <div class="mb-3 flex items-center justify-between">
            <button
              type="button"
              class="retro-button-subtle"
              aria-label="이전 달 보기"
              @click="moveMonth(-1)"
            >
              이전
            </button>
            <p class="text-caption font-semibold tabular-nums">{{ monthLabel }}</p>
            <button
              type="button"
              class="retro-button-subtle"
              aria-label="다음 달 보기"
              @click="moveMonth(1)"
            >
              다음
            </button>
          </div>

          <div class="mb-1 grid grid-cols-7 gap-1 text-center text-tiny text-muted-foreground">
            <span v-for="header in dayHeaders" :key="header">{{ header }}</span>
          </div>

          <div class="grid grid-cols-7 gap-1">
            <button
              v-for="cell in calendarCells"
              :key="cell.value"
              type="button"
              class="h-9 rounded-md text-caption tabular-nums transition-colors"
              :class="[
                cell.inCurrentMonth ? 'text-foreground' : 'text-muted-foreground/50',
                isSelectedEdge(cell.value) ? 'bg-primary text-primary-foreground font-semibold' : '',
                !isSelectedEdge(cell.value) && isInSelectedRange(cell.value) ? 'bg-primary/15 text-foreground' : '',
                !isSelectedEdge(cell.value) && isToday(cell.value) ? 'ring-1 ring-primary/70' : '',
                cell.disabled ? 'cursor-not-allowed opacity-35' : 'hover:bg-accent/50',
              ]"
              :disabled="cell.disabled"
              :aria-label="`${formatDotDate(cell.value)} 선택`"
              @click="selectDate(cell.value)"
            >
              {{ cell.day }}
            </button>
          </div>
        </section>
      </div>
    </Teleport>
  </section>
</template>
