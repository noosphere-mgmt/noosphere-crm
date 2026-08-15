import type { ReactNode } from "react";

export const mobileCardClass =
  "min-w-0 w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition active:bg-slate-50 sm:p-4";

export function MobileCard({
  children,
  onClick,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${mobileCardClass} ${className}`}>
        {children}
      </button>
    );
  }
  return <div className={`${mobileCardClass} ${className}`}>{children}</div>;
}

export function MobileCardList({ children }: { children: ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}

/** Compact card for phone dashboards and dense lists. */
export function MobileCompactCard({
  children,
  onClick,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const base =
    "w-full rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition active:bg-slate-50";
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${base} ${className}`}>
        {children}
      </button>
    );
  }
  return <div className={`${base} ${className}`}>{children}</div>;
}

export function MobileCardMeta({ children }: { children: ReactNode }) {
  return <p className="mt-1 min-w-0 break-words text-xs leading-relaxed text-slate-600 sm:text-sm">{children}</p>;
}

export function MobileCardTitle({ children }: { children: ReactNode }) {
  return <p className="min-w-0 break-words font-semibold text-slate-900">{children}</p>;
}
