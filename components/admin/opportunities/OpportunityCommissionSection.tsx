"use client";

import { useEffect, useState } from "react";
import { FormField } from "@/components/admin/AdminFormFields";
import { useFormEditing } from "@/components/admin/ModuleActionBar";
import { InlineTextField } from "@/components/admin/inline/InlineFields";
import {
  formatOpportunityMoney,
  isRealisedWonRevenue,
  opportunityNetProfit,
  parseOpportunityMoney,
} from "@/lib/opportunityFinancials";
import type { Opportunity } from "@/lib/types/entities";

const labelClass = "text-[10px] font-semibold uppercase tracking-wide text-slate-500";

export function OpportunityCommissionSection({
  opportunity,
  onSaveField,
}: {
  opportunity: Opportunity;
  onSaveField?: (field: "commission_income" | "related_costs") => (value: unknown) => Promise<{
    ok: boolean;
    error?: string;
  }>;
}) {
  const editing = useFormEditing();
  const [incomeDraft, setIncomeDraft] = useState(opportunity.commission_income ?? "");
  const [costsDraft, setCostsDraft] = useState(opportunity.related_costs ?? "");

  useEffect(() => {
    setIncomeDraft(opportunity.commission_income ?? "");
    setCostsDraft(opportunity.related_costs ?? "");
  }, [opportunity.id, opportunity.commission_income, opportunity.related_costs]);

  const income = parseOpportunityMoney(editing ? incomeDraft : opportunity.commission_income);
  const costs = parseOpportunityMoney(editing ? costsDraft : opportunity.related_costs);
  const profit = opportunityNetProfit(income, costs);
  const realised = isRealisedWonRevenue(opportunity.status);

  return (
    <section className="rounded-xl border border-[#d9d2c7] bg-[#fbfaf7] p-3">
      <div>
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[#6f665a]">Financials</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          {realised
            ? "Won revenue — counted in realised commission and net profit"
            : "Estimated values — counted as Won Revenue only when status is Won"}
        </p>
      </div>

      {editing ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <FormField
            label="Commission / Income (HKD)"
            name="commission_income"
            type="number"
            value={incomeDraft}
            onChange={(e) => setIncomeDraft(e.target.value)}
          />
          <FormField
            label="Related Costs (HKD)"
            name="related_costs"
            type="number"
            value={costsDraft}
            onChange={(e) => setCostsDraft(e.target.value)}
          />
        </div>
      ) : onSaveField ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <InlineTextField
            label="Commission / Income (HKD)"
            type="number"
            value={opportunity.commission_income}
            onSave={onSaveField("commission_income")}
            useGrouping={false}
          />
          <InlineTextField
            label="Related Costs (HKD)"
            type="number"
            value={opportunity.related_costs}
            onSave={onSaveField("related_costs")}
            useGrouping={false}
          />
        </div>
      ) : (
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          <div>
            <dt className={labelClass}>Commission / Income</dt>
            <dd className="mt-1 text-base font-semibold tabular-nums text-slate-900">
              {formatOpportunityMoney(income)}
            </dd>
          </div>
          <div>
            <dt className={labelClass}>Related Costs</dt>
            <dd className="mt-1 text-base font-semibold tabular-nums text-slate-900">
              {formatOpportunityMoney(costs)}
            </dd>
          </div>
        </dl>
      )}

      <div className="mt-3 flex items-center justify-between rounded-lg bg-white px-3 py-2 ring-1 ring-[#ddd5ca]">
        <span className={labelClass}>Net Profit</span>
        <strong
          className={`tabular-nums ${
            profit == null ? "text-slate-400" : profit < 0 ? "text-rose-700" : "text-emerald-700"
          }`}
        >
          {formatOpportunityMoney(profit)}
        </strong>
      </div>
    </section>
  );
}
