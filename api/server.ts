import app, { startPromise } from '../server.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Restore original URL for Express routing
  const originalPath = req.headers['x-invoke-path'] || req.headers['x-now-route-matches'];
  if (originalPath && typeof originalPath === 'string') {
    req.url = originalPath.startsWith('/') ? originalPath : `/${originalPath}`;
  } else if (req.url?.startsWith('/api/server')) {
    // Fallback manual restoration if headers are missing
    req.url = req.url.replace('/api/server', '/api');
  }
  
  // Ensure the server has finished bootstrapping routes and plugins
  await startPromise;
  
  // Hand off to Express
  return app(req as any, res as any);
}
