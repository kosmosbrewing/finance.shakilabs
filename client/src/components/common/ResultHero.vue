<script setup lang="ts">
// Single grammar for every calculator's primary result (docs: RESULT_DESIGN_BACKLOG):
// label above (13px muted) -> amount (text-display, brand color, tabular-nums)
// -> optional secondary line (14px muted), all centered inside the white panel.
// Brand color is reserved for this hero amount only; stat-grid values stay neutral.
//
// Count-up animation lives HERE and only here (gate: resultHeroGrammar.test.ts).
// Views must never ship a local rAF copy - one implementation serves all 26
// calculators uniformly. Rules (v3 design system 8.6):
//  - triggers: (1) page load, once, starting from 0; (2) the formatted value
//    string changing. Theme toggle, resize and a recalculation landing on the
//    same number must not re-run the count.
//  - displayValue initializes to the FINAL formatted value, so prerendered HTML
//    and the first client render both show the finished number (never 0).
//  - prop change: previous displayed number -> new value; 700ms ease-out. An
//    interrupted run continues from what is on screen, it does not reset to 0.
//  - prefers-reduced-motion: no animation, final value immediately.
//  - non-numeric values (e.g. eligibility verdict text) stay static.
//
// The mount animation was removed in BL-020 because it collided with the
// post-hydration recalculation: /finance/salary showed -121,973 mid-run and
// /finance/compare read "+-13,841". It is back by request, but deferred by one
// frame so the value settles first - the anomalies above are asserted against
// in the render test.
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps<{
  label: string;
  value: string;
}>();

const displayValue = ref(props.value);

const DURATION_MS = 700;
let rafId: number | null = null;
// numbers currently painted, so a mid-animation prop change continues smoothly
let liveNumbers: number[] | null = null;

type Part = { text: string } | { value: number; decimals: number; grouped: boolean };

