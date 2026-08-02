<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import SEOHead from "@/components/common/SEOHead.vue";
import IncomeSourceInput from "@/components/comprehensive-tax/IncomeSourceInput.vue";
import ComprehensiveTaxResult from "@/components/comprehensive-tax/ComprehensiveTaxResult.vue";
import SeparateTaxCompare from "@/components/comprehensive-tax/SeparateTaxCompare.vue";
import ShareModal from "@/components/share/ShareModal.vue";
import CalcSourceBox from "@/components/salary/CalcSourceBox.vue";
import AdSlot from "@/components/common/AdSlot.vue";
import InternalLink from "@/components/common/InternalLink.vue";
import CommunitySidebar from "@/components/common/CommunitySidebar.vue";
import RecentCalcPanel from "@/components/common/RecentCalcPanel.vue";
import VisitorCounter from "@/components/common/VisitorCounter.vue";
import {
  DEFAULT_INDUSTRY,
  FREELANCE_INDUSTRIES,
  type IndustryKey,
} from "@/data/freelanceTaxRates";
import { addEntry } from "@/composables/useRecentCalcs";
import { useComprehensiveTaxCalc } from "@/composables/useComprehensiveTaxCalc";
import { useShare } from "@/composables/useShare";
import { formatManWonValue, formatWon } from "@/lib/utils";
import { DEFAULT_SITE_URL } from "@/lib/site";
import { syncInputDisplay } from "@/utils/numericInput";
import {
  buildAbsoluteUrl,
  isSameQuery,
  parseQueryFloat,
  parseQueryInt,
  queryFirst,
} from "@/lib/routeState";

const props = defineProps<{
  initialBusinessAmountManWon?: number;
  isFreelancerRoute?: boolean;
}>();

const route = useRoute();

const initialized = ref(false);
// router.replace() 대신 history.replaceState()로 URL을 갱신하기 위한 내부 추적
const lastQuery = ref<Record<string, string>>({});

const business = ref({
  enabled: true,
  revenue: 3000,
  industryKey: DEFAULT_INDUSTRY as IndustryKey,
  customExpenseRate: null as number | null,
});

const rental = ref({
  enabled: false,
  revenue: 1500,
  registered: true,
  customExpenseRate: null as number | null,
  preferSeparate: true,
});

const other = ref({
  enabled: false,
  revenue: 500,
  customExpenseRate: null as number | null,
  preferSeparate: true,
});

const dependents = ref(1);
const includePension = ref(true);

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.floor(value || 0)));
}

function onDependentsInput(event: Event): void {
  const target = event.target as HTMLInputElement;
  const safe = clampInt(Number.parseInt(target.value, 10), 1, 20);
  dependents.value = safe;
  // 범위 밖 값을 연속 입력하면 값이 그대로라 Vue가 DOM을 다시 쓰지 않는다 — 표시를 직접 맞춘다.
  if (target.value.trim() !== "") syncInputDisplay(target, String(safe));
}

function clampRate(value: number): number {
  return Math.max(0, Math.min(95, value));
}

function parsePositiveInt(value: unknown): number | null {
  const parsed = parseQueryInt(value);
  if (parsed === null || parsed <= 0) return null;
  return parsed;
}

function parseRate(value: unknown): number | null {
  if (value == null) return null;
  const parsed = parseQueryFloat(value);
  if (parsed === null) return null;
  return clampRate(parsed);
}

