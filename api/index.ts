import app, { startPromise } from '../server';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Ensure the server has finished bootstrapping routes and plugins
  await startPromise;
  
  // Hand off to Express
  return app(req as any, res as any);
}
