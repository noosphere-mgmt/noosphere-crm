import { PREMISES_CENTRE_STATUSES } from "@/lib/v1ListValues";

/** Compact centre-status marker. Active is the default, so it has no extra mark. */
export function PremisesCentreStatusIcon({
  status,
}: {
  status: string | null | undefined;
}) {
  const value = (PREMISES_CENTRE_STATUSES as readonly string[]).includes(status ?? "")
    ? (status as (typeof PREMISES_CENTRE_STATUSES)[number])
    : "Active";

  if (value === "Active") {
    return <span className="sr-only">Centre status: Active</span>;
  }

  return (
    <span
      className="mt-0.5 inline-flex shrink-0 items-center rounded px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500 ring-1 ring-slate-200"
      title={`Centre status: ${value}`}
    >
      {value}
    </span>
  );
}
