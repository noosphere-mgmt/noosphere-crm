import type { ReactNode } from "react";

type IconProps = { className?: string };

function iconWrap({ className }: IconProps, paths: ReactNode) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "h-5 w-5"}
      aria-hidden
    >
      {paths}
    </svg>
  );
}

export function IconWonRevenue(props: IconProps) {
  return iconWrap(
    props,
    <>
      <rect x="3.5" y="6.5" width="17" height="11" rx="2" />
      <circle cx="12" cy="12" r="2.2" />
      <path d="M7 6.5v11" />
      <path d="M17 6.5v11" />
    </>,
  );
}

export function IconRelatedCosts(props: IconProps) {
  return iconWrap(
    props,
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h4" />
    </>,
  );
}

export function IconNetProfit(props: IconProps) {
  return iconWrap(
    props,
    <>
      <path d="M4 16.5 10 10l4 4 6-7.5" />
      <path d="M14 6.5h6v6" />
    </>,
  );
}

export function IconPipelineValue(props: IconProps) {
  return iconWrap(
    props,
    <>
      <rect x="3" y="4" width="5" height="16" rx="1.5" />
      <rect x="9.5" y="8" width="5" height="12" rx="1.5" />
      <rect x="16" y="12" width="5" height="8" rx="1.5" />
    </>,
  );
}

export function IconSparkle(props: IconProps) {
  return iconWrap(
    props,
    <>
      <path d="M12 3.5 13.6 8.4 18.5 10 13.6 11.6 12 16.5 10.4 11.6 5.5 10 10.4 8.4Z" />
      <path d="M18 15.5 18.7 17.3 20.5 18 18.7 18.7 18 20.5 17.3 18.7 15.5 18 17.3 17.3Z" />
    </>,
  );
}
