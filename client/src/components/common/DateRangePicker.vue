<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";

type ActiveField = "start" | "end";

interface DateRange {
  startDate: string;
  endDate: string;
}

interface CalendarCell {
  value: string;
  day: number;
  inCurrentMonth: boolean;
  disabled: boolean;
}

const props = defineProps<{
  startDate: string;
  endDate: string;
}>();

const emit = defineEmits<{
  apply: [range: DateRange];
}>();

const dayHeaders = ["일", "월", "화", "수", "목", "금", "토"] as const;

const isPanelOpen = ref(false);
const isCalendarOpen = ref(false);
const activeField = ref<ActiveField>("start");
const draftStartDate = ref(props.startDate);
const draftEndDate = ref(props.endDate);
const viewMonth = ref(startOfMonth(parseDateInput(props.endDate) ?? new Date()));

watch(
  () => [props.startDate, props.endDate],
  ([nextStart, nextEnd]) => {
    if (isPanelOpen.value) return;
    draftStartDate.value = nextStart;
    draftEndDate.value = nextEnd;
  }
);

const todayInput = toDateInput(new Date());

const appliedRangeLabel = computed(
  () => `${formatDotDate(props.startDate)} ~ ${formatDotDate(props.endDate)}`
);

const monthLabel = computed(() => {
  const year = viewMonth.value.getFullYear();
  const month = `${viewMonth.value.getMonth() + 1}`.padStart(2, "0");
  return `${year}.${month}`;
});

const isRangeValid = computed(
  () =>
    isDateInputValid(draftStartDate.value) &&
    isDateInputValid(draftEndDate.value) &&
    draftStartDate.value <= draftEndDate.value
);

const canApply = computed(
  () =>
    isRangeValid.value &&
    (draftStartDate.value !== props.startDate ||
      draftEndDate.value !== props.endDate)
);

const calendarCells = computed<CalendarCell[]>(() => {
  const firstDay = startOfMonth(viewMonth.value);
  const offset = firstDay.getDay();
  const gridStart = addDays(firstDay, -offset);
  const currentMonth = firstDay.getMonth();

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index);
    const value = toDateInput(date);
    return {
      value,
      day: date.getDate(),
      inCurrentMonth: date.getMonth() === currentMonth,
      disabled: isDateDisabled(value),
    };
  });
});

