"use client";

import { useTransition } from "react";
import { updateProposedPremisesLineAction } from "@/app/admin/opportunities/workspaceActions";
import { FormField, TextAreaField } from "@/components/admin/AdminFormFields";
import { FormEditingContext } from "@/components/admin/ModuleActionBar";
import {
  PremisesField,
  PremisesSectionCard,
  PremisesSnapshotChip,
} from "@/components/admin/properties-v1/premisesDrawerUi";
import {
  formatProposedPremisesAskingPrice,
  formatProposedPremisesListingIntent,
  formatProposedPremisesListingStatus,
  formatProposedPremisesProposedPrice,
  formatProposedPremisesSpace,
  formatProposedPremisesTourDate,
  proposedPremisesEffectivePrice,
  proposedPremisesEffectiveTourDate,
  proposedPremisesListingRemarks,
  proposedPremisesPriceFieldLabel,
  proposedPremisesTourDateSource,
} from "@/lib/proposedPremisesDisplay";
import { monthlyRentFieldLabel } from "@/lib/premisesCommercial";
import {
  FEE_STATUSES,
  FEE_STATUS_LABELS,
  PROPOSED_PREMISES_PREFERENCES,
  PROPOSED_PREMISES_PREFERENCE_LABELS,
  PROPOSED_PREMISES_STATUSES,
  PROPOSED_PREMISES_STATUS_LABELS,
} from "@/lib/opportunityValues";
import type { OpportunityProposedPremises } from "@/lib/types/entities";

const selectClass = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm";
const grid2 = "grid w-full grid-cols-2 gap-x-4 gap-y-3";
const FEE_STATUS_OPTIONS = FEE_STATUSES.filter((s) => s !== "not_applicable");

function HiddenField({ name, value }: { name: string; value: string | number | null | undefined }) {
  if (value == null || value === "") return null;
  return <input type="hidden" name={name} value={String(value)} />;
}

