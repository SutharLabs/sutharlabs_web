import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import crypto from 'crypto';

neonConfig.webSocketConstructor = ws;

export const SECRET_KEY = process.env.JWT_SECRET || "suthar-labs-sovereign-secret-key-2026-matrix-neon";

let cachedPrisma: PrismaClient | null = null;

export function getPrismaClient() {
  if (cachedPrisma) return cachedPrisma;
  const dbUrl = process.env["NEON_DB_URL"] || process.env["DATABASE_URL"];
  if (!dbUrl) {
    throw new Error(`getPrismaClient failed: Database URL is undefined! NEON_DB_URL=${typeof process.env["NEON_DB_URL"]}, DATABASE_URL=${typeof process.env["DATABASE_URL"]}`);
  }
  console.log("getPrismaClient dbUrl type:", typeof dbUrl, "value prefix:", dbUrl ? dbUrl.substring(0, 10) : "null");
  const pool = new Pool({ connectionString: dbUrl });
  const adapter = new PrismaNeon(pool as any);
  cachedPrisma = new PrismaClient({ adapter });
  return cachedPrisma;
}

export function generateToken(payload: object): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 24 * 60 * 60 * 1000 })).toString("base64url");
  const signature = crypto.createHmac("sha256", SECRET_KEY).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): any {
  try {
    const [header, body, signature] = token.split(".");
    if (!header || !body || !signature) return null;
    const expectedSignature = crypto.createHmac("sha256", SECRET_KEY).update(`${header}.${body}`).digest("base64url");
    if (signature !== expectedSignature) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}
