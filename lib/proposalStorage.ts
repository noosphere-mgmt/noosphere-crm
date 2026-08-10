import path from "node:path";
import { mkdir, writeFile, readFile, access, unlink } from "node:fs/promises";
import { proposalStorageRoot } from "@/lib/proposals/i18n";

export function proposalPdfRelativePath(opportunityId: number, proposalId: number, version: number): string {
  return path.join(String(opportunityId), `${proposalId}-v${version}.pdf`);
}

export function proposalPdfAbsolutePath(relativePath: string): string {
  return path.join(proposalStorageRoot(), relativePath);
}

export async function saveProposalPdf(
  opportunityId: number,
  proposalId: number,
  version: number,
  buffer: Buffer,
): Promise<string> {
  const relative = proposalPdfRelativePath(opportunityId, proposalId, version);
  const absolute = proposalPdfAbsolutePath(relative);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, buffer);
  return relative;
}

export async function readProposalPdf(relativePath: string): Promise<Buffer | null> {
  try {
    const absolute = proposalPdfAbsolutePath(relativePath);
    await access(absolute);
    return readFile(absolute);
  } catch {
    return null;
  }
}

export async function removeProposalPdf(relativePath: string | null | undefined): Promise<void> {
  if (!relativePath?.trim()) return;
  const root = path.resolve(proposalStorageRoot());
  const absolute = path.resolve(root, relativePath);
  if (!absolute.startsWith(`${root}${path.sep}`)) throw new Error("Invalid proposal file path");
  try {
    await unlink(absolute);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
