// Shape of one promoted section. hub-content.mjs renderSection consumes exactly this, and the
// recalculation gate in src/utils/digestFigures.test.ts reads the prose out of it.
export type DigestTable = {
  head: string[];
  rows: Array<{ highlight?: boolean; cells: string[] }>;
};
export type DigestBlock = {
  h3: string;
  body: string | string[];
  table?: DigestTable;
  tableNote?: string;
};
export type Digest = {
  h2: string;
  body: string[];
  blocks?: DigestBlock[];
  table?: DigestTable;
  tableNote?: string;
  callout?: string;
};
export type DigestBuilder = () => Digest;
