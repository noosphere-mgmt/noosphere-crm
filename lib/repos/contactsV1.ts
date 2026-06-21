import { cache } from "react";
import { query } from "@/lib/db";

export type ContactV1Option = {
  contact_id: string;
  display_name: string;
  company_id: string | null;
};

export const listContactV1Options = cache(async function listContactV1Options(): Promise<ContactV1Option[]> {
  const v1 = await query<ContactV1Option>(
    `SELECT contact_id, COALESCE(display_name, contact_id) AS display_name, company_id
     FROM contacts_v1
     ORDER BY display_name ASC NULLS LAST, contact_id ASC`,
  );
  if (v1.length > 0) return v1;

  return query<ContactV1Option>(
    `SELECT ('legacy:' || c.id::text) AS contact_id,
            c.contact_name AS display_name,
            COALESCE(m.new_id, 'legacy:' || c.company_id::text) AS company_id
     FROM contacts c
     LEFT JOIN id_map_v1 m ON m.entity_type = 'company' AND m.legacy_id = c.company_id
     WHERE c.is_active = TRUE
     ORDER BY c.contact_name ASC`,
  );
});
