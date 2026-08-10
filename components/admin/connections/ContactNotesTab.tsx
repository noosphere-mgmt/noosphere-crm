"use client";

import { useCallback } from "react";
import { patchContactFieldAction } from "@/app/admin/contacts/actions";
import { DrawerOverviewCard } from "@/components/admin/connections/DrawerOverviewCard";
import { InlineTextAreaField } from "@/components/admin/inline/InlineFields";
import type { Contact } from "@/lib/types/entities";

export function ContactNotesTab({ contact }: { contact: Contact }) {
  const save = useCallback(
    (field: string) => async (value: unknown) => {
      const result = await patchContactFieldAction(contact.id, field, JSON.stringify(value));
      return { ok: result.ok, error: result.ok ? undefined : result.error };
    },
    [contact.id],
  );

  return (
    <DrawerOverviewCard title="Notes" columns={1} dense={false}>
      <InlineTextAreaField label="Internal remarks" value={contact.notes} onSave={save("notes")} />
    </DrawerOverviewCard>
  );
}
