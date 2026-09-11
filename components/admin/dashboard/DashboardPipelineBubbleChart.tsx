"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { formatCount } from "@/components/admin/dashboard/dashboardShared";
import {
  layoutPipelineOpportunityChart,
  PIPELINE_CHART_PAD,
  PIPELINE_CHART_SIZE,
  PIPELINE_UNSCHEDULED_BAND,
} from "@/lib/dashboardPipelineChart";
import { PIPELINE_STATUS_COLOURS, type PipelineOpportunityPoint } from "@/lib/dashboardPipelineStages";
import { formatOpportunityActionDate, OPPORTUNITY_STATUS_LABELS } from "@/lib/lookups";
import { formatOpportunityMoney, formatOpportunityMoneyCompact } from "@/lib/opportunityFinancials";

const { width: WIDTH, height: HEIGHT } = PIPELINE_CHART_SIZE;

const STATUS_LEGEND = [
  { id: "qualifying", label: OPPORTUNITY_STATUS_LABELS.qualifying },
  { id: "sourcing", label: OPPORTUNITY_STATUS_LABELS.sourcing },
  { id: "proposal_reviewing", label: OPPORTUNITY_STATUS_LABELS.proposal_reviewing },
  { id: "negotiating", label: OPPORTUNITY_STATUS_LABELS.negotiating },
] as const;

