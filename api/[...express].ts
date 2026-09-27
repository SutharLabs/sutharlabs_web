import app, { startPromise } from '../server.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // In Vercel, req.url often strips the /api base path when using catch-all routes.
  // We need to restore it so Express router can match correctly.
  if (req.url && !req.url.startsWith('/api')) {
    req.url = `/api${req.url === '/' ? '' : req.url}`;
  }
  
  // Ensure the server has finished bootstrapping routes and plugins (if applicable)
  await startPromise;
  
  console.log(`[Vercel Handler] Handing off to Express: ${req.method} ${req.url}`);

  // Hand off to Express
  return app(req as any, res as any);
}
