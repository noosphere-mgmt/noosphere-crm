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

/** Join contacts_v1.contact_id (TEXT) to a FK column that may be TEXT or legacy BIGINT. */
export function sqlJoinV1Contact(contactV1Alias: string, fkExpr: string): string {
  return `${contactV1Alias}.contact_id = ${fkExpr}::text`;
}

/** Join legacy companies.id to a FK column (bigint or text). Cast numeric side to text. */
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

/** OR-match a mixed v1/legacy company FK against v1 COMP param and legacy numeric string param. */
export function sqlMatchMixedCompanyFk(fkExpr: string, v1Param: string, legacyParam: string): string {
  return `(${fkExpr}::text = ${v1Param} OR ${fkExpr}::text = ${legacyParam})`;
}

/** Export canonical COMP-* id for a legacy companies.id (or pass-through when already v1). */
export function sqlExportCompanyId(idExpr: string): string {
  return `COALESCE(
    (SELECT cv1.company_id FROM companies_v1 cv1 WHERE cv1.company_id = ${idExpr}::text LIMIT 1),
    (SELECT m.new_id FROM id_map_v1 m WHERE m.entity_type = 'company' AND m.legacy_id::text = ${idExpr}::text LIMIT 1),
    (SELECT cv1.company_id FROM companies_v1 cv1 WHERE cv1.legacy_company_id::text = ${idExpr}::text LIMIT 1),
    NULLIF(${idExpr}::text, '')
  )`;
}

/** Export canonical CONT-* id for a legacy contacts.id (or pass-through when already v1). */
export function sqlExportContactId(idExpr: string): string {
  return `COALESCE(
    (SELECT cv1.contact_id FROM contacts_v1 cv1 WHERE cv1.contact_id = ${idExpr}::text LIMIT 1),
    (SELECT m.new_id FROM id_map_v1 m WHERE m.entity_type = 'contact' AND m.legacy_id::text = ${idExpr}::text LIMIT 1),
    (SELECT cv1.contact_id FROM contacts_v1 cv1 WHERE cv1.legacy_contact_id::text = ${idExpr}::text LIMIT 1),
    NULLIF(${idExpr}::text, '')
  )`;
}

/** Normalize relationship endpoint ids to v1 business ids for export. */
export function sqlExportRelationshipEntityId(typeExpr: string, idExpr: string): string {
  return `CASE ${typeExpr}
    WHEN 'company' THEN ${sqlExportCompanyId(idExpr)}
    WHEN 'contact' THEN ${sqlExportContactId(idExpr)}
    ELSE NULLIF(${idExpr}::text, '')
  END`;
}

/** SQL subquery for relationship endpoint display name. */
export function sqlRelationshipEntityName(typeExpr: string, idExpr: string): string {
  return `CASE ${typeExpr}
    WHEN 'company' THEN COALESCE(
      (SELECT c.company_name FROM companies c WHERE ${sqlJoinLegacyCompany("c", idExpr)} LIMIT 1),
      (SELECT cv1.company_name_en FROM companies_v1 cv1 WHERE cv1.company_id = ${idExpr}::text LIMIT 1)
    )
    WHEN 'contact' THEN COALESCE(
      (SELECT COALESCE(ct.display_name::text, ct.contact_name::text)
       FROM contacts ct WHERE ${sqlJoinLegacyContact("ct", idExpr)} LIMIT 1),
      (SELECT cv1.display_name FROM contacts_v1 cv1 WHERE cv1.contact_id = ${idExpr}::text LIMIT 1)
    )
    ELSE NULL
  END`;
}
