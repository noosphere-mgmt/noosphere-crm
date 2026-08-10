"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePropertyProposalContentAction } from "@/app/admin/properties/actions";
import { InlineTextAreaField, InlineTextField } from "@/components/admin/inline/InlineFields";
import { usePropertyInlineOverview } from "@/components/admin/properties-v1/usePropertyInlineOverview";
import { composeAddressChinese, composeAddressEnglish } from "@/lib/composeAddress";
import type { CompanyV1Option } from "@/lib/repos/companiesV1";
import type { PropertyV1 } from "@/lib/repos/propertiesV1";

const editInputClass = "w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 shadow-sm";

function EditText({ name, value }: { name: string; value: string | null }) {
  return <input className={editInputClass} name={name} defaultValue={value ?? ""} />;
}

function EditArea({ name, value }: { name: string; value: string | null }) {
  return <textarea className={editInputClass} name={name} rows={4} defaultValue={value ?? ""} />;
}

function LanguageHeaders() {
  return (
    <div className="hidden grid-cols-3 gap-3 lg:grid">
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <p className="text-sm font-semibold text-slate-800">English</p>
        <p className="text-xs text-slate-500">Source language</p>
      </div>
      <div className="rounded-lg border border-violet-200 bg-violet-50/60 px-3 py-2">
        <p className="text-sm font-semibold text-violet-900">繁體中文</p>
        <p className="text-xs text-violet-700/70">Traditional Chinese</p>
      </div>
      <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2">
        <p className="text-sm font-semibold text-emerald-900">简体中文</p>
        <p className="text-xs text-emerald-700/70">Simplified Chinese</p>
      </div>
    </div>
  );
}

function FieldRow({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="py-1">
      <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <div className="grid gap-3 lg:grid-cols-3">{children}</div>
    </section>
  );
}

function LanguageCell({ language, children }: { language: string; children: React.ReactNode }) {
  const tone = language === "English"
    ? "border-slate-200 bg-slate-50/80"
    : language === "繁體中文"
      ? "border-violet-200 bg-violet-50/50"
      : "border-emerald-200 bg-emerald-50/50";
  return (
    <div className={`min-w-0 rounded-xl border p-3 ${tone}`}>
      <p className="mb-1 text-xs font-semibold text-slate-400 lg:hidden">{language}</p>
      {children}
    </div>
  );
}