onMounted(() => {
  const query = route.query;
  const knownKeys = new Set([
    "biz",
    "gross",
    "type",
    "ind",
    "industry",
    "bce",
    "ren",
    "reg",
    "rce",
    "rsp",
    "oth",
    "oce",
    "osp",
    "dep",
    "pen",
  ]);
  const hasKnownQuery = Object.keys(query).some((key) => knownKeys.has(key));

  if (hasKnownQuery) {
    const legacyType = queryFirst(query.type);
    const biz =
      parsePositiveInt(queryFirst(query.biz)) ?? parsePositiveInt(queryFirst(query.gross));
    const oth = parsePositiveInt(queryFirst(query.oth));
    const ren = parsePositiveInt(queryFirst(query.ren));

    const legacyIndustry = queryFirst(query.industry);
    const modernIndustry = queryFirst(query.ind);

    const incomeSourceKeys = new Set(["biz", "gross", "type", "ren", "oth"]);
    const hasIncomeSourceQuery = Object.keys(query).some((key) => incomeSourceKeys.has(key));

    if (hasIncomeSourceQuery) {
      business.value.enabled = false;
      other.value.enabled = false;
      rental.value.enabled = false;

      // 레거시 /freelance?type=other 링크는 기타소득으로 매핑
      if (legacyType === "other" && biz !== null && oth === null) {
        other.value.enabled = true;
        other.value.revenue = clampInt(biz, 50, 10_000);
        other.value.preferSeparate = false;
      } else {
        business.value.enabled = biz !== null;
        if (biz !== null) business.value.revenue = clampInt(biz, 100, 50_000);

        other.value.enabled = oth !== null;
        if (oth !== null) other.value.revenue = clampInt(oth, 50, 10_000);
      }

      if (ren !== null) {
        rental.value.enabled = true;
        rental.value.revenue = clampInt(ren, 100, 30_000);
      }
    }

    const industry = modernIndustry ?? legacyIndustry;
    if (industry && Object.prototype.hasOwnProperty.call(FREELANCE_INDUSTRIES, industry)) {
      business.value.industryKey = industry as IndustryKey;
    }
    business.value.customExpenseRate = parseRate(queryFirst(query.bce));

    rental.value.registered = queryFirst(query.reg) !== "n";
    rental.value.customExpenseRate = parseRate(queryFirst(query.rce));
    rental.value.preferSeparate = queryFirst(query.rsp) !== "0";

    other.value.customExpenseRate = parseRate(queryFirst(query.oce));
    if (!(legacyType === "other" && biz !== null && oth === null)) {
      other.value.preferSeparate = queryFirst(query.osp) !== "0";
    }

    const dep = parsePositiveInt(queryFirst(query.dep));
    dependents.value = clampInt(dep ?? 1, 1, 20);
    includePension.value = queryFirst(query.pen) !== "0";
  } else if (
    typeof props.initialBusinessAmountManWon === "number" &&
    Number.isFinite(props.initialBusinessAmountManWon) &&
    props.initialBusinessAmountManWon > 0
  ) {
    business.value.enabled = true;
    business.value.revenue = clampInt(props.initialBusinessAmountManWon, 100, 50_000);
  }

  initialized.value = true;
  lastQuery.value = buildComprehensiveQuery();
});

const calcInput = computed(() => ({
  business: {
    enabled: business.value.enabled,
    revenue: business.value.revenue * 10_000,
    industryKey: business.value.industryKey,
    customExpenseRate: business.value.customExpenseRate,
  },
  rental: {
    enabled: rental.value.enabled,
    revenue: rental.value.revenue * 10_000,
    registered: rental.value.registered,
    customExpenseRate: rental.value.customExpenseRate,
    preferSeparate: rental.value.preferSeparate,
  },
  other: {
    enabled: other.value.enabled,
    revenue: other.value.revenue * 10_000,
    customExpenseRate: other.value.customExpenseRate,
    preferSeparate: other.value.preferSeparate,
  },
  dependents: dependents.value,
  includePension: includePension.value,
}));

const result = useComprehensiveTaxCalc(calcInput);

const netLabel = computed(() => {
  if (result.value.netPayable > 0) {
    return `추가 납부 ${formatWon(result.value.netPayable)}`;
  }
  if (result.value.netPayable < 0) {
    return `환급 예상 ${formatWon(Math.abs(result.value.netPayable))}`;
  }
  return "추가 납부/환급 없음";
});

const isFreelancer = computed(() => !!props.isFreelancerRoute);
const basePath = computed(() => isFreelancer.value ? "/freelancer" : "/comprehensive-tax");
const pageLabel = computed(() => isFreelancer.value ? "프리랜서 세금 계산기" : "종합소득세 계산기");
const internalLinkKey = computed((): "freelancer" | "comprehensive-tax" => isFreelancer.value ? "freelancer" : "comprehensive-tax");

