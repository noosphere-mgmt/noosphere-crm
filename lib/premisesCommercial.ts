import { formatMoney, formatPsf, formatCurrencyPsf } from "@/lib/formatCurrency";
import { isListingIntentForSale } from "@/lib/premisesListing";

const PACKAGE_OPERATING_MODELS = new Set(["Serviced Office", "Shared Office"]);

export function isPackageOperatingModel(operatingModel: string | null | undefined): boolean {
  return PACKAGE_OPERATING_MODELS.has((operatingModel ?? "").trim());
}

export function isConventionalOperatingModel(operatingModel: string | null | undefined): boolean {
  return (operatingModel ?? "").trim() === "Conventional";
}

export function monthlyRentFieldLabel(operatingModel: string | null | undefined): string {
  return isPackageOperatingModel(operatingModel) ? "Package monthly fee" : "Monthly rent";
}

export function packageFeesNote(operatingModel: string | null | undefined): string | null {
  if (!isPackageOperatingModel(operatingModel)) return null;
  return "Serviced / shared office: package fee in monthly rent. Management fee and government rates are 0.";
}

export function getPremisesRowPriceDisplay(
  row: {
    inventory_status: string | null;
    monthly_rent: string | null;
    rent_psf: string | null;
    asking_sale_price: string | null;
    sale_price_psf: string | null;
    currency: string | null;
  },
  options?: { psfAsCurrency?: boolean },
): { price: string; psf: string } {
  const currency = row.currency ?? "HKD";
  const formatPsfValue = options?.psfAsCurrency ? formatCurrencyPsf : formatPsf;
  if (isListingIntentForSale(row.inventory_status)) {
    return {
      price: formatMoney(row.asking_sale_price, currency),
      psf: formatPsfValue(row.sale_price_psf, currency),
    };
  }
  return {
    price: formatMoney(row.monthly_rent, currency),
    psf: formatPsfValue(row.rent_psf, currency),
  };
}
