import app, { startPromise } from '../server.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Backend routing provider: 'ORACLE' | 'VERCEL' (default: 'VERCEL')
const BACKEND_TARGET = (process.env.BACKEND_TARGET || 'VERCEL').toUpperCase();
const ORACLE_BACKEND_URL = (process.env.ORACLE_BACKEND_URL || process.env.ORACLE_AI_URL || '').replace(/\/$/, '');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Restore original URL for Express routing via our explicit rewrite query parameter
  let targetPath = req.url || '/';
  if (req.query && req.query.apiPath) {
    const apiPath = Array.isArray(req.query.apiPath) ? req.query.apiPath[0] : req.query.apiPath;
    const urlObj = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    urlObj.searchParams.delete('apiPath');
    const search = urlObj.searchParams.toString();
    targetPath = `/api/${apiPath}${search ? '?' + search : ''}`;
    req.url = targetPath;
  } else if (req.url && req.url.startsWith('/api/server')) {
    targetPath = req.url.replace('/api/server', '/api');
    req.url = targetPath;
  }

  // =========================================================================
  // OPTION 2: DUAL-MODE SMART PROXY (SINGLE-SWITCH ROUTING TO ORACLE VM)
  // =========================================================================
  if (BACKEND_TARGET === 'ORACLE' && ORACLE_BACKEND_URL) {
    try {
      const destinationUrl = `${ORACLE_BACKEND_URL}${targetPath}`;
      console.log(`[Vercel Smart Switch] Proxying ${req.method} ${targetPath} -> ${destinationUrl}`);

      // Forward request headers, sanitizing host
      const forwardHeaders: Record<string, string> = {};
      for (const [key, val] of Object.entries(req.headers)) {
        if (val !== undefined && key.toLowerCase() !== 'host') {
          forwardHeaders[key] = Array.isArray(val) ? val.join(', ') : String(val);
        }
      }
      forwardHeaders['x-forwarded-host'] = req.headers.host || 'www.sutharlabs.com';
      forwardHeaders['x-forwarded-proto'] = 'https';

      let body: any = undefined;
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method || '')) {
        if (req.body) {
          body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
          if (!forwardHeaders['content-type']) {
            forwardHeaders['content-type'] = 'application/json';
          }
        }
      }

      // 15-second timeout safeguard for Oracle VM proxying before triggering automatic fallback
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const proxyRes = await fetch(destinationUrl, {
        method: req.method,
        headers: forwardHeaders,
        body,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      // Relay response headers (excluding hop-by-hop headers)
      proxyRes.headers.forEach((val, key) => {
        if (!['content-encoding', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
          res.setHeader(key, val);
        }
      });
      res.setHeader('x-backend-provider', 'oracle-vm');
      res.status(proxyRes.status);

      const data = Buffer.from(await proxyRes.arrayBuffer());
      return res.send(data);
    } catch (proxyError: any) {
      console.warn(`[Vercel Smart Switch] Oracle VM proxy failed: ${proxyError.message}. Triggering automatic failover to local Vercel execution.`);
      res.setHeader('x-backend-fallback', 'true');
      res.setHeader('x-backend-fallback-reason', proxyError.message || 'connection_failure');
    }
  }

  // =========================================================================
  // LOCAL VERCEL SERVERLESS EXECUTION (DEFAULT OR FAILOVER)
  // =========================================================================
  await startPromise;
  res.setHeader('x-backend-provider', 'vercel-serverless');
  console.log(`[Vercel Handler] Handing off to local Express: ${req.method} ${req.url}`);
  return app(req as any, res as any);
}