const seoTitle = computed(() => {
  const totalManWon = Math.floor(result.value.totalRevenue / 10_000);
  if (isFreelancer.value) {
    if (totalManWon > 0) {
      return `프리랜서 수입 ${formatManWonValue(totalManWon)} 세금 | 2026 3.3% 종합소득세`;
    }
    return "2026 프리랜서 세금 계산기 | 3.3% 종합소득세";
  }
  if (totalManWon > 0) {
    return `종합소득 ${formatManWonValue(totalManWon)} 세금 계산 | 2026 종합소득세 계산기`;
  }
  return "2026 종합소득세 계산기 | 프리랜서·사업소득 세금";
});

const seoDescription = computed(() => {
  if (isFreelancer.value) {
    return `프리랜서 3.3% 원천징수 후 종합소득세 정산. ${netLabel.value}. N잡러·1인사업자 세금 시뮬레이션.`;
  }
  return `프리랜서·사업자·임대소득자를 위한 종합소득세 계산. ${netLabel.value}. 분리과세 비교까지 한 번에 확인하세요.`;
});

const {
  showShareModal,
  kakaoBusy,
  shareSummary,
  openShare,
  closeShare,
  shareKakao,
  copyLink,
} = useShare(result.value, {
  getCalc: () => result.value,
  getShareUrl: () => getShareUrl(),
  getShareText: () => seoTitle.value,
  getShareSummary: () =>
    [
      `총수입 ${formatWon(result.value.totalRevenue)}`,
      `과세표준 ${formatWon(result.value.taxableBase)}`,
      netLabel.value,
    ].join(" · "),
  getDescription: () => seoDescription.value,
  getButtonTitle: () => "종합소득세 결과 보기",
});

const breadcrumbJsonLd = computed(() => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "홈", item: `${DEFAULT_SITE_URL}/` },
    {
      "@type": "ListItem",
      position: 2,
      name: pageLabel.value,
      item: `${DEFAULT_SITE_URL}${basePath.value}`,
    },
  ],
}));

function buildComprehensiveQuery(): Record<string, string> {
  const query: Record<string, string> = {};

  if (business.value.enabled && business.value.revenue > 0) {
    query.biz = String(clampInt(business.value.revenue, 100, 50_000));
    query.ind = business.value.industryKey;
    if (business.value.customExpenseRate != null) {
      query.bce = String(clampRate(business.value.customExpenseRate));
    }
  }

  if (rental.value.enabled && rental.value.revenue > 0) {
    query.ren = String(clampInt(rental.value.revenue, 100, 30_000));
    query.reg = rental.value.registered ? "y" : "n";
    if (rental.value.customExpenseRate != null) {
      query.rce = String(clampRate(rental.value.customExpenseRate));
    }
    query.rsp = rental.value.preferSeparate ? "1" : "0";
  }

  if (other.value.enabled && other.value.revenue > 0) {
    query.oth = String(clampInt(other.value.revenue, 50, 10_000));
    if (other.value.customExpenseRate != null) {
      query.oce = String(clampRate(other.value.customExpenseRate));
    }
    query.osp = other.value.preferSeparate ? "1" : "0";
  }

  if (dependents.value !== 1) {
    query.dep = String(clampInt(dependents.value, 1, 20));
  }

  query.pen = includePension.value ? "1" : "0";

  return query;
}

watch(
  [business, rental, other, dependents, includePension],
  () => {
    if (!initialized.value) return;
    const nextQuery = buildComprehensiveQuery();
    if (isSameQuery(lastQuery.value, nextQuery)) return;
    lastQuery.value = nextQuery;
    // Vue Router navigation을 거치지 않고 URL만 갱신 → page-fade Transition 미발동
    const qs = new URLSearchParams(nextQuery).toString();
    const path = basePath.value;
    history.replaceState(history.state, "", qs ? `${path}?${qs}` : path);
  },
  { deep: true, flush: "post" }
);

function getShareUrl(): string {
  return buildAbsoluteUrl(basePath.value, buildComprehensiveQuery());
}

