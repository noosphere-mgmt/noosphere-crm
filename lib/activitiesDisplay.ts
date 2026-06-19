/** First 1–2 lines of notes for listing preview. */
export function formatActivityNotesPreview(notes: string | null | undefined): string {
  const text = notes?.trim();
  if (!text) return "—";
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const preview = lines.slice(0, 2).join(" ");
  if (preview.length <= 140) return preview;
  return `${preview.slice(0, 137)}…`;
}

/** Compact premises cell: first label + "+N" when multiple linked. */
export function formatActivityPremisesListCell(label: string | null | undefined): string {
  if (!label?.trim()) return "—";
  const parts = label
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0]!;
  const first = parts[0]!;
  const segments = first.split(" - ").filter(Boolean);
  const shortFirst = segments.length >= 2 ? `${segments[0]} - ${segments[1]}` : first;
  return `${shortFirst} +${parts.length - 1}`;
}

export function formatActivityDate(row: { activity_date: string; activity_time?: string | null }): string {
  const d = row.activity_date.slice(0, 10);
  return row.activity_time ? `${d} ${row.activity_time.slice(0, 5)}` : d;
}
