import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPrismaClient } from './_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const prisma = getPrismaClient();

  try {
    const plugins = await prisma.plugin.findMany({
      orderBy: { name: 'asc' }
    });
    // Parse the tags JSON string back to array for the frontend
    const parsed = plugins.map(p => ({ ...p, tags: JSON.parse(p.tags) }));
    res.status(200).json(parsed);
  } catch (err: any) {
    console.error('[api/plugins] Error:', err);
    res.status(500).json({ error: 'Failed to fetch plugins', details: err?.message || String(err) });
  }
}
