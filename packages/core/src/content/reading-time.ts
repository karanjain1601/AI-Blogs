import type { BlocksDocument } from "@notes/blocks";
import { collectText } from "./wikilinks";

const WORDS_PER_MINUTE = 220;

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/** Estimated reading time in whole minutes (minimum 1). */
export function readingTime(
  blocks: BlocksDocument,
  wpm: number = WORDS_PER_MINUTE,
): number {
  const words = countWords(collectText(blocks));
  return Math.max(1, Math.round(words / wpm));
}
