<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";

const props = defineProps<{
  current: "insurance" | "salary" | "compare" | "quit";
}>();

const suggestions = computed(() => {
  if (props.current === "insurance") {
    return [
      { to: "/salary", label: "정확한 실수령액 계산", desc: "역산 결과를 실수령으로 검증" },
      { to: "/compare", label: "이직 제안 비교", desc: "A사/B사 실수령 차이 확인" },
      { to: "/quit", label: "퇴사 시뮬레이션", desc: "퇴직금/실업급여까지 계산" },
    ];
  }

  if (props.current === "salary") {
    return [
      { to: "/compare", label: "이직 연봉 비교", desc: "두 회사 조건을 나란히 비교" },
      { to: "/quit", label: "퇴사 시뮬레이션", desc: "퇴사 후 자금 버티기 계산" },
      { to: "/insurance", label: "건보료 역산", desc: "건보료로 연봉 빠르게 추정" },
    ];
  }

  if (props.current === "compare") {
    return [
      { to: "/quit", label: "퇴사 시뮬레이션", desc: "퇴사 시 받는 돈/내는 돈 계산" },
      { to: "/insurance", label: "건보료 역산", desc: "현재 조건의 보험료 기준 확인" },
      { to: "/salary", label: "단일 실수령 계산", desc: "회사별 입력값 개별 점검" },
    ];
  }

  return [
    { to: "/insurance", label: "건보료 역산", desc: "퇴사 후 보험료 감 잡기" },
    { to: "/salary", label: "실수령액 계산", desc: "재취업 조건 실수령 검토" },
    { to: "/compare", label: "이직 연봉 비교", desc: "오퍼 간 체감차이 계산" },
  ];
});
</script>

<template>
  <section class="retro-panel border border-border/70 p-4">
    <h2 class="text-body font-semibold">다음 계산으로 이어보기</h2>
    <div class="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
      <RouterLink
        v-for="item in suggestions"
        :key="item.to"
        :to="item.to"
        class="border border-border/60 bg-muted/20 px-3 py-2 transition-colors hover:border-primary/50 hover:bg-primary/5"
      >
        <p class="text-body font-semibold text-foreground">{{ item.label }}</p>
        <p class="mt-0.5 text-caption text-muted-foreground">{{ item.desc }}</p>
      </RouterLink>
    </div>
  </section>
</template>
