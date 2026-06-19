import type { ImportFieldDef } from "./objectRegistry";
import { isBlank, parseBoolean, parseDate, parseIntStrict, parseNumber, parseStringArray } from "./normalize";
import { COMPANY_ROLES, COMPANY_ROLE_LABELS } from "@/lib/lookups";
import type { CompanyRole } from "@/lib/types/entities";

export function isFieldSupplied(fieldKey: string, suppliedFields: Set<string>): boolean {
  return suppliedFields.has(fieldKey);
}

type CoerceResult = {
  value: unknown;
  cleared: boolean;
  error?: string;
};

export function coerceFieldValue(
  field: ImportFieldDef,
  raw: unknown,
  opts?: { strict?: boolean },
): CoerceResult {
  const str = raw == null ? "" : String(raw);

  if (isBlank(str)) {
    return { value: null, cleared: true };
  }

  switch (field.type) {
    case "string":
      return { value: str.trim(), cleared: false };
    case "number": {
      const n = field.integer ? parseIntStrict(str) : parseNumber(str);
      if (n == null && opts?.strict) return { value: null, cleared: false, error: "invalid number" };
      return { value: n, cleared: false };
    }
    case "boolean": {
      const b = parseBoolean(str);
      if (b == null && opts?.strict) return { value: null, cleared: false, error: "invalid boolean" };
      return { value: b, cleared: false };
    }
    case "date": {
      const d = parseDate(str);
      if (d == null && opts?.strict) return { value: null, cleared: false, error: "use YYYY-MM-DD" };
      return { value: d, cleared: false };
    }
    case "enum": {
      const v = str.trim();
      const allowed = field.enumValues ?? [];
      const match = allowed.find((a) => a.toLowerCase() === v.toLowerCase());
      if (!match && opts?.strict) {
        return { value: null, cleared: false, error: `must be one of: ${allowed.join(", ")}` };
      }
      return { value: match ?? v, cleared: false };
    }
    case "company_roles": {
      const parts = parseStringArray(str);
      const roles: CompanyRole[] = [];
      for (const part of parts) {
        const slug = part.trim().toLowerCase().replace(/\s+/g, "_");
        const byLabel = (COMPANY_ROLES as readonly string[]).find(
          (r) => r === slug || COMPANY_ROLE_LABELS[r as CompanyRole].toLowerCase() === part.trim().toLowerCase(),
        );
        if (byLabel) roles.push(byLabel as CompanyRole);
        else if (opts?.strict) {
          return {
            value: null,
            cleared: false,
            error: `invalid role "${part}"; use: ${COMPANY_ROLES.map((r) => COMPANY_ROLE_LABELS[r]).join(", ")}`,
          };
        }
      }
      return { value: roles.length ? roles : ["client"], cleared: false };
    }
    case "string_array":
      return { value: parseStringArray(str), cleared: false };
    default:
      return { value: str.trim(), cleared: false };
  }
}

export function coerceRecordId(raw: unknown, idType: "number" | "text"): number | string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  if (idType === "number") {
    const n = parseIntStrict(s);
    return n != null && n > 0 ? n : null;
  }
  return s;
}

export function coerceId(raw: unknown): number | null {
  const n = parseIntStrict(String(raw ?? ""));
  return n != null && n > 0 ? n : null;
}
