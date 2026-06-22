"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import {
  addEntityRelationshipAction,
  deleteEntityRelationshipAction,
  updateEntityRelationshipAction,
} from "@/app/admin/connections/relationshipActions";
import { ModuleRowActions } from "@/components/admin/ModuleRowActions";
import { RelationshipEntityTypeahead } from "@/components/admin/connections/RelationshipEntityTypeahead";
import {
  CREATION_RELATIONSHIP_TYPES,
  RELATIONSHIP_STATUSES,
  isCreationRelationshipType,
  type EntityRelationshipRow,
  type EntityType,
} from "@/lib/entityRelationships";
import { companyDrawerHref, contactDrawerHref } from "@/lib/connectionsDrawerNav";
import { isV1CompanyRef, isV1ContactRef } from "@/lib/entityRefGuards";
import type { RelationshipSearchHit } from "@/lib/repos/relationships";

function partyTypeLabel(type: EntityType): string {
  return type === "company" ? "Company" : "Contact";
}

function relatedPartyHref(
  basePath: "/admin/companies" | "/admin/contacts",
  searchParams: URLSearchParams,
  row: EntityRelationshipRow,
): string {
  const id = row.related_entity_id.trim();
  if (!id) return "#";

  if (isV1CompanyRef(id) || row.related_entity_type === "company") {
    return companyDrawerHref(
      basePath === "/admin/contacts" ? "/admin/companies" : basePath,
      searchParams,
      id,
      "overview",
    );
  }

  if (isV1ContactRef(id) || row.related_entity_type === "contact") {
    return contactDrawerHref("/admin/contacts", searchParams, id, "overview");
  }

  return "#";
}

