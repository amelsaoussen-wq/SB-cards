import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, expected] = parts;
  try {
    const derived = scryptSync(password, salt, 64);
    const expectedBuffer = Buffer.from(expected, "hex");
    if (expectedBuffer.length !== derived.length) return false;
    return timingSafeEqual(derived, expectedBuffer);
  } catch {
    return false;
  }
}

export function createToken(): string {
  return randomBytes(32).toString("hex");
}

export function newShareCode(seed: string): string {
  const base = seed
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42);
  const suffix = randomBytes(3).toString("hex");
  return base ? `${base}-${suffix}` : `card-${suffix}`;
}
