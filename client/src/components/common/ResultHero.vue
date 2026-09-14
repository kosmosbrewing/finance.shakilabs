<script setup lang="ts">
// Single grammar for every calculator's primary result (docs: RESULT_DESIGN_BACKLOG):
// label above (13px muted) -> amount (text-display, brand color, tabular-nums)
// -> optional secondary line (14px muted), all centered inside the white panel.
// Brand color is reserved for this hero amount only; stat-grid values stay neutral.
//
// Count-up animation lives HERE and only here (gate: resultHeroGrammar.test.ts).
// Views must never ship a local rAF copy - one implementation serves all 26
// calculators uniformly. Rules (v3 design system 8.6):
//  - the ONLY trigger is the formatted value string changing. Load, hydration,
//    theme toggle, resize and a recalculation landing on the same number must
//    not re-run the count.
//  - displayValue initializes to the FINAL formatted value, so prerendered HTML
//    and the first client render both show the finished number (never 0).
//  - prop change: previous displayed number -> new value; 700ms ease-out. An
//    interrupted run continues from what is on screen, it does not reset to 0.
//  - prefers-reduced-motion: no animation, final value immediately.
//  - non-numeric values (e.g. eligibility verdict text) stay static.
//
// Why the mount animation was removed (BL-020, measured 2026-09-14): onMounted
// used to animate 0 -> value, so every page load and every hydration re-ran the
// count. On /finance/salary the hero painted the final 2,924,335 and then
// dropped to -121,973 and climbed back - 84 distinct strings in one load. On
// /finance/compare the pass-through "+" prefix made it read "+-13,841" mid-run.
import { onBeforeUnmount, ref, watch } from "vue";

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
    const progress = Math.min(1, (now - start) / DURATION_MS);
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
// continue from the screen. No animation here: the first paint is already final.
liveNumbers = numbersOf(tokenize(props.value));

watch(
  () => props.value,
  (next, previous) => {
    // Same formatted string -> nothing visibly changed -> no animation (8.6).
    if (next === previous) return;
    animateTo(next, liveNumbers ?? []);
  }
);

onBeforeUnmount(cancelRaf);
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