export function ProposedPremisesLinePanel({
  line,
  opportunityId,
  onClose,
}: {
  line: OpportunityProposedPremises | null;
  opportunityId: number;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();

  if (!line) return null;

  const update = updateProposedPremisesLineAction.bind(null, line.id);
  const space = formatProposedPremisesSpace(line);
  const askingPrice = formatProposedPremisesAskingPrice(line);
  const proposedPrice = formatProposedPremisesProposedPrice(line);
  const effectivePrice = proposedPremisesEffectivePrice(line);
  const tourDate = proposedPremisesEffectiveTourDate(line);
  const tourSource = proposedPremisesTourDateSource(line);
  const remarks = proposedPremisesListingRemarks(line);
  const priceLabel = proposedPremisesPriceFieldLabel(line);
  const askingLabel =
    line.inventory_status?.toLowerCase().includes("sale")
      ? "Asking sale price"
      : monthlyRentFieldLabel(line.operating_model);

  return (
    <>
      <button type="button" className="fixed inset-0 z-40 bg-slate-900/10" aria-label="Close" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-slate-200 bg-slate-50 shadow-xl lg:w-[min(720px,48vw)]">
        <div className="sticky top-0 z-10 shrink-0 border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-slate-500">Proposed premises</p>
              <h2 className="text-base font-semibold text-slate-900">{line.building_name ?? "Premises"}</h2>
              <p className="text-sm text-slate-600">{space}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <PremisesSnapshotChip>
                  {PROPOSED_PREMISES_STATUS_LABELS[line.status] ?? line.status}
                </PremisesSnapshotChip>
                {line.preference ? (
                  <PremisesSnapshotChip>
                    {PROPOSED_PREMISES_PREFERENCE_LABELS[line.preference] ?? line.preference}
                  </PremisesSnapshotChip>
                ) : null}
                {tourDate ? (
                  <PremisesSnapshotChip>
                    Tour {formatProposedPremisesTourDate(line)}
                    {tourSource === "activity" ? " · activity" : ""}
                  </PremisesSnapshotChip>
                ) : null}
                {proposedPrice !== "—" ? <PremisesSnapshotChip>{proposedPrice}</PremisesSnapshotChip> : null}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-lg leading-none text-slate-400 hover:bg-slate-100"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        <FormEditingContext.Provider value={true}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              fd.set("opportunity_id", String(opportunityId));
              startTransition(async () => {
                await update(fd);
                onClose();
              });
            }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
              <PremisesSectionCard title="Premises info">
                <dl className={`${grid2} sm:grid-cols-3`}>
                  <PremisesField label="Building" value={line.building_name ?? "—"} />
                  <PremisesField label="Space" value={space} />
                  <PremisesField label="Operator / owner" value={line.operator_name ?? line.owner_name ?? "—"} />
                  <PremisesField
                    label="Area"
                    value={line.gross_area_sqft ? `${line.gross_area_sqft} sq ft` : "—"}
                  />
                  <PremisesField label="Desks" value={String(line.workstation_count ?? line.capacity_pax ?? "—")} />
                  <PremisesField label="Listing intent" value={formatProposedPremisesListingIntent(line)} />
                  <PremisesField label="Listing status" value={formatProposedPremisesListingStatus(line)} />
                  <PremisesField label={askingLabel} value={askingPrice} />
                </dl>
              </PremisesSectionCard>

              <PremisesSectionCard title="Proposal">
                <div className={grid2}>
                  <label className="block min-w-0 text-sm">
                    <span className="text-xs text-slate-500">{priceLabel}</span>
                    <input
                      type="number"
                      name="proposed_price"
                      defaultValue={effectivePrice}
                      className={selectClass}
                    />
                  </label>
                  <label className="block min-w-0 text-sm">
                    <span className="text-xs text-slate-500">Tour date</span>
                    <input
                      type="date"
                      name="tour_date"
                      defaultValue={tourDate}
                      className={selectClass}
                    />
                    {tourSource === "activity" ? (
                      <p className="mt-1 text-[10px] text-slate-500">Prefilled from site tour activity — save to store on this line</p>
                    ) : null}
                  </label>
                  <label className="block min-w-0 text-sm">
                    <span className="text-xs text-slate-500">Status</span>
                    <select name="status" defaultValue={line.status} className={selectClass}>
                      {PROPOSED_PREMISES_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {PROPOSED_PREMISES_STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block min-w-0 text-sm">
                    <span className="text-xs text-slate-500">Preference</span>
                    <select name="preference" defaultValue={line.preference ?? ""} className={selectClass}>
                      <option value="">—</option>
                      {PROPOSED_PREMISES_PREFERENCES.map((p) => (
                        <option key={p} value={p}>
                          {PROPOSED_PREMISES_PREFERENCE_LABELS[p]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="col-span-2">
                    <TextAreaField label="Remarks" name="remarks" rows={2} defaultValue={remarks} />
                  </div>
                </div>
                <HiddenField name="proposed_price_psf" value={line.proposed_price_psf} />
              </PremisesSectionCard>

              <PremisesSectionCard title="Fee information">
                <div className={grid2}>
                  <FormField
                    label="Expected collect fee"
                    name="collect_fee_amount"
                    type="number"
                    defaultValue={line.collect_fee_amount ?? ""}
                  />
                  <label className="block min-w-0 text-sm">
                    <span className="text-xs text-slate-500">Collect fee status</span>
                    <select
                      name="collect_fee_status"
                      defaultValue={line.collect_fee_status ?? "expected"}
                      className={selectClass}
                    >
                      {FEE_STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {FEE_STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <FormField
                    label="Expected paid out fee"
                    name="paid_out_fee_amount"
                    type="number"
                    defaultValue={line.paid_out_fee_amount ?? ""}
                  />
                  <label className="block min-w-0 text-sm">
                    <span className="text-xs text-slate-500">Paid out status</span>
                    <select
                      name="paid_out_status"
                      defaultValue={line.paid_out_status ?? "expected"}
                      className={selectClass}
                    >
                      {FEE_STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {FEE_STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="col-span-2">
                    <TextAreaField label="Fee remarks" name="fee_remarks" rows={2} defaultValue={line.fee_remarks ?? ""} />
                  </div>
                </div>
                <HiddenField name="collect_fee_basis" value={line.collect_fee_basis} />
                <HiddenField name="collect_fee_from_company_id" value={line.collect_fee_from_company_id} />
                <HiddenField name="paid_out_fee_basis" value={line.paid_out_fee_basis} />
                <HiddenField name="paid_out_to_company_id" value={line.paid_out_to_company_id} />
              </PremisesSectionCard>
            </div>

            <div className="sticky bottom-0 flex shrink-0 justify-end gap-2 border-t border-slate-200 bg-white px-4 py-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
              >
                Save line
              </button>
            </div>
          </form>
        </FormEditingContext.Provider>
      </aside>
    </>
  );
}
