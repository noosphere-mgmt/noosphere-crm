"use client";

import Link from "next/link";
import { lookupCompanyV1BusinessId } from "@/lib/companyV1Display";
import { companyFullPageHref } from "@/lib/crmDetailNav";
import {
  listPremisesRelatedCompanyLines,
  type PremisesRelatedCompaniesSource,
  type RelatedCompanyRole,
} from "@/lib/premisesDisplay";
import type { CompanyV1Option } from "@/lib/repos/companiesV1";
import type { PremisesRelationshipLine } from "@/lib/v1ListValues";

const ROLE_STYLE: Record<RelatedCompanyRole, string> = {
  operator: "text-[#1D4ED8]",
  landlord: "text-slate-600",
  occupant: "text-[#0E7490]",
  source: "text-[#B45309]",
  bldg_mgmt: "text-[#475569]",
  referrer: "text-[#6D28D9]",
  other: "text-slate-500",
};

function RoleSymbol({ role }: { role: RelatedCompanyRole }) {
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
  if (role === "occupant") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20a7 7 0 0 1 14 0" />
      </svg>
    );
  }
  if (role === "source") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }
  if (role === "bldg_mgmt") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
        <path d="M3 21h18" />
        <path d="M5 21V7l7-4 7 4v14" />
        <path d="M9 21v-4h6v4" />
      </svg>
    );
  }
  if (role === "referrer") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
    </svg>
  );
}

function CompanyLine({
  role,
  value,
  title,
  href,
}: {
  role: RelatedCompanyRole;
  value: string;
  title: string;
  href: string | null;
}) {
  const body = (
    <>
      <RoleSymbol role={role} />
      <span className="truncate">{value}</span>
      {role === "operator" || role === "landlord" || role === "occupant" ? null : (
        <span className="shrink-0 text-[10px] font-medium text-slate-400">{title}</span>
      )}
      <span className="sr-only">{title}</span>
    </>
  );
  const className = `flex min-w-0 items-center gap-1 ${ROLE_STYLE[role]}`;
  if (!href) {
    return (
      <p className={className} title={title}>
        {body}
      </p>
    );
  }
  return (
    <Link
      href={href}
      title={title}
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
  sourceName,
  operatorId,
  landlordId,
  occupantId,
  sourceId,
  ownerId,
  relationshipLines,
  companies,
}: {
  operatorName?: string | null;
  landlordName?: string | null;
  occupantName?: string | null;
  sourceName?: string | null;
  operatorId?: string | null;
  landlordId?: string | null;
  occupantId?: string | null;
  sourceId?: string | null;
  ownerId?: string | null;
  relationshipLines?: PremisesRelationshipLine[] | null;
  companies?: CompanyV1Option[];
}) {
  const source: PremisesRelatedCompaniesSource = {
    operator_name: operatorName,
    landlord_name: landlordName,
    occupant_name: occupantName,
    source_name: sourceName,
    operator_company_id: operatorId,
    landlord_company_id: landlordId,
    owner_company_id: ownerId,
    current_tenant_company_id: occupantId,
    source_company_id: sourceId,
    relationship_lines: relationshipLines,
  };
  const lines = listPremisesRelatedCompanyLines(source, companies);

  if (lines.length === 0) {
    return <span className="text-slate-400">—</span>;
  }

  return (
    <div className="min-w-0 space-y-0.5 text-xs leading-snug">
      {lines.map((line) => (
        <CompanyLine
          key={`${line.role}:${line.companyId ?? line.name}`}
          role={line.role}
          value={line.name}
          title={line.title}
          href={companyHref(companies, line.companyId)}
        />
      ))}
    </div>
  );
}
