/** Safe in-app return paths for full-page workspace back/close navigation. */

export function sanitizeAdminReturnTo(
  raw: string | null | undefined,
  fallback: string,
): string {
  const value = String(raw ?? "").trim();
  if (!value.startsWith("/admin/")) return fallback;
  // Reject protocol-relative / absolute URLs smuggled into the query.
  if (value.startsWith("//") || value.includes("://")) return fallback;
  return value;
}

export function withAdminReturnTo(href: string, returnTo?: string | null): string {
  const safe = returnTo ? sanitizeAdminReturnTo(returnTo, "") : "";
  if (!safe) return href;
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}returnTo=${encodeURIComponent(safe)}`;
}

/** Short label for ← Back link based on destination path. */
export function adminReturnToLabel(returnTo: string, fallback = "Back"): string {
  const path = (returnTo.split("?")[0] ?? returnTo).replace(/\/$/, "") || "/admin";
  if (path === "/admin/connections/channel-tree") return "Channel Tree";
  if (/^\/admin\/companies\/[^/]+$/.test(path)) return "Company";
  if (/^\/admin\/contacts\/[^/]+$/.test(path)) return "Contact";
  if (/^\/admin\/opportunities\/[^/]+$/.test(path)) return "Opportunity";
  if (path.startsWith("/admin/opportunities")) return "Opportunities";
  if (path.startsWith("/admin/companies")) return "Companies";
  if (path.startsWith("/admin/contacts")) return "Contacts";
  if (path.startsWith("/admin/properties")) return "Properties";
  if (path.startsWith("/admin/activities")) return "Activities";
  if (path.startsWith("/admin/leads")) return "Leads";
  if (path.startsWith("/admin/connections")) return "Connections";
  if (path.startsWith("/admin/dashboard")) return "Dashboard";
  return fallback;
}
