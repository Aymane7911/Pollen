// Password hashing with Node's built-in scrypt (no native deps; runs under tsx too,
// so the admin-seed script can reuse it without importing Next-only modules).
import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

export async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(pw, salt, 64)) as Buffer;
  return `scrypt:${salt}:${buf.toString("hex")}`;
}

export async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const [scheme, salt, hash] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const buf = (await scryptAsync(pw, salt, 64)) as Buffer;
  const hashBuf = Buffer.from(hash, "hex");
  return hashBuf.length === buf.length && timingSafeEqual(hashBuf, buf);
}
