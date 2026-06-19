import type { ReactNode } from "react";

export const mobileCardClass =
  "w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition active:bg-slate-50";

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
  return <div className="space-y-2 lg:hidden">{children}</div>;
}

export function MobileCardMeta({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-sm text-slate-600">{children}</p>;
}

export function MobileCardTitle({ children }: { children: ReactNode }) {
  return <p className="font-semibold text-slate-900">{children}</p>;
}
