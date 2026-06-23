/** Muted business / external ID for lists, drawers, and detail headers. */
export function RecordBusinessId({
  id,
  className = "",
}: {
  id: string | null | undefined;
  className?: string;
}) {
  const trimmed = id?.trim();
  if (!trimmed) return null;
  return (
    <span className={`font-mono text-xs text-slate-500 ${className}`.trim()}>{trimmed}</span>
  );
}

export function RecordNameWithId({
  name,
  id,
  nameClassName = "",
}: {
  name: string;
  id?: string | null;
  nameClassName?: string;
}) {
  return (
    <div className="min-w-0">
      <div className={`truncate ${nameClassName}`.trim()}>{name}</div>
      <RecordBusinessId id={id} className="mt-0.5 block" />
    </div>
  );
}
