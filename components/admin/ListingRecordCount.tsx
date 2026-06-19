import { formatListingCount } from "@/lib/formatListingCount";

export function ListingRecordCount({
  filteredCount,
  totalCount,
  label,
  selectedCount = 0,
}: {
  filteredCount: number;
  totalCount: number;
  label: string;
  selectedCount?: number;
}) {
  return (
    <div
      className="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-slate-600"
      aria-live="polite"
    >
      <p>
        <span className="font-semibold tabular-nums text-slate-900">
          {formatListingCount(filteredCount)}
        </span>
        {" of "}
        <span className="font-semibold tabular-nums text-slate-900">
          {formatListingCount(totalCount)}
        </span>{" "}
        {label}
      </p>
      {selectedCount > 0 ? (
        <p className="tabular-nums text-slate-500">{formatListingCount(selectedCount)} selected</p>
      ) : null}
    </div>
  );
}
