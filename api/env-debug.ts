import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const envKeys = Object.keys(process.env);
  res.status(200).json({
    hasNeonDbUrl: !!process.env.NEON_DB_URL,
    neonDbUrlLength: process.env.NEON_DB_URL ? process.env.NEON_DB_URL.length : 0,
    neonDbUrlPrefix: process.env.NEON_DB_URL ? process.env.NEON_DB_URL.substring(0, 15) : null,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasJwtSecret: !!process.env.JWT_SECRET,
    hasViteGoogleClientId: !!process.env.VITE_GOOGLE_CLIENT_ID,
    allKeys: envKeys,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV
  });
}
