<script setup lang="ts">
import { TAX_YEAR } from "@/lib/tax-constants";
import { INSURANCE_RATE_BASIS } from "@/data/taxRates2026";
</script>

<template>
  <details class="retro-panel overflow-hidden">
    <summary class="retro-titlebar cursor-pointer list-none">
      <span class="retro-title">계산 기준 · 출처</span>
      <span class="retro-kbd">{{ TAX_YEAR }}</span>
    </summary>
    <div class="retro-panel-content space-y-3">
      <p class="text-caption text-muted-foreground">
        {{ TAX_YEAR }}년 세율과 2026년 7월 시행 기준으로 계산합니다. 회사별 보수 신고·원천징수·정산 방식에 따라 실제 급여명세와 차이가 날 수 있습니다.
      </p>
      <ul class="list-disc list-inside text-caption space-y-1">
        <li>국민연금 4.75% · 기준소득월액 41만~659만원 (2026.7.1~2027.6.30)</li>
        <li>건강보험 근로자 3.595% · 장기요양 건강보험료의 13.14%</li>
        <li>고용보험 근로자 0.9%</li>
        <li>소득세/지방소득세/근로소득세액공제/자녀세액공제</li>
      </ul>
      <p class="text-tiny text-muted-foreground">
        2026년 1~6월 국민연금 상·하한, 보수월액 정산, 회사별 비과세 항목과 추가 공제는 별도로 확인하세요. 자료 확인일 {{ INSURANCE_RATE_BASIS.verifiedAt }}.
      </p>
      <div class="flex flex-wrap gap-2 text-caption">
        <a
          class="retro-button-subtle"
          :href="INSURANCE_RATE_BASIS.nationalPension.sourceUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          국민연금
        </a>
        <a
          class="retro-button-subtle"
          :href="INSURANCE_RATE_BASIS.healthInsurance.sourceUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          건강보험
        </a>
        <a
          class="retro-button-subtle"
          :href="INSURANCE_RATE_BASIS.employmentInsurance.sourceUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          고용보험
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
