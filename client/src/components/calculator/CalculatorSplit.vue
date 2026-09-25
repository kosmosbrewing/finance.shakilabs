<script setup lang="ts">
// 계산기 화면 공통 1×2 틀: 데스크톱(lg+)에서 입력 | 결과를 나란히 둔다 (홈 건보료 계산기와 같은 구조).
//
// 왜: 옛 틀은 "본문 + 340px 우측 레일"이었는데 레일에는 피드백 위젯뿐이라, 입력 패널 아래로
// 밀린 결과 숫자가 1440px 화면에서도 첫 화면 밖(y≈700)에 있었다. 나란히 두면 입력을 바꾸는 즉시
// 옆에서 결과가 움직인다. 모바일은 DOM 순서대로 입력 → 결과 → below-input으로 쌓인다.
//
// below-input: 결과가 입력보다 훨씬 긴 화면에서 왼쪽 빈칸을 채우는 보조 블록(다음 계산 추천 등).
// 모바일에서 결과보다 앞에 오면 안 되므로 DOM은 결과 뒤에 두고, 데스크톱에서만 왼쪽 2행으로 올린다.
// 행 템플릿이 auto_1fr인 이유: 결과(2행 걸침)의 남는 높이가 1fr 행으로만 가서 입력과 보조 블록
// 사이에 틈이 생기지 않는다.
defineProps<{
  /**
   * 입력이 결과보다 훨씬 긴 화면(종합소득세·연말정산 등)만 켠다 — 입력을 내리는 동안 결과가 옆에 남는다.
   * 결과가 뷰포트보다 긴 화면에서 켜면 결과 아랫부분이 입력이 끝날 때까지 가려지므로 기본은 끈다.
   */
  stickyResult?: boolean;
}>();
</script>

<template>
  <div class="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:items-start">
    <div class="min-w-0 space-y-4 lg:col-start-1 lg:row-start-1">
      <slot name="input" />
    </div>
    <!-- top: 전역 헤더 56px + 데스크톱 1차 내비 49px 아래에 붙는다 -->
    <div
      class="min-w-0 space-y-4 lg:col-start-2 lg:row-span-2 lg:row-start-1"
      :class="{ 'lg:sticky lg:top-[7.5rem]': stickyResult }"
    >
      <slot name="result" />
    </div>
    <div v-if="$slots['below-input']" class="min-w-0 space-y-4 lg:col-start-1 lg:row-start-2">
      <slot name="below-input" />
    </div>
  </div>
</template>
