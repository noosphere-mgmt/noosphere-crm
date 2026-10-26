import { OPPORTUNITY_STATUS_PROBABILITY, normalizeOpportunityStatus } from "@/lib/opportunityStatusModel";

export function defaultOpportunityProbability(status: string): number {
  return OPPORTUNITY_STATUS_PROBABILITY[normalizeOpportunityStatus(status)] ?? 10;
}

export function parseOpportunityProbability(value: unknown): number {
  if ((typeof value !== "number" && typeof value !== "string") || String(value).trim() === "") {
    throw new Error("Probability must be a whole number from 0 to 100");
  }
  const probability = Number(value);
  if (!Number.isInteger(probability) || probability < 0 || probability > 100) {
    throw new Error("Probability must be a whole number from 0 to 100");
  }
  return probability;
}
