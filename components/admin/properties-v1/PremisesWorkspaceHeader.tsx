"use client";

import Link from "next/link";
import { IconX } from "@/components/admin/ModuleActionIcons";
import { moduleEditButtonClass } from "@/components/admin/ModuleActionBar";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import { RecordBusinessId } from "@/components/admin/RecordBusinessId";
import { formatPremisesBuildingLabel } from "@/lib/premisesDetailDisplay";
import { formatPremisesName } from "@/lib/premisesDisplay";
import { formatMoney } from "@/lib/formatCurrency";
import { PREMISES_ASSET_CLASSES, PREMISES_AVAILABILITY_STATUSES, PREMISES_MARKET_MODES, PREMISES_PRODUCT_SUBTYPES } from "@/lib/v1ListValues";
import { premisesWorkspaceHref } from "@/lib/premisesWorkspaceNav";
import type { PremisesV1 } from "@/lib/repos/premisesV1";
import type { PropertyV1SelectOption } from "@/lib/repos/propertiesV1";

export function PremisesWorkspaceHeader({
  premises,
  propertyOptions,
  lastActivityDate,
  onOpenBuilding,
  returnTo,
}: {
  premises: PremisesV1;
  propertyOptions: PropertyV1SelectOption[];
  lastActivityDate?: string | null;
  onOpenBuilding?: () => void;
  returnTo: string;
}) {
  const theme = moduleAccentClasses("properties");
  const businessId = premises.business_id;
  const buildingLabel = formatPremisesBuildingLabel(
    premises.property_name_en,
    premises.property_id,
    propertyOptions,
  );
  const premisesTitle = formatPremisesName(buildingLabel, premises.floor, premises.unit);
  const labelFor = (rows: readonly { value: string; label: string }[], value?: string | null) => rows.find((row) => row.value === value)?.label ?? value ?? null;
  const subtypeRows = premises.asset_class && premises.asset_class in PREMISES_PRODUCT_SUBTYPES
    ? PREMISES_PRODUCT_SUBTYPES[premises.asset_class as keyof typeof PREMISES_PRODUCT_SUBTYPES]
    : PREMISES_PRODUCT_SUBTYPES.unknown;
  const marketModeLabel = premises.market_mode === "lease_or_sale"
    ? "Lease · Sale"
    : labelFor(PREMISES_MARKET_MODES, premises.market_mode);
  const headline = premises.market_mode === "sale"
    ? formatMoney(premises.asking_sale_price, premises.currency ?? "HKD")
    : premises.market_mode === "lease_or_sale"
      ? `${formatMoney(premises.monthly_rent, premises.currency ?? "HKD")} / ${formatMoney(premises.asking_sale_price, premises.currency ?? "HKD")}`
      : formatMoney(premises.monthly_rent, premises.currency ?? "HKD");
  return (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Link href={returnTo} className={`inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold ${theme.link}`}>
              ← Back to premises list
            </Link>
            <div className="mt-1 flex flex-wrap items-start gap-x-4 gap-y-2">
              <div className="min-w-0">
                <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{premisesTitle}</h1>
                <RecordBusinessId id={businessId} className="mt-0.5 block" />
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
              <span>
                <span className="text-slate-500">Building </span>
                {onOpenBuilding ? (
                  <button type="button" onClick={onOpenBuilding} className="font-medium text-blue-800 hover:underline">
                    {buildingLabel}
                  </button>
                ) : (
                  <span>{buildingLabel}</span>
                )}
              </span>
              {lastActivityDate ? (
                <span className="text-slate-500">Last activity {lastActivityDate.slice(0, 10)}</span>
              ) : null}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {labelFor(PREMISES_ASSET_CLASSES, premises.asset_class) ? <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800">{labelFor(PREMISES_ASSET_CLASSES, premises.asset_class)}</span> : null}
              {labelFor(subtypeRows, premises.product_subtype) ? <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-800">{labelFor(subtypeRows, premises.product_subtype)}</span> : null}
              {marketModeLabel ? <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">{marketModeLabel}</span> : null}
              {labelFor(PREMISES_AVAILABILITY_STATUSES, premises.availability_status) ? <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">{labelFor(PREMISES_AVAILABILITY_STATUSES, premises.availability_status)}</span> : null}
              {headline !== "—" ? <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-800">{headline}</span> : null}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <Link
              href={premisesWorkspaceHref(premises, "activities", undefined, returnTo)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Log activity
            </Link>
            <Link
              href={premisesWorkspaceHref(premises, "overview", "edit", returnTo)}
              className={moduleEditButtonClass("properties")}
              aria-label="Edit premises"
              title="Edit premises"
            >Edit</Link>
            <Link
              href={returnTo}
              className="inline-flex rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              aria-label="Close"
              title="Close"
            >
              <IconX />
            </Link>
          </div>
        </div>
      </div>
  );
}
