import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPrismaClient } from './_utils';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const prisma = getPrismaClient();
    const projects = await prisma.developmentProject.findMany({
      orderBy: { title: 'asc' }
    });
    // Parse the techs JSON string back to array for the frontend
    const parsed = projects.map(p => ({ ...p, techs: JSON.parse(p.techs) }));
    res.status(200).json(parsed);
  } catch (err) {
    console.error('[api/portfolios] Error:', err);
    res.status(500).json({ error: 'Failed to fetch portfolios' });
  }
}
