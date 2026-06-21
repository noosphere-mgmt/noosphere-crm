const selectClass = "mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm";

const ACTION_STYLES: Record<string, string> = {
  create: "bg-emerald-100 text-emerald-900",
  update: "bg-blue-100 text-blue-900",
  clear_value: "bg-amber-100 text-amber-900",
  no_change: "bg-slate-100 text-slate-700",
  duplicate_candidate: "bg-purple-100 text-purple-900",
  error: "bg-red-100 text-red-900",
  skipped: "bg-slate-100 text-slate-600",
};

const ACTION_LABELS: Record<string, string> = {
  create: "Created",
  update: "Updated",
  clear_value: "Cleared value",
  no_change: "No change",
  duplicate_candidate: "Duplicate candidate",
  error: "Error",
  skipped: "Skipped",
};

export function ImportActionBadge({ action }: { action: string }) {
  const label = ACTION_LABELS[action] ?? action.replace(/_/g, " ");
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_STYLES[action] ?? "bg-slate-100"}`}>
      {label}
    </span>
  );
}

export function SummaryTiles({
  summary,
  variant = "full",
}: {
  summary: Record<string, number>;
  variant?: "full" | "preview";
}) {
  const previewItems = [
    { key: "create", label: "New records" },
    { key: "update", label: "Updated records" },
    { key: "clear_value", label: "Cleared values" },
    { key: "error", label: "Errors" },
  ];
  const fullItems = [
    ...previewItems,
    { key: "no_change", label: "No change" },
    { key: "duplicate_candidate", label: "Duplicate candidate" },
    { key: "skipped", label: "Skipped" },
  ];
  const items = variant === "preview" ? previewItems : fullItems;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(({ key, label }) => (
        <div key={key} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <span className="text-slate-600">{label}</span>{" "}
          <span className="font-semibold tabular-nums text-slate-900">{summary[key] ?? 0}</span>
        </div>
      ))}
    </div>
  );
}

export function MappingSelect({
  header,
  fieldOptions,
  defaultValue,
}: {
  header: string;
  fieldOptions: Array<{ key: string; label: string; matchOnly?: boolean }>;
  defaultValue: string;
}) {
  return (
    <select name={`map__${header}`} defaultValue={defaultValue || "__skip__"} className={selectClass}>
      <option value="__skip__">— Skip —</option>
      {fieldOptions.map((f) => (
        <option key={f.key} value={f.key}>
          {f.label}{f.matchOnly ? " (match)" : ""}
        </option>
      ))}
    </select>
  );
}
