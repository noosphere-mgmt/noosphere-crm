import Link from "next/link";
import { FormField, TextAreaField } from "@/components/admin/AdminFormFields";
import {
  ASSET_STATUSES,
  ASSET_TYPES,
  OFFICE_TYPES,
  VIEW_TYPES,
  WINDOW_TYPES,
} from "@/lib/lookups";
import type { Asset } from "@/lib/types/entities";

const selectClass = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

type CompanyOption = { id: number; company_name: string };

type Props = {
  buildings: Array<{ id: number; property_id: number | null; label: string }>;
  parentSpaces: Array<{ id: number; building_id: number; label: string }>;
  operatorCompanies: CompanyOption[];
  landlordCompanies: CompanyOption[];
  tenantCompanies: CompanyOption[];
  defaults?: Asset;
};

function CompanySelect({
  label,
  name,
  companies,
  defaultValue,
}: {
  label: string;
  name: string;
  companies: CompanyOption[];
  defaultValue?: number | null;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <select name={name} defaultValue={defaultValue?.toString() ?? ""} className={selectClass}>
        <option value="">— None —</option>
        {companies.map((c) => (
          <option key={c.id} value={c.id}>
            {c.company_name}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SpaceCompanyLinksSummary({ space }: { space: Asset }) {
  const links = [
    {
      label: "Operator",
      id: space.operator_company_id,
      name: space.operator_company_name,
    },
    {
      label: "Landlord",
      id: space.landlord_company_id,
      name: space.landlord_company_name,
    },
    {
      label: "Current tenant",
      id: space.current_tenant_company_id,
      name: space.tenant_company_name,
    },
  ];

  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
      <h2 className="text-sm font-semibold text-slate-900">Linked companies</h2>
      <dl className="mt-3 grid gap-3 sm:grid-cols-3">
        {links.map((link) => (
          <div key={link.label}>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{link.label}</dt>
            <dd className="mt-1 text-sm text-slate-900">
              {link.id && link.name ? (
                <Link href={`/admin/companies/${link.id}`} className="font-medium hover:underline">
                  {link.name}
                </Link>
              ) : (
                "—"
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function SpaceFormFields({
  buildings,
  parentSpaces,
  operatorCompanies,
  landlordCompanies,
  tenantCompanies,
  defaults,
}: Props) {
  return (
    <>
      <label className="block text-sm font-medium text-slate-700">
        Building
        <select
          name="building_id"
          required
          defaultValue={defaults?.building_id?.toString() ?? ""}
          className={selectClass}
        >
          <option value="">Select building</option>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.label}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Space type
          <select name="asset_type" defaultValue={defaults?.asset_type ?? "Unit"} className={selectClass} required>
            {ASSET_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Status
          <select name="asset_status" defaultValue={defaults?.asset_status ?? "active"} className={selectClass}>
            {ASSET_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
      <FormField label="Display name (EN)" name="display_name_en" defaultValue={defaults?.display_name_en ?? ""} required />
      <FormField label="Display name (TC)" name="display_name_zh" defaultValue={defaults?.display_name_zh ?? ""} />
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="mb-3 text-sm font-semibold text-slate-900">Company links</p>
        <div className="grid gap-4 sm:grid-cols-1">
          <CompanySelect
            label="Operator (company with operator role)"
            name="operator_company_id"
            companies={operatorCompanies}
            defaultValue={defaults?.operator_company_id}
          />
          <CompanySelect
            label="Landlord (company with landlord role)"
            name="landlord_company_id"
            companies={landlordCompanies}
            defaultValue={defaults?.landlord_company_id}
          />
          <CompanySelect
            label="Current tenant (company with client role)"
            name="current_tenant_company_id"
            companies={tenantCompanies}
            defaultValue={defaults?.current_tenant_company_id}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Floor" name="floor" defaultValue={defaults?.floor ?? ""} />
        <FormField label="Unit / room no." name="unit" defaultValue={defaults?.unit ?? ""} />
        <FormField label="Suite" name="suite" defaultValue={defaults?.suite ?? ""} />
        <FormField label="Office / centre name" name="office_name" defaultValue={defaults?.office_name ?? ""} />
        <label className="block text-sm font-medium text-slate-700">
          Office type
          <select name="office_type" defaultValue={defaults?.office_type ?? ""} className={selectClass}>
            <option value="">— None —</option>
            {OFFICE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <FormField label="Capacity (pax)" name="capacity_pax" type="number" defaultValue={defaults?.capacity_pax?.toString() ?? ""} />
        <FormField label="Gross area (sq ft)" name="gross_area_sqft" type="number" defaultValue={defaults?.gross_area_sqft ?? ""} />
        <FormField label="Net area (sq ft)" name="net_area_sqft" type="number" defaultValue={defaults?.net_area_sqft ?? ""} />
        <label className="block text-sm font-medium text-slate-700">
          View
          <select name="view_type" defaultValue={defaults?.view_type ?? ""} className={selectClass}>
            <option value="">— None —</option>
            {VIEW_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Windows
          <select name="windows" defaultValue={defaults?.windows ?? ""} className={selectClass}>
            <option value="">— None —</option>
            {WINDOW_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Parent space (optional)
          <select name="parent_asset_id" defaultValue={defaults?.parent_asset_id?.toString() ?? ""} className={selectClass}>
            <option value="">— None —</option>
            {parentSpaces.map((a) => (
              <option key={a.id} value={a.id}>{a.label}</option>
            ))}
          </select>
        </label>
      </div>
      <TextAreaField label="Space remarks" name="remarks" defaultValue={defaults?.remarks ?? ""} />
    </>
  );
}

/** @deprecated use SpaceFormFields */
export const AssetFormFields = SpaceFormFields;
