export type AddressParts = {
  streetNo?: string | null;
  streetName?: string | null;
  district?: string | null;
  city?: string | null;
};

function trim(s: string | null | undefined): string {
  return (s ?? "").trim();
}

function formatEnglishStreetLine(streetNo: string, streetName: string): string {
  if (streetNo && streetName) return `${streetNo}, ${streetName}`;
  return streetNo || streetName;
}

/** English: Street no., Street, District, City (e.g. 418, Kwun Tong Road, Kwun Tong, Kowloon) */
export function composeAddressEnglish(parts: AddressParts): string {
  const streetNo = trim(parts.streetNo);
  const streetName = trim(parts.streetName);
  const district = trim(parts.district);
  const city = trim(parts.city);

  const streetLine = formatEnglishStreetLine(streetNo, streetName);
  return [streetLine, district, city].filter(Boolean).join(", ");
}

export function hasAddressParts(parts: AddressParts): boolean {
  return [parts.streetNo, parts.streetName, parts.district, parts.city].some((p) => trim(p));
}

export function composePropertyFullAddresses(parts: {
  street_no?: string | null;
  street_name_en?: string | null;
  district_en?: string | null;
  city_en?: string | null;
  street_name_zh?: string | null;
  district_zh?: string | null;
  city_zh?: string | null;
  street_name_cn?: string | null;
  district_cn?: string | null;
  city_cn?: string | null;
}): {
  full_address_en: string | null;
  full_address_zh: string | null;
  full_address_cn: string | null;
} {
  return {
    full_address_en:
      composeAddressEnglish({
        streetNo: parts.street_no,
        streetName: parts.street_name_en,
        district: parts.district_en,
        city: parts.city_en,
      }) || null,
    full_address_zh:
      composeAddressChinese({
        streetNo: parts.street_no,
        streetName: parts.street_name_zh,
        district: parts.district_zh,
        city: parts.city_zh,
      }) || null,
    full_address_cn:
      composeAddressChinese({
        streetNo: parts.street_no,
        streetName: parts.street_name_cn,
        district: parts.district_cn,
        city: parts.city_cn,
      }) || null,
  };
}

/** Chinese: City | District | Street + Street No + 號 (e.g. 九龍 | 觀塘 | 觀塘道418號) */
export function composeAddressChinese(parts: AddressParts): string {
  const city = trim(parts.city);
  const district = trim(parts.district);
  const street = trim(parts.streetName);
  const streetNo = trim(parts.streetNo);

  const streetLine = street && streetNo ? `${street}${streetNo}號` : street || (streetNo ? `${streetNo}號` : "");

  return [city, district, streetLine].filter(Boolean).join(" | ");
}

/** @deprecated Use composeAddressEnglish */
export function composeAddress(parts: AddressParts): string {
  return composeAddressEnglish(parts);
}
