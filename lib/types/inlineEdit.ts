export type InlineSaveStatus = "idle" | "saving" | "saved" | "error";

export type PatchResult = { ok: true } | { ok: false; error: string };
