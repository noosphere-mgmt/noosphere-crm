/** Feature flag: premises_v1 matching engine (R2 / Phase 42). */
export function isMatchEngineV1Enabled(): boolean {
  const raw = process.env.MATCH_ENGINE_V1?.trim().toLowerCase();
  if (raw === "0" || raw === "false" || raw === "off") return false;
  if (raw === "1" || raw === "true" || raw === "on") return true;
  // R2 approved — enabled by default; set MATCH_ENGINE_V1=0 to restore legacy matcher.
  return true;
}
