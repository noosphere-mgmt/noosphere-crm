"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ConnectionsModuleHeader } from "@/components/admin/connections/ConnectionsModuleHeader";
import type { ChannelEntity, ChannelOpportunity, ChannelTreeData } from "@/lib/repos/channelTree";
import type { Contact } from "@/lib/types/entities";

type DisplayNode = ChannelEntity & { member?: boolean };

function isActive(status: string): boolean {
  return status !== "closed_won" && status !== "closed_lost";
}

function opportunityHref(opportunity: ChannelOpportunity): string {
  return `/admin/opportunities/${encodeURIComponent(opportunity.business_id ?? String(opportunity.id))}`;
}

function entityHref(entity: ChannelEntity): string {
  const ref = encodeURIComponent(entity.business_id ?? String(entity.id));
  return entity.entity_type === "company" ? `/admin/companies?company=${ref}` : `/admin/contacts?contact=${ref}`;
}

export function ChannelTreeClient({ contacts, tree }: { contacts: Contact[]; tree: ChannelTreeData }) {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set([
    ...tree.entities.map((entity) => entity.key),
    ...contacts.map((contact) => `contact:${contact.id}`),
  ]));

  const model = useMemo(() => {
    const entities = new Map(tree.entities.map((entity) => [entity.key, entity]));
    const children = new Map<string, string[]>();
    const targeted = new Set<string>();
    for (const edge of tree.introductions) {
      children.set(edge.from_key, [...(children.get(edge.from_key) ?? []), edge.to_key]);
      targeted.add(edge.to_key);
    }

    const opportunities = new Map<string, ChannelOpportunity[]>();
    for (const link of tree.opportunity_links) {
      if (!Number.isFinite(link.opportunity.id)) continue;
      const current = opportunities.get(link.entity_key) ?? [];
      if (!current.some((opportunity) => opportunity.id === link.opportunity.id)) current.push(link.opportunity);
      opportunities.set(link.entity_key, current);
    }

    const companyMembers = new Map<string, DisplayNode[]>();
    const memberCompanyByContact = new Map<string, string>();
    for (const contact of contacts) {
      if (contact.company_id == null) continue;
      const companyKey = `company:${contact.company_id}`;
      if (!entities.has(companyKey)) continue;
      const key = `contact:${contact.id}`;
      const node: DisplayNode = entities.get(key) ?? {
        key,
        entity_type: "contact",
        id: contact.id,
        business_id: contact.business_id ?? null,
        name: contact.display_name || contact.contact_name,
        member: true,
      };
      companyMembers.set(companyKey, [...(companyMembers.get(companyKey) ?? []), { ...node, member: true }]);
      memberCompanyByContact.set(key, companyKey);
    }

    const naturalRoots = tree.entities.filter((entity) =>
      !targeted.has(entity.key) && !(entity.entity_type === "contact" && entities.has(memberCompanyByContact.get(entity.key) ?? "")),
    );
    // A reciprocal referral can leave the graph without a natural root. In that
    // case, keep one strongest origin at Tier 1 instead of promoting every node.
    const fallbackRoot = [...tree.entities].sort((a, b) =>
      (children.get(b.key)?.length ?? 0) - (children.get(a.key)?.length ?? 0) || a.name.localeCompare(b.name),
    )[0];
    const roots = naturalRoots.length > 0 ? naturalRoots : fallbackRoot ? [fallbackRoot] : [];
    return { entities, children, opportunities, companyMembers, roots };
  }, [contacts, tree]);

  function directChildren(key: string): DisplayNode[] {
    const referred = (model.children.get(key) ?? []).flatMap((childKey) => {
      const child = model.entities.get(childKey);
      return child ? [child] : [];
    });
    const members = model.companyMembers.get(key) ?? [];
    const referredKeys = new Set(referred.map((node) => node.key));
    return [...referred, ...members.filter((node) => !referredKeys.has(node.key))];
  }

  function collectOpportunities(key: string, visited = new Set<string>()): Map<number, ChannelOpportunity> {
    if (visited.has(key)) return new Map();
    const nextVisited = new Set(visited).add(key);
    const result = new Map((model.opportunities.get(key) ?? []).map((opportunity) => [opportunity.id, opportunity]));
    for (const child of directChildren(key)) {
      for (const [id, opportunity] of collectOpportunities(child.key, nextVisited)) result.set(id, opportunity);
    }
    return result;
  }

  function countIntroductions(key: string, visited = new Set<string>()): number {
    if (visited.has(key)) return 0;
    const nextVisited = new Set(visited).add(key);
    const referred = model.children.get(key) ?? [];
    return referred.length + referred.reduce((sum, childKey) => sum + countIntroductions(childKey, nextVisited), 0);
  }

  function searchText(key: string, visited = new Set<string>()): string {
    if (visited.has(key)) return "";
    const node = model.entities.get(key);
    const nextVisited = new Set(visited).add(key);
    return [
      node?.name,
      ...(model.opportunities.get(key) ?? []).map((opportunity) => opportunity.client_name),
      ...directChildren(key).map((child) => child.name),
      ...(model.children.get(key) ?? []).map((childKey) => searchText(childKey, nextVisited)),
    ].filter(Boolean).join(" ");
  }

  const q = query.trim().toLowerCase();
  const roots = model.roots
    .filter((root) => !q || searchText(root.key).toLowerCase().includes(q))
    .sort((a, b) => countIntroductions(b.key) - countIntroductions(a.key) || a.name.localeCompare(b.name));

  function toggleNode(key: string) {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function renderNode(node: DisplayNode, depth: number, path: Set<string>) {
    if (path.has(node.key)) {
      return <p key={`${node.key}-cycle`} className="px-4 py-2 text-xs text-amber-700">Connection loops back to {node.name}</p>;
    }
    const nextPath = new Set(path).add(node.key);
    const children = directChildren(node.key);
    const memberOpportunityIds = node.entity_type === "company"
      ? new Set((model.companyMembers.get(node.key) ?? []).flatMap((member) => (model.opportunities.get(member.key) ?? []).map((opportunity) => opportunity.id)))
      : new Set<number>();
    const directOpportunities = (model.opportunities.get(node.key) ?? []).filter((opportunity) => !memberOpportunityIds.has(opportunity.id));
    const subtreeOpportunities = [...collectOpportunities(node.key).values()];
    const active = subtreeOpportunities.filter((opportunity) => isActive(opportunity.status)).length;
    const won = subtreeOpportunities.filter((opportunity) => opportunity.status === "closed_won").length;
    const branchMatchesSearch = Boolean(q) && searchText(node.key).toLowerCase().includes(q);
    const isCollapsed = collapsed.has(node.key) && !branchMatchesSearch;
    const hasContents = children.length > 0 || directOpportunities.length > 0;

    return (
      <div key={`${node.key}-${depth}`} className={depth > 0 ? "relative ml-6 border-l border-slate-200 pl-5" : ""}>
        {depth > 0 ? <span className="absolute -left-px top-6 w-4 border-t border-slate-200" /> : null}
        <div className={`flex flex-wrap items-center justify-between gap-3 py-3 ${depth === 0 ? "bg-emerald-50 px-4" : "bg-white pl-2 pr-4"}`}>
          <div className="flex min-w-0 items-start gap-2">
            {hasContents ? (
              <button type="button" onClick={() => toggleNode(node.key)}
                aria-expanded={!isCollapsed} aria-label={`${isCollapsed ? "Expand" : "Collapse"} ${node.name}`}
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-sm text-slate-600 hover:border-emerald-300 hover:text-emerald-700">
                {isCollapsed ? "+" : "−"}
              </button>
            ) : <span className="h-6 w-6 shrink-0" />}
            <div className="min-w-0">
              <Link href={entityHref(node)} className="font-semibold text-slate-900 hover:text-emerald-700">{node.name}</Link>
            <p className="mt-0.5 text-xs text-slate-500">
              {node.member ? "Contact in company" : depth === 0 ? "Channel origin" : `Introduced ${node.entity_type}`}
            </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">{countIntroductions(node.key)} introductions</span>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">{subtreeOpportunities.length} opportunities</span>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800">{active} active</span>
            <span className="rounded-full bg-violet-50 px-2.5 py-1 text-violet-700">{won} won</span>
          </div>
        </div>

        {!isCollapsed && directOpportunities.length > 0 ? (
          <div className="ml-5 border-l border-blue-200 bg-blue-50/40 py-1 pl-5">
            {directOpportunities.map((opportunity) => (
              <div key={opportunity.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm">
                <Link href={opportunityHref(opportunity)} className="font-medium text-blue-800 hover:text-blue-600">Opportunity: {opportunity.client_name}</Link>
                <span className="text-xs capitalize text-slate-500">{opportunity.status.replaceAll("_", " ")}</span>
              </div>
            ))}
          </div>
        ) : null}

        {!isCollapsed && (depth < 8 ? children.map((child) => renderNode(child, depth + 1, nextPath)) : (
          <p className="px-4 py-2 text-xs text-slate-500">Further levels hidden to keep the page manageable.</p>
        ))}
      </div>
    );
  }

  return (
    <>
      <ConnectionsModuleHeader />
      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex flex-wrap gap-2">
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)}
            placeholder="Search channel, company, contact or opportunity…" aria-label="Search channel tree"
            className="min-w-[240px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
          <button type="button" onClick={() => setCollapsed(new Set())}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-emerald-300 hover:text-emerald-700">Expand all</button>
          <button type="button" onClick={() => setCollapsed(new Set([...model.entities.keys(), ...model.companyMembers.keys()]))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-emerald-300 hover:text-emerald-700">Collapse all</button>
        </div>
        <p className="mt-2 px-1 text-xs text-slate-500">Figures include the full branch. An opportunity is counted once even when linked through both a company and a contact.</p>
      </div>

      <div className="space-y-4">
        {roots.map((root) => (
          <section key={root.key} className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <div className="min-w-[560px] sm:min-w-[720px]">{renderNode(root, 0, new Set())}</div>
          </section>
        ))}
        {roots.length === 0 ? <p className="rounded-xl bg-white px-4 py-10 text-center text-sm text-slate-500 ring-1 ring-slate-100">No channel relationships match the search.</p> : null}
      </div>
    </>
  );
}
