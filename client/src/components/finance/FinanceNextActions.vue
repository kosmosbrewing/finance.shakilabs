<script setup lang="ts">
import { computed, watch } from 'vue'
import { ArrowRight } from 'lucide-vue-next'
import { ShSurface, ShText } from '@shakilabs/ui'
import { trackEvent } from '@/lib/analytics'

const props = defineProps<{ mode: 'salary' | 'insurance' }>()
const sourceTool = computed(() => props.mode === 'salary' ? 'salary_net' : 'health_insurance_reverse')
const actions = computed(() => props.mode === 'salary'
  ? [
      { key: 'comprehensive_tax', title: '근로소득 외 세금도 계산', description: '부업·프리랜서 소득을 더해 종합소득세를 확인합니다.', href: '/finance/comprehensive-tax' },
      { key: 'health_insurance_reverse', title: '건보료로 연봉 다시 확인', description: '고지된 건강보험료를 기준으로 예상 세전 연봉을 역산합니다.', href: '/finance/insurance' },
      { key: 'loan_dsr', title: '이 연봉으로 DSR 한도 계산', description: '연소득 다음 단계로 대출 원리금 상환 여력을 점검합니다.', href: '/loan/dsr' },
    ]
  : [
      { key: 'salary_net', title: '예상 연봉의 실수령액 계산', description: '역산한 연봉에서 4대보험과 소득세를 뺀 월 수령액을 확인합니다.', href: '/finance/salary' },
      { key: 'comprehensive_tax', title: '추가 소득의 종합소득세 계산', description: '근로소득 외 사업·프리랜서 소득의 세금을 함께 점검합니다.', href: '/finance/comprehensive-tax' },
      { key: 'loan_dsr', title: '예상 연봉으로 DSR 한도 계산', description: '연소득을 기준으로 대출 원리금 상환 여력을 확인합니다.', href: '/loan/dsr' },
    ])

watch([sourceTool, actions], () => {
  actions.value.forEach((item) => trackEvent('related_tool_impression', {
    app_id: 'finance',
    from_tool: sourceTool.value,
    to_tool: item.key,
    placement: 'after_result',
  }))
}, { immediate: true })

function trackRelatedClick(toTool: string): void {
  trackEvent('related_tool_click', {
    app_id: 'finance',
    from_tool: sourceTool.value,
    to_tool: toTool,
    placement: 'after_result',
  })
}
</script>

<template>
  <section aria-labelledby="finance-next-actions-title">
    <ShText id="finance-next-actions-title" as="h2" variant="heading" class="mb-3">
      이 결과로 다음 계산 이어가기
    </ShText>
    <div class="grid gap-3 md:grid-cols-3">
      <ShSurface
        v-for="item in actions"
        :key="item.key"
        as="a"
        variant="outlined"
        padding="md"
        :href="item.href"
        class="group flex flex-col no-underline transition-colors hover:border-primary"
        @click="trackRelatedClick(item.key)"
      >
        <ShText as="h3" variant="heading">{{ item.title }}</ShText>
        <ShText variant="caption" tone="muted" class="mt-2 flex-1">{{ item.description }}</ShText>
        <span class="mt-4 inline-flex items-center gap-1 text-caption font-semibold text-primary">
          {{ item.title }} <ArrowRight class="h-4 w-4" aria-hidden="true" />
        </span>
      </ShSurface>
    </div>
  </section>
</template>
