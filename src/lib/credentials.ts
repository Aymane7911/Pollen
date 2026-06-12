import { writeFile, mkdir } from "node:fs/promises";
import { join, extname } from "node:path";
import { randomBytes } from "node:crypto";

// Registration credential documents (CV / certificate / ID) are SENSITIVE, so they are
// stored OUTSIDE public/ (never statically served) and streamed only to admins via
// /api/admin/credential/[id]. Filenames are random; the original name is discarded.
export const CREDENTIALS_DIR = join(process.cwd(), "storage", "credentials");
export const CREDENTIAL_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export const CREDENTIAL_MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

/** Extension (lowercased, incl. dot) if it's an accepted credential type, else null. */
export function credentialExt(filename: string): string | null {
  const ext = extname(filename).toLowerCase();
  return CREDENTIAL_MIME[ext] ? ext : null;
}

/** Write a validated credential file to private storage; returns the stored filename. */
export async function writeCredential(file: File, ext: string): Promise<string> {
  const name = `${randomBytes(12).toString("hex")}${ext}`;
  await mkdir(CREDENTIALS_DIR, { recursive: true });
  await writeFile(join(CREDENTIALS_DIR, name), Buffer.from(await file.arrayBuffer()));
  return name;
}
