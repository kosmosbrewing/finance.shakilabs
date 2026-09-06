import type { Digest, DigestBuilder } from "./hub-digest-types.d.mts";
export const DIGEST_SOURCES: Record<string, DigestBuilder[]>;
export function digestProse(digest: Digest): string;
