import path from "node:path";
import { access, mkdir, readFile, unlink, writeFile } from "node:fs/promises";

function storageRoot(): string {
  return process.env.OPPORTUNITY_DOCUMENTS_ROOT?.trim() || path.join(process.cwd(), "data", "opportunity-documents");
}

function safeAbsolute(relativePath: string): string {
  const root = path.resolve(storageRoot());
  const absolute = path.resolve(root, relativePath);
  if (!absolute.startsWith(`${root}${path.sep}`)) throw new Error("Invalid document file path");
  return absolute;
}

export async function saveOpportunityDocument(relativePath: string, bytes: Uint8Array): Promise<void> {
  const absolute = safeAbsolute(relativePath);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, bytes);
}

export async function readOpportunityDocument(relativePath: string): Promise<Buffer | null> {
  try {
    const absolute = safeAbsolute(relativePath);
    await access(absolute);
    return readFile(absolute);
  } catch {
    return null;
  }
}

export async function removeOpportunityDocument(relativePath: string): Promise<void> {
  try {
    await unlink(safeAbsolute(relativePath));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
