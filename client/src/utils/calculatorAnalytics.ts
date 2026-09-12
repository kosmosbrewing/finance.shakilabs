export type AnalyticsEventTracker = (
  eventName: string,
  params: Record<string, unknown>,
) => void;

interface CalculatorAnalyticsOptions {
  calculatorId: () => string;
  pagePath: () => string;
  track: AnalyticsEventTracker;
  canViewResult?: () => boolean;
  debounceMs?: number;
  /** 세션 1회 판정을 주입 가능하게 둔다 — 테스트가 sessionStorage에 의존하지 않도록. */
  hasSeenResult?: (calculatorId: string) => boolean;
  markResultSeen?: (calculatorId: string) => void;
}

const SESSION_KEY = "finance:result_view_seen";
// sessionStorage가 막힌 브라우저(사파리 프라이빗·쿠키 차단)에서도 같은 탭 안에서는
// 중복이 안 나가도록 메모리 사본을 함께 둔다.
const seenInMemory = new Set<string>();

function readSeen(): Set<string> {
  if (seenInMemory.size > 0) return seenInMemory;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) for (const id of JSON.parse(raw) as string[]) seenInMemory.add(id);
  } catch {
    // storage unavailable: memory copy is the whole record
  }
  return seenInMemory;
}

function defaultHasSeenResult(calculatorId: string): boolean {
  return readSeen().has(calculatorId);
}

function defaultMarkResultSeen(calculatorId: string): void {
  const seen = readSeen();
  seen.add(calculatorId);
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify([...seen]));
  } catch {
    // storage unavailable: memory copy is the whole record
  }
}

export function createCalculatorAnalytics(options: CalculatorAnalyticsOptions) {
  let started = false;
  let resultTimer: ReturnType<typeof setTimeout> | null = null;
  const hasSeenResult = options.hasSeenResult ?? defaultHasSeenResult;
  const markResultSeen = options.markResultSeen ?? defaultMarkResultSeen;

  function buildParams() {
    return {
      calculator_id: options.calculatorId(),
      page_path: options.pagePath(),
      calculation_mode: "automatic",
    };
  }

  function recordInteraction() {
    if (!started) {
      options.track("calculator_start", buildParams());
      started = true;
    }

    if (resultTimer) clearTimeout(resultTimer);
    resultTimer = setTimeout(() => {
      const params = buildParams();
      // calculator_submit은 계산이 실행될 때마다 — 퍼널의 분모다.
      options.track("calculator_submit", params);
      if (options.canViewResult?.() === false) return;
      // result_view는 세션·계산기당 1회 — 입력 한 글자마다 세면 "결과를 본 사용자"가
      // 아니라 "타이핑 횟수"를 세게 된다.
      const calculatorId = params.calculator_id;
      if (hasSeenResult(calculatorId)) return;
      markResultSeen(calculatorId);
      options.track("result_view", params);
    }, options.debounceMs ?? 600);
  }

  function dispose() {
    if (resultTimer) clearTimeout(resultTimer);
  }

  return { recordInteraction, dispose };
}
