// Shared inline-style tokens for prerendered bodies.
// Extracted so hub-content.mjs renders visually identical markup to prerender-content.mjs
// instead of restating the values — two copies of a colour would drift on the first redesign.

// 폭은 패키지 프레임 토큰이다(0.3.35 단일 프레임). 920px 자체 가운데 정렬은 수화 후 본문을
// 제목·계산기(x=168)보다 108px 안쪽(276)에서 시작하게 했다. 입양 뒤에는 prerenderFallback이 걷어낸다.
export const ARTICLE_STYLE =
  "max-width:var(--sh-container-frame, 72rem);margin:0 auto;padding:24px var(--sh-container-gutter, 16px);box-sizing:border-box;line-height:1.75;font-size:15px;color:hsl(var(--foreground));";
export const H1_STYLE = "font-size:28px;line-height:1.3;margin:0 0 16px;color:hsl(var(--foreground));";
export const H2_STYLE =
  "font-size:20px;line-height:1.35;margin:28px 0 10px;padding-bottom:6px;border-bottom:2px solid hsl(var(--border));color:hsl(var(--foreground));";
export const H3_STYLE = "font-size:16px;line-height:1.4;margin:18px 0 6px;color:hsl(var(--foreground));";
export const P_STYLE = "margin:0 0 10px;";
export const TABLE_STYLE =
  "width:100%;border-collapse:collapse;margin:10px 0 16px;font-size:14px;";
export const TH_STYLE =
  "padding:8px 10px;background:hsl(var(--muted));text-align:left;border:1px solid hsl(var(--border));color:hsl(var(--foreground));font-weight:600;";
export const TD_STYLE = "padding:8px 10px;border:1px solid hsl(var(--border));";
export const UL_STYLE = "margin:0 0 12px 20px;padding:0;";
export const LI_STYLE = "margin-bottom:4px;";
export const CALLOUT_STYLE =
  "background:hsl(var(--accent));border-left:4px solid hsl(var(--primary));padding:12px 14px;margin:12px 0 16px;border-radius:4px;";
export const NOTE_STYLE = "font-size:12px;color:hsl(var(--muted-foreground));margin-top:24px;";
export const HIGHLIGHT_ROW_STYLE = "background:hsl(var(--accent));";
