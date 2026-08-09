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
    const projects = await prisma.developmentProject.findMany({
      orderBy: { title: 'asc' }
    });
    // Parse the techs JSON string back to array for the frontend
    const parsed = projects.map(p => ({ ...p, techs: JSON.parse(p.techs) }));
    res.status(200).json(parsed);
  } catch (err) {
    console.error('[api/portfolios] Error:', err);
    res.status(500).json({ error: 'Failed to fetch portfolios' });
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}
