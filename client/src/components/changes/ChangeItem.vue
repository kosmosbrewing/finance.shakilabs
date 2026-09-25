<script setup lang="ts">
// 2027년 달라지는 항목 한 줄 — 제목·상태 → 한 문장 → 현행/2027 숫자 → 대상·시행 → (접힘) 세부·근거.
// 글자는 레지스트리 문자열을 그대로 쓴다: 프리렌더(scripts/prerender-changes.mjs)와 문장이 같아야
// verify-hydration-survival이 통과한다. 여기서 문구를 새로 만들지 않는다.
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { ShBadge } from "@shakilabs/ui";
import {
  CHANGE_SOURCES,
  CHANGE_STATUSES,
  changeCalcHref,
  formatChangeDate,
  type Change2027Item,
} from "../../../scripts/changes-2027.mjs";

const props = defineProps<{ item: Change2027Item }>();

const status = computed(() => CHANGE_STATUSES[props.item.status]);
const source = computed(() => CHANGE_SOURCES[props.item.source]);
const href = computed(() => changeCalcHref(props.item));
const isInternal = computed(() => href.value?.startsWith("/") ?? false);
</script>

<template>
  <li :id="item.id" class="scroll-mt-28 space-y-3 px-4 py-4 sm:px-5">
    <div class="flex flex-wrap items-center gap-2">
      <h3 class="text-body font-bold text-foreground">{{ item.title }}</h3>
      <ShBadge :tone="status.tone">{{ status.label }}</ShBadge>
    </div>
    <p class="text-caption text-foreground">{{ item.line }}</p>

    <dl class="grid gap-2 sm:grid-cols-2">
      <div class="retro-panel-muted px-3 py-2.5">
        <dt class="text-tiny font-semibold text-muted-foreground">현행</dt>
        <dd class="mt-0.5 text-caption text-foreground">{{ item.before }}</dd>
      </div>
      <div class="retro-panel-muted change-after px-3 py-2.5">
        <dt class="text-tiny font-semibold text-muted-foreground">2027</dt>
        <dd class="mt-0.5 text-caption font-semibold text-foreground">{{ item.after }}</dd>
      </div>
    </dl>

    <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-tiny sm:grid-cols-[auto_1fr_auto_1fr]">
      <dt class="font-semibold text-muted-foreground">대상</dt>
      <dd class="text-foreground">{{ item.target }}</dd>
      <dt class="font-semibold text-muted-foreground">시행</dt>
      <dd class="text-foreground">{{ item.effective }}</dd>
    </dl>

    <div class="flex flex-wrap items-center justify-between gap-2">
      <details class="change-details text-tiny text-muted-foreground">
        <summary class="cursor-pointer font-semibold">근거{{ item.details?.length ? "·세부" : "" }}</summary>
        <ul v-if="item.details?.length" class="mt-2 list-disc space-y-1 pl-4">
          <li v-for="detail in item.details" :key="detail">{{ detail }}</li>
        </ul>
        <p class="mt-2">근거: <a :href="source.url" target="_blank" rel="noopener" class="text-link underline">{{ source.title }}</a> ({{ formatChangeDate(source.date) }})</p>
      </details>
      <template v-if="href && item.calc">
        <RouterLink v-if="isInternal" :to="href" class="text-caption font-semibold text-link">{{ item.calc.label }} →</RouterLink>
        <a v-else :href="href" class="text-caption font-semibold text-link">{{ item.calc.label }} →</a>
      </template>
    </div>
  </li>
</template>

<style scoped>
/* 2027 칸만 옅게 구분 — box-shadow는 디자인 시스템이 전역으로 끄므로 배경 틴트로 준다.
   의미색(성공·위험)이 아니라 브랜드색 7%라 "좋아진다/나빠진다"로 읽히지 않는다. */
.change-after.retro-panel-muted {
  background-color: hsl(var(--primary) / 0.07);
}
.change-details summary::-webkit-details-marker {
  margin-right: 0.25rem;
}
</style>
