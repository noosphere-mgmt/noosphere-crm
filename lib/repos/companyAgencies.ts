import { query } from "@/lib/db";
import { sqlContactDisplayName } from "@/lib/contactName";
import { sqlContactListVisible } from "@/lib/contactVisibility";

export type AgencyPerson = {
  id: number;
  contact_name: string;
  business_id: string | null;
};

export type CompanyAgencySide = {
  id: number;
  company_id: number;
  company_name: string;
  company_business_id: string | null;
  agency_company_id: number;
  agency_name: string;
  agency_business_id: string | null;
  people: AgencyPerson[];
};

export type CompanyAgencyView = {
  agencies: CompanyAgencySide[];
  clients: CompanyAgencySide[];
};

type LinkRow = {
  id: string;
  company_id: string;
  company_name: string;
  company_business_id: string | null;
  agency_company_id: string;
  agency_name: string;
  agency_business_id: string | null;
};

function mapLink(row: LinkRow, people: AgencyPerson[]): CompanyAgencySide {
  return {
    id: Number(row.id),
    company_id: Number(row.company_id),
    company_name: row.company_name,
    company_business_id: row.company_business_id,
    agency_company_id: Number(row.agency_company_id),
    agency_name: row.agency_name,
    agency_business_id: row.agency_business_id,
    people,
  };
}

async function peopleByCompany(companyIds: number[]): Promise<Map<number, AgencyPerson[]>> {
  const grouped = new Map<number, AgencyPerson[]>();
  if (companyIds.length === 0) return grouped;
  const rows = await query<{
    id: string;
    company_id: string;
    contact_name: string;
    business_id: string | null;
  }>(
    `SELECT c.id::text AS id,
            c.company_id::text AS company_id,
            ${sqlContactDisplayName("c")} AS contact_name,
            c.business_id
     FROM contacts c
     WHERE c.company_id = ANY($1::bigint[])
       AND ${sqlContactListVisible("c")}
     ORDER BY ${sqlContactDisplayName("c")} ASC`,
    [companyIds],
  );
  for (const row of rows) {
    const companyId = Number(row.company_id);
    const people = grouped.get(companyId) ?? [];
    people.push({
      id: Number(row.id),
      contact_name: row.contact_name,
      business_id: row.business_id,
    });
    grouped.set(companyId, people);
  }
  return grouped;
}

export async function listCompanyAgencyView(companyId: number): Promise<CompanyAgencyView> {
  const rows = await query<LinkRow>(
    `SELECT a.id::text AS id,
            a.company_id::text AS company_id,
            client.company_name,
            client.business_id AS company_business_id,
            a.agency_company_id::text AS agency_company_id,
            agency.company_name AS agency_name,
            agency.business_id AS agency_business_id
     FROM company_agencies a
     JOIN companies client ON client.id = a.company_id
     JOIN companies agency ON agency.id = a.agency_company_id
     WHERE a.company_id = $1 OR a.agency_company_id = $1
     ORDER BY client.company_name ASC, agency.company_name ASC`,
    [companyId],
  );
  const people = await peopleByCompany(
    rows.flatMap((row) => [Number(row.company_id), Number(row.agency_company_id)]),
  );
  const agencies: CompanyAgencySide[] = [];
  const clients: CompanyAgencySide[] = [];
  for (const row of rows) {
    if (Number(row.company_id) === companyId) {
      agencies.push(mapLink(row, people.get(Number(row.agency_company_id)) ?? []));
    }
    if (Number(row.agency_company_id) === companyId) {
      clients.push(mapLink(row, people.get(Number(row.company_id)) ?? []));
    }
  }
  return { agencies, clients };
}

export async function listCompanyAgencyLinks(): Promise<{ company_id: number; agency_company_id: number }[]> {
  const rows = await query<{ company_id: string; agency_company_id: string }>(
    `SELECT company_id::text AS company_id, agency_company_id::text AS agency_company_id
     FROM company_agencies`,
  );
  return rows.map((row) => ({
    company_id: Number(row.company_id),
    agency_company_id: Number(row.agency_company_id),
  }));
}

export function linkedCompanyIdsFor(
  contactCompanyId: number | null | undefined,
  links: { company_id: number; agency_company_id: number }[],
): number[] {
  if (contactCompanyId == null) return [];
  const linked = new Set<number>();
  for (const link of links) {
    if (link.company_id === contactCompanyId) linked.add(link.agency_company_id);
    if (link.agency_company_id === contactCompanyId) linked.add(link.company_id);
  }
  linked.delete(contactCompanyId);
  return [...linked];
}

export async function addCompanyAgency(companyId: number, agencyCompanyId: number): Promise<number> {
  if (companyId === agencyCompanyId) throw new Error("A company cannot be its own agency.");
  const existing = await query<{ id: string; company_id: string; agency_company_id: string }>(
    `SELECT id::text AS id, company_id::text AS company_id, agency_company_id::text AS agency_company_id
     FROM company_agencies
     WHERE (company_id = $1 AND agency_company_id = $2)
        OR (company_id = $2 AND agency_company_id = $1)`,
    [companyId, agencyCompanyId],
  );
  if (existing[0]) {
    const sameDirection =
      Number(existing[0].company_id) === companyId && Number(existing[0].agency_company_id) === agencyCompanyId;
    if (sameDirection) return Number(existing[0].id);
    throw new Error("These companies are already linked.");
  }
  const rows = await query<{ id: string }>(
    `INSERT INTO company_agencies (company_id, agency_company_id)
     VALUES ($1, $2)
     RETURNING id::text AS id`,
    [companyId, agencyCompanyId],
  );
  return Number(rows[0]!.id);
}

export async function removeCompanyAgency(linkId: number): Promise<void> {
  await query(`DELETE FROM company_agencies WHERE id = $1`, [linkId]);
}