export function BuildingProposalContentTab({ property, companies }: { property: PropertyV1; companies: CompanyV1Option[] }) {
  const { save } = usePropertyInlineOverview(property, companies);
  const router = useRouter();
  const [editingAll, setEditingAll] = useState(false);
  const [pending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);
  const addressEn = property.full_address_en || composeAddressEnglish({ streetNo: property.street_no, streetName: property.street_name_en, district: property.district_en, city: property.city_en });
  const addressZh = property.full_address_zh || composeAddressChinese({ streetNo: property.street_no, streetName: property.street_name_zh, district: property.district_zh, city: property.city_zh });
  const addressCn = property.full_address_cn || composeAddressChinese({ streetNo: property.street_no, streetName: property.street_name_cn, district: property.district_cn, city: property.city_cn });

  function submitAll(formData: FormData) {
    setSaveError(null);
    startTransition(async () => {
      const result = await updatePropertyProposalContentAction(property.property_id, formData);
      if (!result.ok) {
        setSaveError(result.error);
        return;
      }
      setEditingAll(false);
      router.refresh();
    });
  }

  return (
    <form action={submitAll} className="space-y-3">
      <section className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Proposal content by field</h2>
            <p className="mt-0.5 text-xs text-slate-500">Review each field across all three languages in aligned columns.</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" disabled title="Translation provider setup is required" className="cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-400">Translate missing fields</button>
            {editingAll ? (
              <>
                <button type="button" disabled={pending} onClick={() => setEditingAll(false)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700">Cancel</button>
                <button type="submit" disabled={pending} className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">{pending ? "Saving…" : "Save all"}</button>
              </>
            ) : (
              <button type="button" onClick={() => setEditingAll(true)} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800">Full edit</button>
            )}
          </div>
        </div>
      </section>

      <LanguageHeaders />

      <FieldRow title="Building name">
        <LanguageCell language="English">{editingAll ? <EditText name="bldg_name_en" value={property.bldg_name_en} /> : <InlineTextField hideLabel label="Building name" value={property.bldg_name_en} onSave={save("bldg_name_en")} />}</LanguageCell>
        <LanguageCell language="繁體中文">{editingAll ? <EditText name="bldg_name_zh" value={property.bldg_name_zh} /> : <InlineTextField hideLabel label="物業名稱" value={property.bldg_name_zh} onSave={save("bldg_name_zh")} />}</LanguageCell>
        <LanguageCell language="简体中文">{editingAll ? <EditText name="bldg_name_cn" value={property.bldg_name_cn} /> : <InlineTextField hideLabel label="物业名称" value={property.bldg_name_cn} onSave={save("bldg_name_cn")} />}</LanguageCell>
      </FieldRow>

      <FieldRow title="City">
        <LanguageCell language="English">{editingAll ? <EditText name="city_en" value={property.city_en} /> : <InlineTextField hideLabel label="City" value={property.city_en} onSave={save("city_en")} />}</LanguageCell>
        <LanguageCell language="繁體中文">{editingAll ? <EditText name="city_zh" value={property.city_zh} /> : <InlineTextField hideLabel label="城市" value={property.city_zh} onSave={save("city_zh")} />}</LanguageCell>
        <LanguageCell language="简体中文">{editingAll ? <EditText name="city_cn" value={property.city_cn} /> : <InlineTextField hideLabel label="城市" value={property.city_cn} onSave={save("city_cn")} />}</LanguageCell>
      </FieldRow>

      <FieldRow title="District">
        <LanguageCell language="English">{editingAll ? <EditText name="district_en" value={property.district_en} /> : <InlineTextField hideLabel label="District" value={property.district_en} onSave={save("district_en")} />}</LanguageCell>
        <LanguageCell language="繁體中文">{editingAll ? <EditText name="district_zh" value={property.district_zh} /> : <InlineTextField hideLabel label="地區" value={property.district_zh} onSave={save("district_zh")} />}</LanguageCell>
        <LanguageCell language="简体中文">{editingAll ? <EditText name="district_cn" value={property.district_cn} /> : <InlineTextField hideLabel label="地区" value={property.district_cn} onSave={save("district_cn")} />}</LanguageCell>
      </FieldRow>

      <FieldRow title="Street">
        <LanguageCell language="English">{editingAll ? <EditText name="street_name_en" value={property.street_name_en} /> : <InlineTextField hideLabel label="Street" value={property.street_name_en} onSave={save("street_name_en")} />}</LanguageCell>
        <LanguageCell language="繁體中文">{editingAll ? <EditText name="street_name_zh" value={property.street_name_zh} /> : <InlineTextField hideLabel label="街道" value={property.street_name_zh} onSave={save("street_name_zh")} />}</LanguageCell>
        <LanguageCell language="简体中文">{editingAll ? <EditText name="street_name_cn" value={property.street_name_cn} /> : <InlineTextField hideLabel label="街道" value={property.street_name_cn} onSave={save("street_name_cn")} />}</LanguageCell>
      </FieldRow>

      <FieldRow title="Generated address">
        <LanguageCell language="English"><p className="min-h-9 px-1 py-1 text-sm text-slate-700">{addressEn}</p></LanguageCell>
        <LanguageCell language="繁體中文"><p className="min-h-9 px-1 py-1 text-sm text-slate-700">{addressZh}</p></LanguageCell>
        <LanguageCell language="简体中文"><p className="min-h-9 px-1 py-1 text-sm text-slate-700">{addressCn}</p></LanguageCell>
      </FieldRow>

      <FieldRow title="Building introduction">
        <LanguageCell language="English">{editingAll ? <EditArea name="bldg_desc" value={property.bldg_desc} /> : <InlineTextAreaField hideLabel label="Introduction" value={property.bldg_desc} onSave={save("bldg_desc")} />}</LanguageCell>
        <LanguageCell language="繁體中文">{editingAll ? <EditArea name="bldg_desc_zh" value={property.bldg_desc_zh} /> : <InlineTextAreaField hideLabel label="物業介紹" value={property.bldg_desc_zh} onSave={save("bldg_desc_zh")} />}</LanguageCell>
        <LanguageCell language="简体中文">{editingAll ? <EditArea name="bldg_desc_cn" value={property.bldg_desc_cn} /> : <InlineTextAreaField hideLabel label="物业介绍" value={property.bldg_desc_cn} onSave={save("bldg_desc_cn")} />}</LanguageCell>
      </FieldRow>

      <FieldRow title="Location Highlights">
        <LanguageCell language="English">{editingAll ? <EditArea name="location_advantages_en" value={property.location_advantages_en} /> : <InlineTextAreaField hideLabel label="Location Highlights" value={property.location_advantages_en} onSave={save("location_advantages_en")} />}</LanguageCell>
        <LanguageCell language="繁體中文">{editingAll ? <EditArea name="location_advantages_zh" value={property.location_advantages_zh} /> : <InlineTextAreaField hideLabel label="位置亮點" value={property.location_advantages_zh} onSave={save("location_advantages_zh")} />}</LanguageCell>
        <LanguageCell language="简体中文">{editingAll ? <EditArea name="location_advantages_cn" value={property.location_advantages_cn} /> : <InlineTextAreaField hideLabel label="位置亮点" value={property.location_advantages_cn} onSave={save("location_advantages_cn")} />}</LanguageCell>
      </FieldRow>

      <FieldRow title="Accessibility & Transport">
        <LanguageCell language="English">{editingAll ? <EditArea name="proposal_highlights_en" value={property.proposal_highlights_en} /> : <InlineTextAreaField hideLabel label="Accessibility & Transport" value={property.proposal_highlights_en} onSave={save("proposal_highlights_en")} />}</LanguageCell>
        <LanguageCell language="繁體中文">{editingAll ? <EditArea name="proposal_highlights_zh" value={property.proposal_highlights_zh} /> : <InlineTextAreaField hideLabel label="交通及可達性" value={property.proposal_highlights_zh} onSave={save("proposal_highlights_zh")} />}</LanguageCell>
        <LanguageCell language="简体中文">{editingAll ? <EditArea name="proposal_highlights_cn" value={property.proposal_highlights_cn} /> : <InlineTextAreaField hideLabel label="交通及可达性" value={property.proposal_highlights_cn} onSave={save("proposal_highlights_cn")} />}</LanguageCell>
      </FieldRow>

      <FieldRow title="Facilities & Amenities">
        <LanguageCell language="English">{editingAll ? <EditArea name="facilities" value={property.facilities} /> : <InlineTextAreaField hideLabel label="Facilities & Amenities" value={property.facilities} onSave={save("facilities")} />}</LanguageCell>
        <LanguageCell language="繁體中文">{editingAll ? <EditArea name="facilities_zh" value={property.facilities_zh} /> : <InlineTextAreaField hideLabel label="設施及配套" value={property.facilities_zh} onSave={save("facilities_zh")} />}</LanguageCell>
        <LanguageCell language="简体中文">{editingAll ? <EditArea name="facilities_cn" value={property.facilities_cn} /> : <InlineTextAreaField hideLabel label="设施及配套" value={property.facilities_cn} onSave={save("facilities_cn")} />}</LanguageCell>
      </FieldRow>

      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Automatic translation remains unavailable until a translation provider is connected. Future drafts should fill missing fields only and require review before saving.
      </p>
      {saveError ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{saveError}</p> : null}
    </form>
  );
}