let recentCalcTimer: ReturnType<typeof setTimeout> | null = null;
watch(
  () => result.value.netPayable,
  () => {
    if (recentCalcTimer) clearTimeout(recentCalcTimer);
    recentCalcTimer = setTimeout(() => {
      const query = new URLSearchParams(buildComprehensiveQuery()).toString();
      const path = basePath.value;
      const typeKey = isFreelancer.value ? "freelancer" : "comprehensive-tax";
      const labelPrefix = isFreelancer.value ? "프리랜서" : "종합소득";
      addEntry({
        type: typeKey,
        label: `${labelPrefix} ${formatManWonValue(Math.floor(result.value.totalRevenue / 10_000))}`,
        path: query ? `${path}?${query}` : path,
        summary: netLabel.value,
      });
    }, 2000);
  },
  { immediate: true }
);
</script>

<template>
  <div class="container space-y-4 py-6">
    <SEOHead :title="seoTitle" :description="seoDescription" :json-ld="breadcrumbJsonLd" />

    <h1 class="text-h1 font-brand">{{ isFreelancer ? '2026 프리랜서 세금 계산기' : '2026 종합소득세 계산기' }}</h1>

    <section class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div class="space-y-4 order-1">
        <IncomeSourceInput
          source-type="business"
          :enabled="business.enabled"
          :revenue="business.revenue"
          :industry-key="business.industryKey"
          :custom-expense-rate="business.customExpenseRate"
          @update:enabled="business.enabled = $event"
          @update:revenue="business.revenue = $event"
          @update:industry-key="business.industryKey = $event"
          @update:custom-expense-rate="business.customExpenseRate = $event"
        />

        <IncomeSourceInput
          source-type="rental"
          :enabled="rental.enabled"
          :revenue="rental.revenue"
          :registered="rental.registered"
          :custom-expense-rate="rental.customExpenseRate"
          :prefer-separate="rental.preferSeparate"
          @update:enabled="rental.enabled = $event"
          @update:revenue="rental.revenue = $event"
          @update:registered="rental.registered = $event"
          @update:custom-expense-rate="rental.customExpenseRate = $event"
          @update:prefer-separate="rental.preferSeparate = $event"
        />

        <IncomeSourceInput
          source-type="other"
          :enabled="other.enabled"
          :revenue="other.revenue"
          :custom-expense-rate="other.customExpenseRate"
          :prefer-separate="other.preferSeparate"
          @update:enabled="other.enabled = $event"
          @update:revenue="other.revenue = $event"
          @update:custom-expense-rate="other.customExpenseRate = $event"
          @update:prefer-separate="other.preferSeparate = $event"
        />

        <section class="retro-panel overflow-hidden">
          <div class="retro-titlebar">
            <h2 class="retro-title">공제 설정</h2>
          </div>

          <div class="retro-panel-content grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label class="space-y-1" for="comprehensive-dependents">
              <span class="text-caption text-muted-foreground">부양가족 수 (본인 포함)</span>
              <input
                id="comprehensive-dependents"
                :value="dependents"
                type="number"
                min="1"
                max="20"
                inputmode="numeric"
                class="retro-input"
                @input="onDependentsInput"
              />
            </label>

            <div class="space-y-1">
              <span class="text-caption text-muted-foreground">연금보험료 공제</span>
              <label class="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 text-caption font-semibold">
                <input
                  type="checkbox"
                  class="retro-checkbox"
                  :checked="includePension"
                  @change="includePension = ($event.target as HTMLInputElement).checked"
                />
                사업소득 기준 연금공제 반영
              </label>
            </div>
          </div>
        </section>

        <ComprehensiveTaxResult :result="result" @share-request="openShare" />

        <SeparateTaxCompare
          v-if="result.rentalCompare || result.otherCompare"
          :rental-compare="result.rentalCompare"
          :other-compare="result.otherCompare"
        />

        <CalcSourceBox />

        <AdSlot slot="150001" label="광고 · top" />

        <InternalLink :current="internalLinkKey" />

        <AdSlot slot="150002" label="광고 · middle" />

        <VisitorCounter />
      </div>

      <div class="space-y-4 order-2 lg:sticky lg:top-20 lg:self-start">
        <CommunitySidebar :page-key="isFreelancer ? 'freelancer-main' : 'comprehensive-tax-main'" @share-request="openShare" />
        <RecentCalcPanel />
      </div>
    </section>

    <ShareModal
      :show="showShareModal"
      :kakao-busy="kakaoBusy"
      :summary-text="shareSummary"
      @close="closeShare"
      @share-kakao="shareKakao"
      @copy-link="copyLink"
    />
  </div>
</template>
