// 렌더 문단 250자 상한 — 단일 소스(v8b 결함 수정, 2026-10-03).
//
// 왜 필요한가: 허브·다이제스트 산문(hub-digests-*.mjs)의 각 발견(Finding)은 이미
// `body: string[]`로 나뉘어 있지만(각 배열 원소가 <p> 하나), 원소 하나가 여러 문장을
// 이어 쓴 253~437자짜리 단일 문자열인 경우가 25개 페이지에 있었다. 문장을 지우거나
// 숫자를 바꾸지 않고 "이미 있는 문장 경계"에서만 다시 묶는다 — loan 커밋 3be718c·
// seller #3(commit 831fb89)과 같은 알고리즘(chunkSentences, maxChars=200, 탐욕 결합).
//
// 문장 경계: 한국어 평서문은 "다." 또는 "요."로 끝난다. 숫자(1.5, 3.3% 등)는 이 두
// 음절 뒤에 오지 않으므로 숫자 안에서 쪼개질 일이 없다. <strong>처럼 문장 끝에 걸치는
// 인라인 태그가 있을 수 있어, 종결 음절과 마침표 사이에 닫는 태그가 끼는 경우까지 허용한다
// (예: "…습니다</strong>." 도 경계로 인정).
const SENTENCE_BOUNDARY = /(?<=(?:다|요)(?:<\/[a-z0-9]+>)*\.)\s+/i;

// 공백으로 이어 붙인 문장들을 이미 나뉜 문장 배열로 되돌린다. 경계가 없으면(문장 전체가
// 하나) 원문 그대로 1개짜리 배열을 반환한다 — 더 쪼갤 문장 경계가 없다는 뜻이라 이 함수
// 선에서는 손대지 않고, 호출부가 그 사실을 보고하도록 둔다.
export function splitSentences(text) {
  return text
    .split(SENTENCE_BOUNDARY)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

// 탐욕 결합: 다음 문장을 붙이면 maxChars를 넘을 때만 새 문단을 연다(loan·seller와 동일).
export function chunkSentences(sentences, maxChars = 200) {
  const paragraphs = [];
  let current = "";
  for (const sentence of sentences) {
    const candidate = current ? `${current} ${sentence}` : sentence;
    if (candidate.length > maxChars && current) {
      paragraphs.push(current);
      current = sentence;
    } else {
      current = candidate;
    }
  }
  if (current) paragraphs.push(current);
  return paragraphs;
}

// 렌더러가 호출하는 진입점: 문단 후보 하나가 maxChars 이내면 그대로, 넘으면 문장 경계에서
// 쪼갠 뒤 200자 단위로 재배열한다. 이미 짧은 문단(대다수)은 손대지 않아 변경 범위가 최소다.
export function ensureParagraphLength(text, maxChars = 250) {
  if (typeof text !== "string" || text.length <= maxChars) return [text];
  const sentences = splitSentences(text);
  if (sentences.length <= 1) return [text];
  return chunkSentences(sentences, 200);
}
