<script setup lang="ts">
import { ShSurface, ShText } from "@shakilabs/ui";
import { MAX_RECENT_CALCS, RECENT_CALC_RETENTION_DAYS } from "@/composables/useRecentCalcs";
</script>

<template>
  <ShSurface variant="outlined" padding="sm">
    <ShText as="h2" variant="heading">최근 계산 저장 기준</ShText>
    <ShText variant="caption" tone="muted" class="mt-1">
      최근 결과는 이 브라우저에만 최대 {{ MAX_RECENT_CALCS }}건, {{ RECENT_CALC_RETENTION_DAYS }}일간 저장되며 언제든 지울 수 있습니다.
    </ShText>
  </ShSurface>
</template>
