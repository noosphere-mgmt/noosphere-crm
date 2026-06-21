"use client";

import Link from "next/link";
import { IconPen, IconX } from "@/components/admin/ModuleActionIcons";
import { moduleEditButtonClass } from "@/components/admin/ModuleActionBar";
import { InlineSaveStatus } from "@/components/admin/inline/InlineRecordChrome";
import { useInlineEdit } from "@/components/admin/inline/InlineEditProvider";

export function ConnectionsDrawerHeader({
  title,
  subtitle,
  onClose,
  onEditToggle,
}: {
  title: string;
  subtitle?: string | null;
  onClose: () => void;
  onEditToggle?: (enabled: boolean) => void;
}) {
  const { editHighlight, setEditHighlight } = useInlineEdit();

  function toggleEdit() {
    const next = !editHighlight;
    setEditHighlight(next);
    onEditToggle?.(next);
  }

  return (
    <div className="sticky top-0 z-10 shrink-0 border-b border-slate-200 bg-white px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-slate-500">
            {editHighlight ? "Click a field to edit" : "Review — click pen to edit"}
          </p>
          <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <InlineSaveStatus />
          <button
            type="button"
            className={`${moduleEditButtonClass("connections")} ${
              editHighlight ? "ring-2 ring-[#DDD6FE]" : ""
            }`}
            onClick={toggleEdit}
            aria-label={editHighlight ? "Exit inline edit" : "Inline edit"}
            title={editHighlight ? "Exit inline edit" : "Inline edit"}
          >
            <IconPen />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
            title="Close"
          >
            <IconX />
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConnectionsDrawerTableLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="font-medium text-[#5B21B6] hover:text-[#7C3AED] hover:underline">
      {children}
    </Link>
  );
}
