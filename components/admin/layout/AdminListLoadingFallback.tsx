/** Single placeholder while client list shells resolve (viewport / search params). */
export function AdminListLoadingFallback({ className = "min-h-[12rem]" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-100 ${className}`} aria-busy="true" />;
}
