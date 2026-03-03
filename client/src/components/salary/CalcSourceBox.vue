<script setup lang="ts">
import { TAX_YEAR } from "@/lib/tax-constants";
</script>

<template>
  <details class="retro-panel overflow-hidden">
    <summary class="retro-titlebar cursor-pointer list-none">
      <span class="retro-title">계산 기준 · 출처</span>
      <span class="retro-kbd">{{ TAX_YEAR }}</span>
    </summary>
    <div class="retro-panel-content space-y-3">
      <p class="text-caption text-muted-foreground">
        {{ TAX_YEAR }}년 세율/보험료율 기준으로 계산하며 회사별 원천징수 방식에 따라 실제 급여명세와 차이가 날 수 있습니다.
      </p>
      <ul class="list-disc list-inside text-caption space-y-1">
        <li>국민연금(기준소득월액 상·하한 포함)</li>
        <li>건강보험/장기요양보험/고용보험</li>
        <li>소득세/지방소득세/근로소득세액공제/자녀세액공제</li>
      </ul>
      <div class="flex flex-wrap gap-2 text-caption">
        <a
          class="retro-button-subtle"
          href="https://www.nps.or.kr/jsppage/info/easy/pension_03_07.jsp"
          target="_blank"
          rel="noopener noreferrer"
        >
          국민연금
        </a>
        <a
          class="retro-button-subtle"
          href="https://www.nhis.or.kr/english/wbheaa02500m01.do"
          target="_blank"
          rel="noopener noreferrer"
        >
          건강보험
        </a>
        <a
          class="retro-button-subtle"
          href="https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=276127"
          target="_blank"
          rel="noopener noreferrer"
        >
          소득세법
        </a>
      </div>
    </div>
  </details>
</template>
