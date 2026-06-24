export function AdminLoadWarningBanner({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null;

  return (
    <div
      className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
      role="status"
    >
      <p className="font-medium">Some reference data could not be loaded</p>
      <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-amber-900">
        {warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-amber-800">
        You can still create the record. Company fields may be empty until the database is available.
      </p>
    </div>
  );
}
