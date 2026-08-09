import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaNeon(pool as any);
  const prisma = new PrismaClient({ adapter });

  try {
    const plugins = await prisma.plugin.findMany({
      orderBy: { name: 'asc' }
    });
    // Parse the tags JSON string back to array for the frontend
    const parsed = plugins.map(p => ({ ...p, tags: JSON.parse(p.tags) }));
    res.status(200).json(parsed);
  } catch (err) {
    console.error('[api/plugins] Error:', err);
    res.status(500).json({ error: 'Failed to fetch plugins' });
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}
