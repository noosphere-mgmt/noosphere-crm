export type ExportScope = "all" | "selected" | "filtered";

export function buildExportFilename(
  objectType: string,
  scope: ExportScope,
  date = new Date(),
): string {
  const ymd = date.toISOString().slice(0, 10);
  return `noosphere_${objectType}_${scope}_${ymd}.csv`;
}