export function DashboardPipelineBubbleChart({
  points,
  pipelineValue,
}: {
  points: PipelineOpportunityPoint[];
  pipelineValue: number;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const [hoverId, setHoverId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const plot = useMemo(() => layoutPipelineOpportunityChart(points), [points]);
  const hover = plot.bubbles.find((bubble) => bubble.id === hoverId) ?? null;
  const selected = plot.bubbles.find((bubble) => bubble.id === selectedId) ?? null;

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setSelectedId(null);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedId(null);
    }
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <section
      ref={rootRef}
      className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-200/80 bg-white px-2.5 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.05)] lg:px-3 lg:py-2.5"
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-slate-900">Pipeline Analysis</h2>
          <p className="text-[11px] text-slate-500">
            {formatCount(points.length)} active · {formatOpportunityMoneyCompact(pipelineValue)}
            {plot.unscheduledCount > 0 ? ` · ${formatCount(plot.unscheduledCount)} unscheduled` : ""}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
          Active only
        </span>
      </div>

      <div className="relative min-h-0 flex-1">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-[16.5rem] w-full lg:h-[17.5rem]"
          role="img"
          aria-label="Pipeline analysis: one bubble per active opportunity"
        >
          {plot.gridY.map((tick) => (
            <g key={tick.value}>
              <line x1={plot.plotLeft} x2={WIDTH - 12} y1={tick.y} y2={tick.y} stroke="#e2e8f0" strokeWidth="1" />
              <text x={plot.plotLeft - 6} y={tick.y + 3} textAnchor="end" className="fill-slate-400" fontSize="8">
                {tick.label}
              </text>
            </g>
          ))}
          {plot.hasUnscheduledBand ? (
            <rect
              x={PIPELINE_CHART_PAD.left}
              y={PIPELINE_CHART_PAD.top}
              width={PIPELINE_UNSCHEDULED_BAND}
              height={HEIGHT - PIPELINE_CHART_PAD.top - PIPELINE_CHART_PAD.bottom}
              fill="#f8fafc"
              rx="6"
            />
          ) : null}
          {plot.gridX.map((tick) => (
            <text key={`${tick.label}-${tick.x}`} x={tick.x} y={HEIGHT - 10} textAnchor="middle" className="fill-slate-400" fontSize="7.5">
              {tick.label}
            </text>
          ))}
          <text
            x="11"
            y={HEIGHT / 2}
            textAnchor="middle"
            className="fill-slate-500"
            fontSize="8"
            transform={`rotate(-90 11 ${HEIGHT / 2})`}
          >
            Chance
          </text>
          {plot.bubbles.map((bubble) => (
            <g
              key={bubble.id}
              className="cursor-pointer"
              onMouseEnter={() => setHoverId(bubble.id)}
              onMouseLeave={() => setHoverId((current) => (current === bubble.id ? null : current))}
              onClick={(event) => {
                event.stopPropagation();
                setSelectedId(bubble.id);
              }}
            >
              <circle
                cx={bubble.x}
                cy={bubble.y}
                r={bubble.r}
                fill={bubble.colour}
                fillOpacity={selectedId && selectedId !== bubble.id ? 0.35 : hoverId && hoverId !== bubble.id ? 0.55 : 0.88}
                stroke="white"
                strokeWidth="2"
                role="button"
                tabIndex={0}
                aria-label={`${bubble.name}, ${bubble.statusLabel}, ${formatOpportunityMoney(bubble.value)}`}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedId(bubble.id);
                  }
                }}
              />
              {bubble.showLabel ? (
                <>
                  <text
                    x={bubble.x}
                    y={bubble.y - 3}
                    textAnchor="middle"
                    className="pointer-events-none fill-white font-semibold"
                    fontSize="8"
                  >
                    {formatOpportunityMoneyCompact(bubble.value)}
                  </text>
                  <text
                    x={bubble.x}
                    y={bubble.y + 8}
                    textAnchor="middle"
                    className="pointer-events-none fill-white"
                    fontSize="7"
                  >
                    {bubble.chance == null ? "—" : `${bubble.chance}%`}
                  </text>
                </>
              ) : null}
            </g>
          ))}
        </svg>

        {hover && !selected ? (
          <div
            className="pointer-events-none absolute z-10 max-w-[14rem] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] shadow-md max-lg:hidden"
            style={popoverStyle(hover.x, hover.y)}
          >
            <p className="font-semibold text-slate-900">{hover.name}</p>
            <p className="text-slate-600">{hover.statusLabel}</p>
            <p className="tabular-nums text-slate-600">{formatOpportunityMoney(hover.value)}</p>
          </div>
        ) : null}

        {selected ? (
          <div
            className="absolute z-20 w-[min(15.5rem,calc(100%-1rem))] rounded-xl border border-slate-200 bg-white p-3 text-[12px] shadow-lg max-lg:left-2 max-lg:right-2 max-lg:top-3 max-lg:w-auto lg:left-[var(--pop-left)] lg:top-[var(--pop-top)]"
            style={{ "--pop-left": popoverStyle(selected.x, selected.y, true).left, "--pop-top": popoverStyle(selected.x, selected.y, true).top } as CSSProperties}
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-sm font-semibold text-slate-900">{selected.name}</p>
            {selected.company ? <p className="mt-0.5 text-slate-600">{selected.company}</p> : null}
            <dl className="mt-2 space-y-1 text-slate-600">
              <div className="flex justify-between gap-2">
                <dt>Stage</dt>
                <dd className="font-medium text-slate-800">{selected.statusLabel}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Probability</dt>
                <dd className="font-medium tabular-nums text-slate-800">
                  {selected.chance == null ? "—" : `${selected.chance}%`}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Value</dt>
                <dd className="font-medium tabular-nums text-slate-800" title={formatOpportunityMoney(selected.value)}>
                  {formatOpportunityMoney(selected.value)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Expected Close</dt>
                <dd className="font-medium text-slate-800">{formatOpportunityActionDate(selected.expectedClose)}</dd>
              </div>
            </dl>
            <Link
              href={selected.href}
              className="mt-2.5 inline-flex text-[12px] font-semibold text-violet-700 hover:text-violet-900"
            >
              View Opportunity →
            </Link>
          </div>
        ) : null}
      </div>

      <ul className="mt-1 flex flex-wrap gap-x-2.5 gap-y-0.5 text-[10px] text-slate-600 sm:gap-x-3 sm:text-[11px]">
        {STATUS_LEGEND.map((status) => (
          <li key={status.id} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIPELINE_STATUS_COLOURS[status.id] }} />
            {status.label}
          </li>
        ))}
      </ul>
    </section>
  );
}

function popoverStyle(x: number, y: number, detail = false): { left: string; top: string } {
  const leftPct = Math.min(68, Math.max(2, (x / WIDTH) * 100 - (detail ? 8 : 4)));
  const topPct = Math.min(58, Math.max(2, (y / HEIGHT) * 100 + 6));
  return { left: `${leftPct}%`, top: `${topPct}%` };
}
