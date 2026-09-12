/** Normalize for typeahead matching: case-fold, strip punctuation, collapse spaces. */
export function normalizeSearchText(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function words(value: string): string[] {
  return value.split(" ").filter(Boolean);
}

function isSubsequence(haystack: string, needle: string): boolean {
  if (!needle) return true;
  let index = 0;
  for (const char of haystack) {
    if (char === needle[index]) index += 1;
    if (index === needle.length) return true;
  }
  return false;
}

/** Cheap 0–2 edit distance; only used for short typo tolerance. */
function boundedEditDistance(a: string, b: string, max = 1): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const rows = a.length + 1;
  const cols = b.length + 1;
  let prev = Array.from({ length: cols }, (_, i) => i);
  for (let i = 1; i < rows; i += 1) {
    const next = [i];
    let rowMin = i;
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const value = Math.min(prev[j] + 1, next[j - 1] + 1, prev[j - 1] + cost);
      next[j] = value;
      if (value < rowMin) rowMin = value;
    }
    if (rowMin > max) return max + 1;
    prev = next;
  }
  return prev[b.length];
}

function tokenScore(haystack: string, hayWords: string[], token: string): number {
  if (!token) return 0;
  if (haystack.includes(token)) {
    if (hayWords.some((word) => word === token)) return 100;
    if (hayWords.some((word) => word.startsWith(token))) return 80;
    return 60;
  }
  if (token.length >= 4) {
    for (const word of hayWords) {
      if (Math.abs(word.length - token.length) > 1) continue;
      if (boundedEditDistance(word, token, 1) <= 1) return 40;
    }
  }
  if (token.length >= 4 && isSubsequence(haystack.replace(/\s+/g, ""), token)) return 25;
  return 0;
}

export function fuzzyScore(haystackRaw: string, queryRaw: string): number {
  const haystack = normalizeSearchText(haystackRaw);
  const query = normalizeSearchText(queryRaw);
  if (!query) return 1;
  if (!haystack) return 0;
  const tokens = words(query);
  if (tokens.length === 0) return 1;
  const hayWords = words(haystack);
  let total = 0;
  for (const token of tokens) {
    const score = tokenScore(haystack, hayWords, token);
    if (score === 0) return 0;
    total += score;
  }
  if (haystack.startsWith(tokens[0] ?? "")) total += 15;
  return total;
}

export type RankedOption<T> = T & { score: number };

export function rankFuzzyOptions<T>(
  options: T[],
  query: string,
  haystack: (option: T) => string,
  limit = 80,
): T[] {
  const term = query.trim();
  if (!term) return options.slice(0, limit);
  const ranked: RankedOption<T>[] = [];
  for (const option of options) {
    const score = fuzzyScore(haystack(option), term);
    if (score > 0) ranked.push({ ...option, score });
  }
  ranked.sort((a, b) => b.score - a.score);
  return ranked.slice(0, limit);
}
