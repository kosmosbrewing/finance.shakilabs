<script setup lang="ts">
// 앱 로컬 광고 슬롯 — 유닛 원장(src/config/adUnits.ts)과 공용 ShAdSlot 사이의
// 얇은 래퍼.
//
// 왜 래퍼를 남기는가: 뷰 21곳의 호출부가 `<AdSlot unit="salary-top" />` 한
// 형태를 유지하면, provider가 바뀌든 태그 모양이 바뀌든 호출부는 손대지 않는다.
// 0.3.10 차트 승격 때 "얇은 크롬 래퍼"로 호출부 0건을 고친 것과 같은 패턴이다.
//
// 개발 모드 자리표시자도 여기 남는다 — 한글이 들어가므로 패키지로 올릴 수 없다
// (일부 앱의 폰트 서브셋 스캐너가 node_modules를 보지 않는다).
import { computed } from "vue";
import { ShAdSlot } from "@shakilabs/ui";

import {
  adProvider,
  adUnits,
  adsensePublisherId,
  unitIdFor,
  type AdUnitKey,
} from "@/config/adUnits";

const props = defineProps<{
  unit: AdUnitKey;
  label?: string;
}>();

const isDev = import.meta.env.DEV;
const unitId = computed(() => unitIdFor(props.unit));
const size = computed(() => adUnits[props.unit].adfitSize);

// 슬롯이 실제로 그려지는지 — provider가 none이거나 이 슬롯의 유닛 ID가 아직
// 비어 있으면 ShAdSlot이 아무것도 렌더하지 않는다. 개발 모드 자리표시자는
// 그때만 나온다.
const willRender = computed(
  () =>
    Boolean(unitId.value) &&
    (adProvider === "adfit" || (adProvider === "adsense" && Boolean(adsensePublisherId))),
);
</script>

<template>
  <ShAdSlot
    v-if="willRender"
    :provider="adProvider"
    :unit-id="unitId"
    :client-id="adsensePublisherId"
    :width="size[0]"
    :height="size[1]"
    :label="label"
  />
  <section
    v-else-if="isDev"
    class="retro-panel p-3"
  >
    <p class="mb-2 text-caption text-muted-foreground">{{ label || "광고 영역" }}</p>
    <div
      class="flex min-h-[96px] items-center justify-center rounded-lg border border-dashed border-border/60 text-caption text-muted-foreground"
    >
      광고 영역 (개발 모드 · provider={{ adProvider }})
    </div>
  </section>
</template>
