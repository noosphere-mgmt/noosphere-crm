/** Normalize building grade for mobile display: "Grade A" → "A" */
export function formatBuildingGradeShort(grade: string | null | undefined): string {
  if (!grade?.trim()) return "—";
  const g = grade.trim();
  const prefixed = g.match(/^grade\s*([abc])$/i);
  if (prefixed) return prefixed[1]!.toUpperCase();
  if (/^[abc]$/i.test(g)) return g.toUpperCase();
  const leading = g.match(/^([abc])\b/i);
  if (leading) return leading[1]!.toUpperCase();
  return g.length <= 3 ? g.toUpperCase() : g;
}
