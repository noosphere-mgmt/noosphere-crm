/**
 * Admin UI viewport breakpoints.
 *
 * - Mobile:  width < 768px  (Tailwind: default, hidden from `md:`)
 * - Tablet:  768px–1023px  → uses Desktop presentation (temporary)
 * - Desktop: width ≥ 768px  (`md:` and up; workstation layout at `lg:`+)
 *
 * Use `AdminViewportSwitch` — mounts one tree after viewport is known (not both with CSS hide).
 */
export const ADMIN_MOBILE_MAX_PX = 767;
export const ADMIN_DESKTOP_MIN_PX = 768;
export const ADMIN_WORKSTATION_MIN_PX = 1024;

/** Show only below 768px */
export const ADMIN_MOBILE_ONLY_CLASS = "md:hidden";

/** Show from 768px up (tablet + desktop) */
export const ADMIN_DESKTOP_ONLY_CLASS = "hidden md:block";
