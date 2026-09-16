<script setup lang="ts">
// loan `/dsr`의 DsrMemoryControl을 그대로 따른다(새 패턴을 만들지 않는다).
// 저장소·TTL·키 규약은 패키지 ShMemoryControl이 소유한다:
// sessionStorage, 8시간, `shaki:draft:<category>:<tool>:v1`.
// 앱이 정하는 건 "무엇을 저장/복원할지" 하나뿐 — finance 계산기는 입력을 URL 쿼리에
// 담고 있으므로(router.replace) 저장본은 그 경로 한 줄이면 충분하다.
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { z } from "zod";
import { ShMemoryControl } from "@shakilabs/ui";
import { trackEvent } from "@/lib/analytics";

const props = defineProps<{
  /** 키의 <tool> 자리. 라우트마다 달라야 다른 계산기 초안을 서로 덮지 않는다. */
  tool: string;
  /** 이 도구가 소유한 경로 앞머리. 이 밖의 경로는 저장도 복원도 하지 않는다. */
  basePath: string;
}>();

// 복원 값도 사용자 입력과 똑같이 검증한다 — 길이·형태를 Zod로 먼저 통과시킨다.
// 길이 상한이 없으면 sessionStorage에 심어진 거대한 문자열이 그대로 router로 들어간다.
const payloadSchema = z.object({
  path: z
    .string()
    .min(1)
    .max(2_000)
    .startsWith("/")
    // `//evil.example.com`은 "/"로 시작해도 외부 주소다 — 스키마 단계에서 끊는다
    .refine((value) => !value.startsWith("//"), { message: "protocol-relative path" }),
  savedAt: z.number().int().nonnegative(),
});

type MemoryControlExposed = {
  save: (payload: unknown) => void;
  clear: () => void;
};

const control = ref<MemoryControlExposed | null>(null);
const route = useRoute();
const router = useRouter();
const tracking = ref(false);

// setup 시점 = 앱에 들어온 URL. 뷰가 기본값으로 URL을 정규화(router.replace)하기 전이라
// "사용자가 맨 경로로 들어왔는가"를 여기서만 정확히 판정할 수 있다.
const entryFullPath = route.fullPath;

/** `/insurance`는 `/insurance/3000000`을 품지만 `/insurance-foo`는 남이다. */
function ownsPath(path: string): boolean {
  const pathname = path.split(/[?#]/, 1)[0] ?? "";
  return pathname === props.basePath || pathname.startsWith(`${props.basePath}/`);
}

// 맨 경로로 들어왔을 때만 복원한다. 링크·공유 URL로 들어온 값(경로 파라미터든 쿼리든)을
// 저장본이 덮어쓰면 사용자가 방금 연 화면이 사라진다.
const enteredBare = computed(() => entryFullPath === props.basePath);

function currentPath(): string {
  return route.fullPath.split("#", 1)[0] ?? "";
}

function saveCurrent(): void {
  const path = currentPath();
  // 모드 전환 등으로 다른 도구의 경로에 서 있으면 이 키에 남의 경로를 적지 않는다
  if (!ownsPath(path)) return;
  control.value?.save({ path, savedAt: Date.now() });
}

function ageBucket(savedAt: number): string {
  const age = Date.now() - savedAt;
  if (age < 15 * 60 * 1000) return "under_15m";
  if (age < 60 * 60 * 1000) return "under_1h";
  return "under_8h";
}

function handleEnable(): void {
  tracking.value = true;
  saveCurrent();
}

function handleDisable(): void {
  tracking.value = false;
}

async function handleRestore(payload: unknown): Promise<void> {
  tracking.value = true;
  const parsed = payloadSchema.safeParse(payload);
  // 스키마 밖이거나 다른 도구의 경로면 되살리지 않고 버린다
  if (!parsed.success || !ownsPath(parsed.data.path)) {
    control.value?.clear();
    tracking.value = false;
    return;
  }
  // 맨 경로가 아니면 초안은 그대로 두고 이동만 하지 않는다(지우지 않는다 —
  // 복원 후 뷰가 리마운트되면서 이 분기로 다시 들어오기 때문이다)
  if (!enteredBare.value) return;
  trackEvent("recent_result_open", {
    app_id: "finance",
    tool_id: props.tool,
    // 값이 아니라 경과 구간만 보낸다 — 입력값은 분석 도구로 나가지 않는다
    age_bucket: ageBucket(parsed.data.savedAt),
  });
  await router.replace(parsed.data.path);
}

// 켜져 있는 동안 입력(=URL)이 바뀔 때마다 최신 경로로 갱신한다
watch(
  () => route.fullPath,
  () => {
    if (tracking.value) saveCurrent();
  },
  { flush: "post" },
);
</script>

<template>
  <ShMemoryControl
    ref="control"
    category="finance"
    :tool="tool"
    @enable="handleEnable"
    @disable="handleDisable"
    @restore="handleRestore"
  />
</template>
