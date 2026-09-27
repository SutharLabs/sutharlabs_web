import app, { startPromise } from '../server.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Restore original URL for Express routing via our explicit rewrite query parameter
  if (req.query && req.query.apiPath) {
    const apiPath = Array.isArray(req.query.apiPath) ? req.query.apiPath[0] : req.query.apiPath;
    const urlObj = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    urlObj.searchParams.delete('apiPath');
    const search = urlObj.searchParams.toString();
    req.url = `/api/${apiPath}${search ? '?' + search : ''}`;
  } else if (req.url && req.url.startsWith('/api/server')) {
    // Fallback if Vercel Edge routing directly invoked the function without the rewrite
    req.url = req.url.replace('/api/server', '/api');
  }
  
  // Ensure the server has finished bootstrapping routes and plugins (if applicable)
  await startPromise;
  
  console.log(`[Vercel Handler] Handing off to Express: ${req.method} ${req.url}`);

  // Hand off to Express
  return app(req as any, res as any);
}
