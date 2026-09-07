"use client";

import Link from "next/link";
import { lookupCompanyV1BusinessId } from "@/lib/companyV1Display";
import { companyFullPageHref } from "@/lib/crmDetailNav";
import { premisesRelatedCompanies } from "@/lib/premisesDisplay";
import type { CompanyV1Option } from "@/lib/repos/companiesV1";

type RelatedRole = "operator" | "landlord" | "occupant";

const ROLE_STYLE: Record<RelatedRole, { className: string; title: string }> = {
  operator: { className: "text-[#1D4ED8]", title: "Operator" },
  landlord: { className: "text-slate-600", title: "Owner / Landlord" },
  occupant: { className: "text-[#0E7490]", title: "Current Occupant" },
};

function RoleSymbol({ role }: { role: RelatedRole }) {
  const className = "h-3 w-3 shrink-0";
  if (role === "landlord") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
        <rect x="4" y="3" width="16" height="18" rx="1" />
        <path d="M9 8h.01M15 8h.01M9 12h.01M15 12h.01M9 16h.01M15 16h.01" />
      </svg>
    );
  }
  if (role === "operator") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
        <circle cx="8" cy="15" r="5" />
        <path d="m12 11 8-8" />
        <path d="M17 3h4v4" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

function CompanyLine({
  role,
  value,
  href,
}: {
  role: RelatedRole;
  value: string;
  href: string | null;
}) {
  const style = ROLE_STYLE[role];
  const body = (
    <>
      <RoleSymbol role={role} />
      <span className="truncate">{value}</span>
      <span className="sr-only">{style.title}</span>
    </>
  );
  const className = `flex min-w-0 items-center gap-1 ${style.className}`;
  if (!href) {
    return (
      <p className={className} title={style.title}>
        {body}
      </p>
    );
  }
  return (
    <Link
      href={href}
      title={style.title}
      className={`${className} underline-offset-2 hover:underline`}
      onClick={(e) => e.stopPropagation()}
    >
      {body}
    </Link>
  );
}

function companyHref(
  companies: CompanyV1Option[] | undefined,
  companyId: string | null | undefined,
): string | null {
  const businessId = lookupCompanyV1BusinessId(companies, companyId) ?? companyId?.trim() ?? null;
  return companyFullPageHref(businessId);
}

export function PremisesRelatedCompaniesCell({
  operatorName,
  landlordName,
  occupantName,
  operatorId,
  landlordId,
  occupantId,
  companies,
}: {
  operatorName?: string | null;
  landlordName?: string | null;
  occupantName?: string | null;
  operatorId?: string | null;
  landlordId?: string | null;
  occupantId?: string | null;
  companies?: CompanyV1Option[];
}) {
  const related = premisesRelatedCompanies({
    operator_name: operatorName,
    landlord_name: landlordName,
    occupant_name: occupantName,
  });
  const operatorKey = (operatorId ?? "").trim();
  const landlordKey = (landlordId ?? "").trim();
  const landlord =
    related.landlord &&
    related.landlord !== related.operator &&
    (!operatorKey || !landlordKey || landlordKey !== operatorKey)
      ? related.landlord
      : null;

  if (!related.operator && !landlord && !related.occupant) {
    return <span className="text-slate-400">—</span>;
  }

  return (
    <div className="min-w-0 space-y-0.5 text-xs leading-snug">
      {landlord ? (
        <CompanyLine
          role="landlord"
          value={landlord}
          href={companyHref(companies, landlordId)}
        />
      ) : null}
      {related.operator ? (
        <CompanyLine
          role="operator"
          value={related.operator}
          href={companyHref(companies, operatorId)}
        />
      ) : null}
      {related.occupant ? (
        <CompanyLine
          role="occupant"
          value={related.occupant}
          href={companyHref(companies, occupantId)}
        />
      ) : null}
    </div>
  );
}
