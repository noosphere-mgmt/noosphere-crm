/** Feature flag: proposal generator (R3 / Phases 43–44). */
export function isProposalsEnabled(): boolean {
  const raw = process.env.PROPOSALS_ENABLED?.trim().toLowerCase();
  if (raw === "0" || raw === "false" || raw === "off") return false;
  if (raw === "1" || raw === "true" || raw === "on") return true;
  // R3 implemented — enabled by default; set PROPOSALS_ENABLED=0 to hide UI.
  return true;
}
