"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ConnectionsModuleHeader } from "@/components/admin/connections/ConnectionsModuleHeader";
import { ConnectionsModuleToolbar } from "@/components/admin/connections/ConnectionsModuleToolbar";
import { companyWorkspaceHref } from "@/lib/companyWorkspaceNav";
import { contactWorkspaceHref } from "@/lib/contactWorkspaceNav";
import { opportunityWorkspaceHref } from "@/lib/opportunityWorkspaceNav";
import type { ChannelEntity, ChannelOpportunity, ChannelTreeData } from "@/lib/repos/channelTree";
import type { Contact } from "@/lib/types/entities";

type DisplayNode = ChannelEntity & { member?: boolean };

const CHANNEL_TREE_RETURN_TO = "/admin/connections/channel-tree";

function isActive(status: string): boolean {
  return status !== "closed_won" && status !== "closed_lost";
}

function opportunityHref(opportunity: ChannelOpportunity): string {
  return opportunityWorkspaceHref(
    {
      id: opportunity.id,
      business_id: opportunity.business_id,
    },
    "overview",
    undefined,
    CHANNEL_TREE_RETURN_TO,
  );
}

function entityHref(entity: ChannelEntity): string {
  const entityRef = { id: entity.id, business_id: entity.business_id };
  return entity.entity_type === "company"
    ? companyWorkspaceHref(entityRef, "overview", undefined, CHANNEL_TREE_RETURN_TO)
    : contactWorkspaceHref(entityRef, "overview", undefined, CHANNEL_TREE_RETURN_TO);
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
      <div key={`${node.key}-${depth}`} className={depth > 0 ? "relative ml-3 border-l border-[#D9D2DF] pl-3 sm:ml-6 sm:pl-5" : ""}>
        {depth > 0 ? <span className="absolute -left-px top-6 w-3 border-t border-[#D9D2DF] sm:w-4" /> : null}
        <div className={`flex flex-col gap-2 py-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:py-3 ${depth === 0 ? "border-l-4 border-l-[#8F829B] bg-white px-3 sm:px-4" : "bg-white pl-1 pr-2 sm:pl-2 sm:pr-4"}`}>
          <div className="flex min-w-0 items-start gap-2">
            {hasContents ? (
              <button type="button" onClick={() => toggleNode(node.key)}
                aria-expanded={!isCollapsed} aria-label={`${isCollapsed ? "Expand" : "Collapse"} ${node.name}`}
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-sm text-slate-600 hover:border-emerald-300 hover:text-emerald-700">
                {isCollapsed ? "+" : "−"}
              </button>
            ) : <span className="h-6 w-6 shrink-0" />}
            <div className="min-w-0">
              <Link href={entityHref(node)} className="break-words font-semibold text-[#62556A] hover:text-[#807089]">{node.name}</Link>
            <p className="mt-0.5 text-xs text-slate-500">
              {node.member ? "Contact in company" : depth === 0 ? "Channel origin" : `Introduced ${node.entity_type}`}
            </p>
            </div>
          </div>
          <div className="grid w-full grid-cols-4 gap-1 text-center text-[10px] font-semibold sm:flex sm:w-auto sm:flex-wrap sm:gap-2 sm:text-xs">
            <span className="rounded-full bg-[#F0EDF2] px-1.5 py-1 text-[#62556A] sm:px-2.5">{countIntroductions(node.key)} <span className="hidden sm:inline">introductions</span><span className="sm:hidden">intro</span></span>
            <span className="rounded-full bg-[#EDF3F5] px-1.5 py-1 text-[#4F6F75] sm:px-2.5">{subtreeOpportunities.length} <span className="hidden sm:inline">opportunities</span><span className="sm:hidden">opps</span></span>
            <span className="rounded-full bg-[#EEF3ED] px-1.5 py-1 text-[#506753] sm:px-2.5">{active} active</span>
            <span className="rounded-full bg-[#F3EEF1] px-1.5 py-1 text-[#775E6D] sm:px-2.5">{won} won</span>
          </div>
        </div>

        {!isCollapsed && directOpportunities.length > 0 ? (
          <div className="ml-3 border-l border-[#B9D0D4] bg-[#F4F8F8] py-1 pl-3 sm:ml-5 sm:pl-5">
            {directOpportunities.map((opportunity) => (
              <div key={opportunity.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm">
                <Link href={opportunityHref(opportunity)} className="font-medium text-[#356C73] hover:text-[#4F858B]">Opportunity: {opportunity.client_name}</Link>
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
      <div className="md:hidden"><ConnectionsModuleToolbar createLabel="New connection" /></div>
      <div className="hidden md:block"><ConnectionsModuleHeader /></div>
      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)}
            placeholder="Search channel, company, contact or opportunity…" aria-label="Search channel tree"
            className="col-span-2 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#9A8EA3] focus:ring-2 focus:ring-[#EEE9F0] sm:min-w-[240px]" />
          <button type="button" onClick={() => setCollapsed(new Set())}
            className="rounded-lg border border-[#DED8E2] bg-white px-3 py-2 text-sm font-medium text-[#66566D] hover:bg-[#F7F4F7]">Expand all</button>
          <button type="button" onClick={() => setCollapsed(new Set([...model.entities.keys(), ...model.companyMembers.keys()]))}
            className="rounded-lg border border-[#DED8E2] bg-white px-3 py-2 text-sm font-medium text-[#66566D] hover:bg-[#F7F4F7]">Collapse all</button>
        </div>
        <p className="mt-2 px-1 text-xs text-slate-500">Figures include the full branch. An opportunity is counted once even when linked through both a company and a contact.</p>
      </div>

      <div className="space-y-4">
        {roots.map((root) => (
          <section key={root.key} className="overflow-hidden rounded-xl border border-[#DED8E2] bg-white shadow-[0_4px_14px_rgba(112,98,119,0.09)]">
            <div className="min-w-0">{renderNode(root, 0, new Set())}</div>
          </section>
        ))}
        {roots.length === 0 ? <p className="rounded-xl bg-white px-4 py-10 text-center text-sm text-slate-500 ring-1 ring-slate-100">No channel relationships match the search.</p> : null}
      </div>
    </>
  );
}
