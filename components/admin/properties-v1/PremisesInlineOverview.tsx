"use client";

import { useCallback } from "react";
import { patchPremisesFieldAction } from "@/app/admin/properties/actions";
import { AdminViewportSwitch } from "@/components/admin/layout/AdminViewportSwitch";
import { PremisesInlineOverviewDesktop } from "@/components/admin/properties-v1/PremisesInlineOverviewDesktop";
import { PremisesInlineOverviewMobile } from "@/components/admin/properties-v1/PremisesInlineOverviewMobile";
import type { PremisesInlineOverviewProps } from "@/components/admin/properties-v1/premisesInlineOverviewShared";
import { PremisesSectionCard } from "@/components/admin/properties-v1/premisesDrawerUi";
import { InlineTextAreaField } from "@/components/admin/inline/InlineFields";
import type { PremisesV1 } from "@/lib/repos/premisesV1";

export function PremisesInlineOverview(props: PremisesInlineOverviewProps) {
  return (
    <AdminViewportSwitch
      mobile={<PremisesInlineOverviewMobile {...props} />}
      desktop={<PremisesInlineOverviewDesktop {...props} />}
    />
  );
}

export function PremisesInlineNotes({ premises }: { premises: PremisesV1 }) {
  const save = useCallback(
    (field: string) => async (value: unknown) => {
      const result = await patchPremisesFieldAction(premises.premises_id, field, JSON.stringify(value));
      return { ok: result.ok, error: result.ok ? undefined : result.error };
    },
    [premises.premises_id],
  );

  return (
    <PremisesSectionCard title="Notes">
      <div className="space-y-4">
        <InlineTextAreaField label="Premises remarks" value={premises.remarks} onSave={save("remarks")} />
        <InlineTextAreaField
          label="Listing remarks"
          value={premises.listing_remarks}
          onSave={save("listing_remarks")}
        />
      </div>
    </PremisesSectionCard>
  );
}
