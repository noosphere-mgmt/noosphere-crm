import type { CSSProperties } from "react";
import type { OpportunityStatus } from "@/lib/types/entities";

export const OPPORTUNITY_STATUS_COLORS: Record<OpportunityStatus, string> = {
  qualifying: "#64748B",
  sourcing: "#0EA5E9",
  proposal_reviewing: "#8B5CF6",
  negotiating: "#F59E0B",
  closed_won: "#10B981",
  closed_lost: "#EF4444",
};

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.trim().replace("#", "");
  const raw = normalized.length === 3 ? normalized.split("").map((c) => c + c).join("") : normalized;
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function opportunityStatusChip(status: OpportunityStatus): {
  className: string;
  style: CSSProperties;
} {
  const color = OPPORTUNITY_STATUS_COLORS[status] ?? OPPORTUNITY_STATUS_COLORS.qualifying;
  return {
    className: "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold",
    style: {
      color,
      borderColor: hexToRgba(color, 0.35),
      backgroundColor: hexToRgba(color, 0.12),
    },
  };
}
