/**
 * Admin UI viewport breakpoints.
 *
 * - Mobile:  width < 768px  (Tailwind: default, hidden from `md:`)
 * - Tablet:  768px–1023px  → uses Desktop presentation (temporary)
 * - Desktop: width ≥ 768px  (`md:` and up; workstation layout at `lg:`+)
 *
 * Use `AdminViewportSwitch` — never mix mobile/desktop in one component with responsive hiding.
 */
export const ADMIN_MOBILE_MAX_PX = 767;
export const ADMIN_DESKTOP_MIN_PX = 768;
export const ADMIN_WORKSTATION_MIN_PX = 1024;

/** Show only below 768px */
export const ADMIN_MOBILE_ONLY_CLASS = "md:hidden";

/** Show from 768px up (tablet + desktop) */
export const ADMIN_DESKTOP_ONLY_CLASS = "hidden md:block";
