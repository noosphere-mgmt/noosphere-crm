"use client";

import { useEffect, useState } from "react";
import { InlineTextField } from "@/components/admin/inline/InlineFields";

const SQFT_PER_SQM = 10.7639;

type SaveResult = { ok: boolean; error?: string };
type SaveFactory = (field: string) => (value: unknown) => Promise<SaveResult>;

function convert(value: unknown, direction: "to_sqm" | "to_sqft"): string | null {
  if (value == null || String(value).trim() === "") return null;
  const number = Number.parseFloat(String(value).replace(/,/g, ""));
  if (!Number.isFinite(number)) return null;
  return (direction === "to_sqm" ? number / SQFT_PER_SQM : number * SQFT_PER_SQM).toFixed(2);
}

export function PropertyInlineAreaConversionFields({
  fieldPrefix,
  label,
  sqftValue,
  sqmValue,
  save,
}: {
  fieldPrefix: "bldg_area" | "site_area";
  label: string;
  sqftValue: string | null;
  sqmValue: string | null;
  save: SaveFactory;
}) {
  const [sqft, setSqft] = useState(sqftValue);
  const [sqm, setSqm] = useState(sqmValue);

  useEffect(() => setSqft(sqftValue), [sqftValue]);
  useEffect(() => setSqm(sqmValue), [sqmValue]);

  async function saveSqft(value: unknown) {
    const result = await save(`${fieldPrefix}_sqft`)(value);
    if (result.ok) {
      setSqft(value == null ? null : String(value));
      setSqm(convert(value, "to_sqm"));
    }
    return result;
  }

  async function saveSqm(value: unknown) {
    const result = await save(`${fieldPrefix}_sqm`)(value);
    if (result.ok) {
      setSqm(value == null ? null : String(value));
      setSqft(convert(value, "to_sqft"));
    }
    return result;
  }

  return (
    <>
      <InlineTextField label={`${label} (sq.ft.)`} value={sqft} type="number" onSave={saveSqft} />
      <InlineTextField label={`${label} (sq.m.)`} value={sqm} type="number" onSave={saveSqm} />
    </>
  );
}
