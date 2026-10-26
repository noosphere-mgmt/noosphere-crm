export const SERVICE_DELIVERY_STATUSES = ["not_started", "in_progress", "completed"] as const;
export type ServiceDeliveryStatus = (typeof SERVICE_DELIVERY_STATUSES)[number];
export const SERVICE_DELIVERY_LABELS: Record<ServiceDeliveryStatus, string> = {
  not_started: "N/A", in_progress: "In Progress", completed: "Completed",
};
export type DeliveryOpportunity = {
  status: string;
  service_delivery_status?: ServiceDeliveryStatus;
  service_due_date?: string | null;
};
export function parseServiceDeliveryStatus(value: unknown): ServiceDeliveryStatus {
  if (value === "N/A" || value === "n/a") return "not_started";
  if (!(SERVICE_DELIVERY_STATUSES as readonly unknown[]).includes(value)) throw new Error("Invalid service delivery status");
  return value as ServiceDeliveryStatus;
}
export function parseServiceDueDate(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      Number.isNaN(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) {
    throw new Error("Service due date must be a valid calendar date");
  }
  return value;
}
export function hasOutstandingDelivery(row: DeliveryOpportunity): boolean {
  return row.status === "closed_won" && row.service_delivery_status !== "completed";
}
export function isServiceDeliveryOverdue(row: DeliveryOpportunity, today?: string): boolean {
  const now = new Date();
  const date = today ?? `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
  return row.status === "closed_won" && row.service_delivery_status !== "completed" &&
    !!row.service_due_date && row.service_due_date.slice(0,10) < date;
}

/** Business calendar date, independent of the deployment server timezone. */
export function todayServiceDate(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Hong_Kong", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
}

export function serviceDateOnCompletion(
  nextStatus: ServiceDeliveryStatus | undefined,
  previousStatus: ServiceDeliveryStatus | undefined,
  nextDate: string | null | undefined,
  previousDate: string | null | undefined,
  today = todayServiceDate(),
): string | null | undefined {
  if (nextStatus === "completed" && previousStatus !== "completed" &&
      (nextDate === undefined || nextDate === previousDate)) return today;
  return nextDate;
}

export function serviceDeliveryForStage(stage: string, delivery?: ServiceDeliveryStatus): ServiceDeliveryStatus {
  return stage === "closed_won" ? delivery ?? "not_started" : "not_started";
}