export function EntityRelationshipsTab({
  entityType,
  entityId,
  entityName,
  relationships,
  basePath,
}: {
  entityType: EntityType;
  entityId: number;
  entityName: string;
  relationships: EntityRelationshipRow[];
  basePath: "/admin/companies" | "/admin/contacts";
}) {
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [relatedType, setRelatedType] = useState<EntityType>("company");
  const [relatedParty, setRelatedParty] = useState<RelationshipSearchHit | null>(null);
  const [relationshipType, setRelationshipType] = useState<string>("Refers");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editType, setEditType] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editRemarks, setEditRemarks] = useState("");
  const [editTypeLocked, setEditTypeLocked] = useState(false);

  function resetAddForm() {
    setRelatedParty(null);
    setRelationshipType("Refers");
    setError(null);
  }

  function relationshipFormData(extra?: Record<string, string>) {
    const fd = new FormData();
    fd.set("entity_type", entityType);
    fd.set("entity_id", String(entityId));
    if (extra) {
      for (const [key, value] of Object.entries(extra)) {
        fd.set(key, value);
      }
    }
    return fd;
  }

  function handleAdd() {
    if (!relatedParty) {
      setError("Select a related party");
      return;
    }
    const fd = relationshipFormData({
      related_entity_type: relatedParty.entity_type,
      related_entity_id: relatedParty.entity_id,
      relationship_type: relationshipType,
    });
    startTransition(async () => {
      const result = await addEntityRelationshipAction(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      resetAddForm();
    });
  }

  function startEdit(row: EntityRelationshipRow) {
    setEditingId(row.relationship_id);
    setEditType(row.relationship_type);
    setEditStatus(row.status);
    setEditRemarks(row.remarks ?? "");
    setEditTypeLocked(!isCreationRelationshipType(row.relationship_type));
  }

  function saveEdit() {
    if (!editingId) return;
    const extra: Record<string, string> = {
      relationship_id: editingId,
      status: editStatus,
      remarks: editRemarks,
    };
    if (!editTypeLocked) extra.relationship_type = editType;
    const fd = relationshipFormData(extra);
    startTransition(async () => {
      const result = await updateEntityRelationshipAction(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEditingId(null);
      setError(null);
    });
  }

  function handleDelete(relationshipId: string) {
    if (!window.confirm("Remove this relationship? The linked party will no longer see it either.")) return;
    const fd = relationshipFormData({ relationship_id: relationshipId });
    startTransition(async () => {
      await deleteEntityRelationshipAction(fd);
    });
  }

  const colSpan = 6;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2 font-medium">Relationship</th>
              <th className="px-3 py-2 font-medium">Related party</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Remarks</th>
              <th className="w-24 px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {relationships.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-4 py-8 text-center text-slate-500">
                  No related parties yet.
                </td>
              </tr>
            ) : (
              relationships.map((row) =>
                editingId === row.relationship_id ? (
                  <tr key={row.relationship_id} className="border-t border-slate-100 bg-violet-50/40">
                    <td colSpan={colSpan} className="px-3 py-3">
                      <div className="grid gap-2 sm:grid-cols-3">
                        <label className="block text-sm">
                          <span className="mb-1 block text-xs text-slate-500">Relationship</span>
                          {editTypeLocked ? (
                            <p className="rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm text-slate-800">
                              {editType}
                            </p>
                          ) : (
                            <select
                              value={editType}
                              onChange={(e) => setEditType(e.target.value)}
                              className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                            >
                              {CREATION_RELATIONSHIP_TYPES.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                          )}
                        </label>
                        <label className="block text-sm">
                          <span className="mb-1 block text-xs text-slate-500">Status</span>
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                          >
                            {RELATIONSHIP_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block text-sm sm:col-span-1">
                          <span className="mb-1 block text-xs text-slate-500">Remarks</span>
                          <input
                            value={editRemarks}
                            onChange={(e) => setEditRemarks(e.target.value)}
                            className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                          />
                        </label>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={saveEdit}
                          className="rounded-md bg-violet-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-950 disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded-md px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={row.relationship_id} className="border-t border-slate-100 align-top">
                    <td className="px-3 py-2 font-medium text-slate-900">{row.relationship_type}</td>
                    <td className="px-3 py-2 font-medium text-slate-900">
                      <Link href={relatedPartyHref(basePath, searchParams, row)} className="text-violet-900 hover:underline">
                        {row.related_entity_name}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-slate-700">{partyTypeLabel(row.related_entity_type)}</td>
                    <td className="px-3 py-2 text-slate-700">{row.status}</td>
                    <td className="max-w-[12rem] px-3 py-2 whitespace-pre-wrap text-slate-700">
                      {row.remarks?.trim() || "—"}
                    </td>
                    <td className="px-3 py-2">
                      <ModuleRowActions
                        module="connections"
                        viewHref={relatedPartyHref(basePath, searchParams, row)}
                        onEdit={() => startEdit(row)}
                        onDelete={() => handleDelete(row.relationship_id)}
                      />
                    </td>
                  </tr>
                ),
              )
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-dashed border-violet-200 bg-violet-50/30 p-4">
        <p className="mb-3 text-sm font-semibold text-slate-900">Add relationship</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-xs text-slate-500">Current party</span>
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900">
              {entityName}
            </p>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-slate-500">Relationship</span>
            <select
              value={relationshipType}
              onChange={(e) => setRelationshipType(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {CREATION_RELATIONSHIP_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-slate-500">Related party type</span>
            <select
              value={relatedType}
              onChange={(e) => {
                setRelatedType(e.target.value as EntityType);
                setRelatedParty(null);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="company">Company</option>
              <option value="contact">Contact</option>
            </select>
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-xs text-slate-500">Related party</span>
            <RelationshipEntityTypeahead
              partyType={relatedType}
              value={relatedParty}
              onChange={setRelatedParty}
              disabled={pending}
            />
          </label>
        </div>
        {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
        <button
          type="button"
          disabled={pending}
          onClick={handleAdd}
          className="mt-3 rounded-lg bg-violet-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-950 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Add relationship"}
        </button>
      </div>
    </div>
  );
}
