/** Compact coverage tags for the Contacts listing. Empty coverage stays an em dash. */
export function ContactCoverageBadges({ values }: { values: string[] | null | undefined }) {
  const list = (values ?? []).map((value) => value.trim()).filter(Boolean);
  if (list.length === 0) return <span className="text-slate-400">—</span>;
  return (
    <div className="flex max-w-[13rem] flex-wrap gap-1">
      {list.map((value) => (
        <span
          key={value}
          className="inline-flex max-w-full truncate rounded-full bg-slate-100 px-1.5 py-px text-[10px] font-medium leading-4 text-slate-600"
        >
          {value}
        </span>
      ))}
    </div>
  );
}
