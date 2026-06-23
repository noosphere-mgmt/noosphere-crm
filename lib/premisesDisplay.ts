function formatFloorSegment(floor: string): string {
  const trimmed = floor.trim();
  if (!trimmed) return "";
  if (/\/f$/i.test(trimmed)) return trimmed;
  return `${trimmed}/F`;
}

function formatUnitSegment(unit: string): string {
  const trimmed = unit.trim().replace(/^#+/, "");
  if (!trimmed) return "";
  return `#${trimmed}`;
}

/** Floor + unit only — for in-property premises tables (no building name). */
export function formatPremisesCompactLabel(
  floor: string | null | undefined,
  unit: string | null | undefined,
): string {
  const floorPart = formatFloorSegment(floor ?? "");
  const unitPart = formatUnitSegment(unit ?? "");
  if (floorPart && unitPart) return `${floorPart} - ${unitPart}`;
  if (floorPart) return floorPart;
  if (unitPart) return unitPart;
  return "—";
}

/** {Building Name} - {Floor}/F - #{Unit} — omits empty floor/unit segments. */
export function formatPremisesName(
  buildingName: string | null | undefined,
  floor: string | null | undefined,
  unit: string | null | undefined,
): string {
  const parts: string[] = [];

  const building = (buildingName ?? "").trim();
  if (building) parts.push(building);

  const floorPart = formatFloorSegment(floor ?? "");
  if (floorPart) parts.push(floorPart);

  const unitPart = formatUnitSegment(unit ?? "");
  if (unitPart) parts.push(unitPart);

  return parts.length > 0 ? parts.join(" - ") : "—";
}

/** Premises module list: {Building} | {Floor}/F - #{Unit} — one clickable label, building not linked separately. */
export function formatPremisesListLabel(
  buildingName: string | null | undefined,
  floor: string | null | undefined,
  unit: string | null | undefined,
): string {
  const building = (buildingName ?? "").trim();
  const compact = formatPremisesCompactLabel(floor, unit);
  if (building && compact !== "—") return `${building} | ${compact}`;
  if (building) return building;
  if (compact !== "—") return compact;
  return "—";
}

/** Market verification date for list display (YYYY-MM-DD). */
export function formatVerifiedDate(value: string | null | undefined): string {
  if (!value) return "—";
  const trimmed = value.trim();
  if (!trimmed) return "—";
  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : trimmed.slice(0, 10);
}

export function isPremisesForSale(status: string | null | undefined): boolean {
  const lower = (status ?? "").toLowerCase();
  return status === "For Sale" || lower.includes("sale");
}
