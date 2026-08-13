/** Common dialing codes for contact Phone / Mobile / WhatsApp. */
export const PHONE_AREA_CODES = [
  { value: "+852", label: "+852 Hong Kong" },
  { value: "+853", label: "+853 Macau" },
  { value: "+86", label: "+86 China" },
  { value: "+65", label: "+65 Singapore" },
  { value: "+886", label: "+886 Taiwan" },
  { value: "+81", label: "+81 Japan" },
  { value: "+82", label: "+82 Korea" },
  { value: "+66", label: "+66 Thailand" },
  { value: "+60", label: "+60 Malaysia" },
  { value: "+62", label: "+62 Indonesia" },
  { value: "+63", label: "+63 Philippines" },
  { value: "+84", label: "+84 Vietnam" },
  { value: "+61", label: "+61 Australia" },
  { value: "+44", label: "+44 UK" },
  { value: "+1", label: "+1 US/Canada" },
] as const;

export const DEFAULT_PHONE_AREA_CODE = "+852";

export function normalizePhoneAreaCode(value: string | null | undefined): string | null {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  const withPlus = raw.startsWith("+") ? raw : `+${raw.replace(/^\+/, "")}`;
  return withPlus || null;
}

export function formatPhoneDisplay(
  areaCode: string | null | undefined,
  number: string | null | undefined,
): string | null {
  const local = (number ?? "").trim();
  if (!local) return null;
  const area = normalizePhoneAreaCode(areaCode);
  return area ? `${area} ${local}` : local;
}

export function phoneDigitsForDial(
  areaCode: string | null | undefined,
  number: string | null | undefined,
): string {
  const combined = `${normalizePhoneAreaCode(areaCode) ?? ""}${number ?? ""}`;
  return combined.replace(/\D/g, "");
}

export function telHref(areaCode: string | null | undefined, number: string | null | undefined): string | null {
  const digits = phoneDigitsForDial(areaCode, number);
  return digits ? `tel:+${digits}` : null;
}

export function whatsAppHrefFromParts(
  areaCode: string | null | undefined,
  number: string | null | undefined,
): string | null {
  const digits = phoneDigitsForDial(areaCode, number);
  return digits ? `https://wa.me/${digits}` : null;
}