function parseDateInput(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [yearText, monthText, dayText] = value.split("-");
  const year = Number.parseInt(yearText, 10);
  const month = Number.parseInt(monthText, 10);
  const day = Number.parseInt(dayText, 10);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function isDateInputValid(value: string): boolean {
  return parseDateInput(value) !== null;
}

function toDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDotDate(value: string): string {
  const parsed = parseDateInput(value);
  if (!parsed) return value;
  const year = parsed.getFullYear();
  const month = `${parsed.getMonth() + 1}`.padStart(2, "0");
  const day = `${parsed.getDate()}`.padStart(2, "0");
  return `${year}.${month}.${day}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function today(): Date {
  return parseDateInput(todayInput) ?? new Date();
}

function updateViewMonth(baseInput: string): void {
  const base = parseDateInput(baseInput) ?? today();
  viewMonth.value = startOfMonth(base);
}

function openPanel(): void {
  draftStartDate.value = props.startDate;
  draftEndDate.value = props.endDate;
  isPanelOpen.value = true;
  isCalendarOpen.value = false;
}

function closePanel(): void {
  isPanelOpen.value = false;
  isCalendarOpen.value = false;
}

function togglePanel(): void {
  if (isPanelOpen.value) {
    closePanel();
    return;
  }
  openPanel();
}

function openCalendar(field: ActiveField): void {
  activeField.value = field;
  isCalendarOpen.value = true;
  updateViewMonth(field === "start" ? draftStartDate.value : draftEndDate.value);
}

function closeCalendar(): void {
  isCalendarOpen.value = false;
}

function moveMonth(step: number): void {
  viewMonth.value = new Date(
    viewMonth.value.getFullYear(),
    viewMonth.value.getMonth() + step,
    1
  );
}

function isDateDisabled(value: string): boolean {
  if (!isDateInputValid(value) || !isRangeValid.value) return false;
  if (activeField.value === "start") {
    return value > draftEndDate.value;
  }
  return value < draftStartDate.value;
}

function isToday(value: string): boolean {
  return value === todayInput;
}

function isSelectedEdge(value: string): boolean {
  return value === draftStartDate.value || value === draftEndDate.value;
}

function isInSelectedRange(value: string): boolean {
  return value > draftStartDate.value && value < draftEndDate.value;
}

function selectDate(value: string): void {
  if (isDateDisabled(value)) return;

  if (activeField.value === "start") {
    draftStartDate.value = value;
  } else {
    draftEndDate.value = value;
  }

  closeCalendar();
}

function applyQuickRange(type: "today" | "last7" | "last30" | "thisMonth"): void {
  const base = today();
  const end = toDateInput(base);

  if (type === "today") {
    draftStartDate.value = end;
    draftEndDate.value = end;
    updateViewMonth(end);
    return;
  }

  if (type === "last7") {
    draftStartDate.value = toDateInput(addDays(base, -6));
    draftEndDate.value = end;
    updateViewMonth(draftStartDate.value);
    return;
  }

  if (type === "last30") {
    draftStartDate.value = toDateInput(addDays(base, -29));
    draftEndDate.value = end;
    updateViewMonth(draftStartDate.value);
    return;
  }

  const monthStart = new Date(base.getFullYear(), base.getMonth(), 1);
  draftStartDate.value = toDateInput(monthStart);
  draftEndDate.value = end;
  updateViewMonth(draftStartDate.value);
}

function resetDraft(): void {
  applyQuickRange("last30");
}

function applyDraft(): void {
  if (!isRangeValid.value) return;
  emit("apply", {
    startDate: draftStartDate.value,
    endDate: draftEndDate.value,
  });
  closePanel();
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key !== "Escape") return;
  if (isCalendarOpen.value) {
    closeCalendar();
    return;
  }
  if (isPanelOpen.value) {
    closePanel();
  }
}

watch(
  () => isPanelOpen.value || isCalendarOpen.value,
  (isOpen, wasOpen) => {
    if (typeof window === "undefined" || isOpen === wasOpen) return;
    if (isOpen) {
      window.addEventListener("keydown", onKeydown);
      return;
    }
    window.removeEventListener("keydown", onKeydown);
  }
);

onUnmounted(() => {
  window.removeEventListener("keydown", onKeydown);
});
</script>

<template>
  <div class="space-y-2">
    <button
      type="button"
      class="retro-input flex items-center justify-between gap-2 text-left"
      aria-label="기간 선택 열기"
      @click="togglePanel"
    >
      <span class="truncate">{{ appliedRangeLabel }}</span>
      <span class="text-tiny text-muted-foreground">{{ isPanelOpen ? "닫기" : "선택" }}</span>
    </button>

    <section
      v-if="isPanelOpen"
      class="space-y-3 rounded-xl border border-border/70 bg-card p-3"
      aria-label="기간 선택 패널"
    >
      <div class="grid grid-cols-2 gap-2">
        <button
          type="button"
          class="rounded-lg border border-border/70 bg-background px-3 py-2 text-left transition-colors hover:border-primary/60"
          aria-label="시작일 선택"
          @click="openCalendar('start')"
        >
          <p class="text-tiny text-muted-foreground">시작일</p>
          <p class="text-caption font-semibold tabular-nums">{{ formatDotDate(draftStartDate) }}</p>
        </button>
        <button
          type="button"
          class="rounded-lg border border-border/70 bg-background px-3 py-2 text-left transition-colors hover:border-primary/60"
          aria-label="종료일 선택"
          @click="openCalendar('end')"
        >
          <p class="text-tiny text-muted-foreground">종료일</p>
          <p class="text-caption font-semibold tabular-nums">{{ formatDotDate(draftEndDate) }}</p>
        </button>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="retro-button-subtle"
          aria-label="오늘 빠른 선택"
          @click="applyQuickRange('today')"
        >
          오늘
        </button>
        <button
          type="button"
          class="retro-button-subtle"
          aria-label="최근 7일 빠른 선택"
          @click="applyQuickRange('last7')"
        >
          최근 7일
        </button>
        <button
          type="button"
          class="retro-button-subtle"
          aria-label="최근 30일 빠른 선택"
          @click="applyQuickRange('last30')"
        >
          최근 30일
        </button>
        <button
          type="button"
          class="retro-button-subtle"
          aria-label="이번 달 빠른 선택"
          @click="applyQuickRange('thisMonth')"
        >
          이번 달
        </button>
      </div>

      <div class="flex items-center justify-end gap-2">
        <button type="button" class="retro-button-subtle" aria-label="선택값 초기화" @click="resetDraft">
          초기화
        </button>
        <button type="button" class="retro-button-subtle" aria-label="기간 패널 닫기" @click="closePanel">
          닫기
        </button>
        <button
          type="button"
          class="retro-button disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!canApply"
          aria-label="선택한 기간 적용"
          @click="applyDraft"
        >
          적용
        </button>
      </div>
    </section>

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
  </div>
</template>
