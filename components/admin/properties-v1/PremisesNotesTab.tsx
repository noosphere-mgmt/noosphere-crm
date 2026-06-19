"use client";

import { PremisesField, PremisesSectionCard } from "@/components/admin/properties-v1/premisesDrawerUi";
import type { PremisesV1 } from "@/lib/repos/premisesV1";

export function PremisesNotesTab({ premises }: { premises: PremisesV1 }) {
  return (
    <div className="space-y-4">
      <PremisesSectionCard title="Notes">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <PremisesField label="Premises remarks" value={premises.remarks?.trim() || "—"} />
          </div>
          <div className="sm:col-span-2">
            <PremisesField label="Listing remarks" value={premises.listing_remarks?.trim() || "—"} />
          </div>
        </dl>
      </PremisesSectionCard>
    </div>
  );
}
