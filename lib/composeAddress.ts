export type AddressParts = {
  streetNo?: string | null;
  streetName?: string | null;
  district?: string | null;
  city?: string | null;
};

function trim(s: string | null | undefined): string {
  return (s ?? "").trim();
}

/** English: Street No + Street, District, City (e.g. 418 Kwun Tong Road, Kwun Tong, Kowloon) */
export function composeAddressEnglish(parts: AddressParts): string {
  const streetNo = trim(parts.streetNo);
  const streetName = trim(parts.streetName);
  const district = trim(parts.district);
  const city = trim(parts.city);

  const streetLine = [streetNo, streetName].filter(Boolean).join(" ");
  return [streetLine, district, city].filter(Boolean).join(", ");
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
