/**
 * @deprecated Legacy assets/inventory write path retired. Use `@/lib/quickAddProperty`.
 */
export {
  quickAddProperty,
  type QuickAddPropertyInput,
} from "./quickAddProperty";

import { quickAddProperty, type QuickAddPropertyInput } from "./quickAddProperty";

/** @deprecated Use quickAddProperty */
export async function quickAddOffer(input: QuickAddPropertyInput): Promise<number> {
  return quickAddProperty(input);
}

/** @deprecated Use quickAddProperty */
export const quickAddInventory = quickAddOffer;

export type QuickAddOfferInput = QuickAddPropertyInput;
export type QuickAddInventoryInput = QuickAddPropertyInput;
