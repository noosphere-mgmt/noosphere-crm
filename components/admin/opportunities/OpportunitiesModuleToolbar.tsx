"use client";

export function OpportunitiesModuleToolbar({
  onCreate,
  createLabel,
}: {
  onCreate: () => void;
  createLabel: string;
}) {
  const createButtonClass =
    "flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-lg leading-none text-slate-600 hover:bg-slate-50";

  return (
    <div className="mb-2 flex items-center gap-1.5">
      <span className="shrink-0 text-sm font-semibold text-slate-900">Opportunities</span>
      <div className="flex min-w-0 flex-1" />
      <button
        type="button"
        onClick={onCreate}
        className={createButtonClass}
        aria-label={createLabel}
        title={createLabel}
      >
        +
      </button>
    </div>
  );
}