// "3,456,789원" -> [{value: 3456789, ...}, {text: "원"}]; every numeric run in
// the string animates proportionally, prefixes/suffixes/signs pass through.
function tokenize(text: string): Part[] {
  const parts: Part[] = [];
  let last = 0;
  for (const match of text.matchAll(/\d[\d,]*(?:\.\d+)?/g)) {
    const index = match.index ?? 0;
    if (index > last) parts.push({ text: text.slice(last, index) });
    const raw = match[0];
    parts.push({
      value: Number(raw.replace(/,/g, "")),
      decimals: raw.includes(".") ? raw.split(".")[1].length : 0,
      grouped: raw.includes(","),
    });
    last = index + raw.length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

function numbersOf(parts: Part[]): number[] {
  return parts.filter((p): p is Exclude<Part, { text: string }> => "value" in p).map((p) => p.value);
}

function formatRun(value: number, part: { decimals: number; grouped: boolean }): string {
  const fixed = part.decimals > 0 ? value.toFixed(part.decimals) : String(Math.round(value));
  if (!part.grouped) return fixed;
  const [intPart, fracPart] = fixed.split(".");
  const grouped = Number(intPart).toLocaleString("ko-KR");
  return fracPart ? `${grouped}.${fracPart}` : grouped;
}

function renderParts(parts: Part[], numbers: number[]): string {
  let i = 0;
  return parts.map((p) => ("text" in p ? p.text : formatRun(numbers[i++], p))).join("");
}

function prefersReducedMotion(): boolean {
  return (
    typeof window === "undefined" ||
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

function cancelRaf(): void {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

function animateTo(finalText: string, from: number[]): void {
  cancelRaf();
  const parts = tokenize(finalText);
  const targets = numbersOf(parts);
  if (targets.length === 0 || from.length !== targets.length || prefersReducedMotion()) {
    liveNumbers = targets;
    displayValue.value = finalText;
    return;
  }
  const start = performance.now();
  const step = (now: number): void => {
    // rAF 콜백의 타임스탬프는 **프레임 시작 시각**이라 직전에 찍은 performance.now()보다
    // 이를 수 있다. 하한을 안 걸면 progress가 음수가 되고 ease-out 곡선이 음수를 돌려줘
    // 첫 프레임에 `-24,127원`처럼 부호가 뒤집힌 값이 스친다(실측으로 확인).
    const progress = Math.min(1, Math.max(0, (now - start) / DURATION_MS));
    const eased = 1 - (1 - progress) ** 3; // ease-out cubic
    if (progress < 1) {
      liveNumbers = targets.map((t, i) => from[i] + (t - from[i]) * eased);
      displayValue.value = renderParts(parts, liveNumbers);
      rafId = requestAnimationFrame(step);
      return;
    }
    liveNumbers = targets;
    displayValue.value = finalText; // exact final string, no formatting drift
    rafId = null;
  };
  rafId = requestAnimationFrame(step);
}

// Seed the painted numbers from the first value so an interrupted animation can
// continue from the screen. The first paint stays final (prerendered HTML and the
// SSR markup must match); the load animation starts after mount.
liveNumbers = numbersOf(tokenize(props.value));

// 로드할 때마다 0에서 올라온다.
//
// BL-020에서 마운트 애니메이션을 뺀 이유는 "0부터 센다" 자체가 아니라 **값이 아직
// 확정되지 않았다**는 것이었다. 하이드레이션 직후 계산기가 한 번 더 계산하는 라우트가
// 있어서, 애니메이션이 그 과도 값을 향해 달려가면 최종이 양수인데 중간에 음수가 스치고
// (`-93,727원`) 통과 문자 "+"와 겹쳐 `+-9,390원`처럼 읽혔다. 재현으로 확인했다.
//
// 그래서 **값이 조용해진 뒤에** 시작한다. 값이 바뀔 때마다 타이머를 다시 걸고,
// SETTLE_MS 동안 변화가 없으면 그때 0에서 최종값으로 한 번 센다.
// 그 전까지는 애니메이션 없이 즉시 표시해 과도 값이 화면에 머물지 않게 한다.
const SETTLE_MS = 220;
let loadAnimationDone = false;
let settleTimer: ReturnType<typeof setTimeout> | null = null;

function clearSettleTimer(): void {
  if (settleTimer !== null) {
    clearTimeout(settleTimer);
    settleTimer = null;
  }
}

function armLoadAnimation(): void {
  clearSettleTimer();
  settleTimer = setTimeout(() => {
    settleTimer = null;
    if (loadAnimationDone) return;
    loadAnimationDone = true;
    const targets = numbersOf(tokenize(props.value));
    if (targets.length === 0) return;
    animateTo(
      props.value,
      targets.map(() => 0),
    );
  }, SETTLE_MS);
}

onMounted(() => {
  if (prefersReducedMotion()) {
    loadAnimationDone = true;
    return;
  }
  armLoadAnimation();
});

watch(
  () => props.value,
  (next, previous) => {
    // Same formatted string -> nothing visibly changed -> no animation (8.6).
    if (next === previous) return;
    if (!loadAnimationDone) {
      // 아직 값이 확정되지 않았다. 과도 값을 향해 세지 않고 즉시 표시만 하고,
      // 조용해질 때까지 로드 애니메이션을 미룬다.
      cancelRaf();
      liveNumbers = numbersOf(tokenize(next));
      displayValue.value = next;
      armLoadAnimation();
      return;
    }
    animateTo(next, liveNumbers ?? []);
  }
);

onBeforeUnmount(() => {
  cancelRaf();
  clearSettleTimer();
});
</script>

<template>
  <div data-result-hero class="text-center py-3">
    <p class="text-caption uppercase tracking-wide text-muted-foreground mb-1">{{ label }}</p>
    <p class="text-display font-bold font-title text-primary tabular-nums">{{ displayValue }}</p>
    <p v-if="$slots.secondary" class="text-body text-muted-foreground mt-1.5">
      <slot name="secondary" />
    </p>
  </div>
</template>
