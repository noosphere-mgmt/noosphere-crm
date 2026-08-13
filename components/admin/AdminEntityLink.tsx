"use client";

import Link from "next/link";
import type { ReactNode } from "react";

/** Renders a link when href is available; otherwise plain text / fallback. */
export function AdminEntityLink({
  href,
  children,
  className = "text-inherit underline-offset-2 hover:underline",
  fallback = "—",
  onClick,
}: {
  href: string | null | undefined;
  children: ReactNode;
  className?: string;
  fallback?: ReactNode;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const label = children == null || children === "" ? null : children;
  if (!label) return <>{fallback}</>;
  if (!href) return <>{label}</>;
  return (
    <Link
      href={href}
      className={className}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
    >
      {label}
    </Link>
  );
}
