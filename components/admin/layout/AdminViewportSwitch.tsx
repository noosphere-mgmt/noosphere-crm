import type { ReactNode } from "react";
import {
  ADMIN_DESKTOP_ONLY_CLASS,
  ADMIN_MOBILE_ONLY_CLASS,
} from "@/lib/adminViewport";

/**
 * Renders exactly one presentation tree per viewport band.
 * Mobile and desktop are separate component trees — not responsive variants of one layout.
 */
export function AdminViewportSwitch({
  mobile,
  desktop,
}: {
  mobile: ReactNode;
  desktop: ReactNode;
}) {
  return (
    <>
      <div className={ADMIN_MOBILE_ONLY_CLASS}>{mobile}</div>
      <div className={ADMIN_DESKTOP_ONLY_CLASS}>{desktop}</div>
    </>
  );
}

export function AdminMobileOnly({ children }: { children: ReactNode }) {
  return <div className={ADMIN_MOBILE_ONLY_CLASS}>{children}</div>;
}

export function AdminDesktopOnly({ children }: { children: ReactNode }) {
  return <div className={ADMIN_DESKTOP_ONLY_CLASS}>{children}</div>;
}
