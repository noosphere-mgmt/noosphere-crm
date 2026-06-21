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

/** SQL subquery for relationship endpoint display name. */
export function sqlRelationshipEntityName(typeExpr: string, idExpr: string): string {
  return `CASE ${typeExpr}
    WHEN 'company' THEN (
      SELECT c.company_name FROM companies c WHERE c.id::text = ${idExpr} LIMIT 1
    )
    WHEN 'contact' THEN (
      SELECT COALESCE(ct.display_name::text, ct.contact_name::text)
      FROM contacts ct WHERE ct.id::text = ${idExpr} LIMIT 1
    )
    ELSE NULL
  END`;
}
