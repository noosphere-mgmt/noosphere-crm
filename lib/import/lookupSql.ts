/** SQL expression for human-readable premises label (matches formatPremisesName). */
export function sqlPremisesLabel(pmAlias = "pm", bAlias = "b"): string {
  return `CASE
    WHEN NULLIF(trim(${pmAlias}.office_name), '') IS NOT NULL THEN trim(${pmAlias}.office_name)
    ELSE NULLIF(trim(concat_ws(' - ',
      NULLIF(trim(${bAlias}.bldg_name_en), ''),
      CASE WHEN NULLIF(trim(${pmAlias}.floor), '') IS NOT NULL THEN
        CASE WHEN trim(${pmAlias}.floor) ~* '/f$' THEN trim(${pmAlias}.floor)
        ELSE trim(${pmAlias}.floor) || '/F' END
      END,
      CASE WHEN NULLIF(trim(${pmAlias}.unit), '') IS NOT NULL THEN
        '#' || trim(regexp_replace(${pmAlias}.unit, '^#+', ''))
      END
    )), '')
  END`;
}

/** SQL expression for a readable activity summary. */
export function sqlActivityLabel(aAlias = "a"): string {
  return `trim(concat_ws(' · ',
    ${aAlias}.activity_type,
    ${aAlias}.activity_date::text,
    nullif(left(coalesce(${aAlias}.notes, ''), 80), '')
  ))`;
}

/** Join companies_v1.company_id (TEXT) to a FK column that may be TEXT or legacy BIGINT. */
export function sqlJoinV1Company(companyV1Alias: string, fkExpr: string): string {
  return `${companyV1Alias}.company_id = ${fkExpr}::text`;
}

export function sqlJoinLegacyCompany(companyAlias: string, fkExpr: string): string {
  return `${companyAlias}.id::text = ${fkExpr}::text`;
}

/** Join legacy contacts.id to a FK column (bigint or text). Cast numeric side to text. */
export function sqlJoinLegacyContact(contactAlias: string, fkExpr: string): string {
  return `${contactAlias}.id::text = ${fkExpr}::text`;
}

/** Join legacy opportunities.id to a FK column (bigint or text). Cast numeric side to text. */
export function sqlJoinLegacyOpportunity(opportunityAlias: string, fkExpr: string): string {
  return `${opportunityAlias}.id::text = ${fkExpr}::text`;
}

/** SQL subquery for relationship endpoint display name. */
export function sqlRelationshipEntityName(typeExpr: string, idExpr: string): string {
  return `CASE ${typeExpr}
    WHEN 'company' THEN COALESCE(
      (SELECT c.company_name FROM companies c WHERE ${sqlJoinLegacyCompany("c", idExpr)} LIMIT 1),
      (SELECT cv1.company_name_en FROM companies_v1 cv1 WHERE cv1.company_id = ${idExpr}::text LIMIT 1)
    )
    WHEN 'contact' THEN (
      SELECT COALESCE(ct.display_name::text, ct.contact_name::text)
      FROM contacts ct WHERE ${sqlJoinLegacyContact("ct", idExpr)} LIMIT 1
    )
    ELSE NULL
  END`;
}
