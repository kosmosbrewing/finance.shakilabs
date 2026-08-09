// Shared inline-style tokens for prerendered bodies.
// Extracted so hub-content.mjs renders visually identical markup to prerender-content.mjs
// instead of restating the values — two copies of a colour would drift on the first redesign.

export const ARTICLE_STYLE =
  "max-width:920px;margin:0 auto;padding:24px 16px;line-height:1.75;font-size:15px;color:#334155;";
export const H1_STYLE = "font-size:28px;line-height:1.3;margin:0 0 16px;color:#0f172a;";
export const H2_STYLE =
  "font-size:20px;line-height:1.35;margin:28px 0 10px;padding-bottom:6px;border-bottom:2px solid #10b98133;color:#0f172a;";
export const H3_STYLE = "font-size:16px;line-height:1.4;margin:18px 0 6px;color:#0f172a;";
export const P_STYLE = "margin:0 0 10px;";
export const TABLE_STYLE =
  "width:100%;border-collapse:collapse;margin:10px 0 16px;font-size:14px;";
export const TH_STYLE =
  "padding:8px 10px;background:#f1f5f9;text-align:left;border:1px solid #cbd5e1;color:#334155;font-weight:600;";
export const TD_STYLE = "padding:8px 10px;border:1px solid #cbd5e1;";
export const UL_STYLE = "margin:0 0 12px 20px;padding:0;";
export const LI_STYLE = "margin-bottom:4px;";
export const CALLOUT_STYLE =
  "background:#ecfdf5;border-left:4px solid #10b981;padding:12px 14px;margin:12px 0 16px;border-radius:4px;";
export const NOTE_STYLE = "font-size:12px;color:#64748b;margin-top:24px;";
export const HIGHLIGHT_ROW_STYLE = "background:#ecfdf5;";
