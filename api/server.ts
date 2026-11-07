import type { VercelRequest, VercelResponse } from '@vercel/node';

// Backend routing provider: 'ORACLE' | 'VERCEL' (default: 'ORACLE' since dedicated VM 3 is live)
const BACKEND_TARGET = (process.env.BACKEND_TARGET || 'ORACLE').toUpperCase();
const ORACLE_BACKEND_URL = (
  process.env.ORACLE_BACKEND_URL ||
  process.env.ORACLE_WEB_URL ||
  'http://130.210.37.199'
).replace(/\/$/, '');

// Disable Vercel's default body parser so multipart chunk streaming and raw file bodies pass through uncorrupted
export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

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
  // OPTION 1: SMART PROXY TO DEDICATED ORACLE CLOUD VM (VM 3: 130.210.37.199)
  // =========================================================================
  if (BACKEND_TARGET === 'ORACLE' && ORACLE_BACKEND_URL) {
    try {
      const destinationUrl = `${ORACLE_BACKEND_URL}${targetPath}`;
      console.log(`[Vercel Smart Switch] Proxying ${req.method} ${targetPath} -> ${destinationUrl}`);

      // Forward request headers, sanitizing host and content-length
      const forwardHeaders: Record<string, string> = {};
      for (const [key, val] of Object.entries(req.headers)) {
        const lowerKey = key.toLowerCase();
        if (val !== undefined && lowerKey !== 'host' && lowerKey !== 'content-length') {
          forwardHeaders[key] = Array.isArray(val) ? val.join(', ') : String(val);
        }
      }
      forwardHeaders['x-forwarded-host'] = req.headers.host || 'www.sutharlabs.com';
      forwardHeaders['x-forwarded-proto'] = 'https';

      const isLongRunningRoute =
        targetPath.startsWith('/api/ai/chat') ||
        targetPath.startsWith('/api/vault/upload') ||
        targetPath.startsWith('/api/vault/complete-chunk-upload') ||
        targetPath.includes('ocr-receipt') ||
        targetPath.startsWith('/api/vault/download');

      const isMultipart = (req.headers['content-type'] || '').toLowerCase().includes('multipart/form-data');

      let body: any = undefined;
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method || '')) {
        if (isMultipart) {
          // Pass raw body or stream for file uploads to preserve binary integrity
          if (Buffer.isBuffer(req.body)) {
            body = req.body;
          } else if (typeof req.body === 'string') {
            body = Buffer.from(req.body);
          } else {
            body = req;
          }
        } else if (req.body) {
          body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
          if (!forwardHeaders['content-type']) {
            forwardHeaders['content-type'] = 'application/json';
          }
        }
      }

      // Dynamic timeout: 120s for AI inference, OCR, and large file uploads; 15s for standard API queries
      const timeoutMs = isLongRunningRoute ? 120000 : 15000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const fetchOptions: any = {
        method: req.method,
        headers: forwardHeaders,
        body,
        signal: controller.signal
      };

      // For Node fetch streaming upload support
      if (body === req || (body && typeof body.pipe === 'function')) {
        fetchOptions.duplex = 'half';
      }

      const proxyRes = await fetch(destinationUrl, fetchOptions);
      clearTimeout(timeoutId);

      // Relay response headers (excluding hop-by-hop headers)
      proxyRes.headers.forEach((val, key) => {
        const lower = key.toLowerCase();
        if (!['content-encoding', 'transfer-encoding', 'connection'].includes(lower)) {
          res.setHeader(key, val);
        }
      });
      res.setHeader('x-backend-provider', 'oracle-vm');
      res.status(proxyRes.status);

      const resContentType = proxyRes.headers.get('content-type') || '';
      // Direct stream piping for SSE AI chat and large downloads to prevent mobile timeouts and memory bloat
      if ((resContentType.includes('text/event-stream') || isLongRunningRoute) && proxyRes.body) {
        const { Readable } = await import('stream');
        const nodeStream = Readable.fromWeb(proxyRes.body as any);
        return nodeStream.pipe(res);
      }

      const data = Buffer.from(await proxyRes.arrayBuffer());
      return res.send(data);
    } catch (proxyError: any) {
      console.warn(`[Vercel Smart Switch] Oracle VM proxy failed: ${proxyError.message}. Triggering automatic failover to local Vercel execution.`);
      res.setHeader('x-backend-fallback', 'true');
      res.setHeader('x-backend-fallback-reason', proxyError.message || 'connection_failure');
    }
  }

  // =========================================================================
  // LOCAL VERCEL SERVERLESS EXECUTION (LAZY LOADED FAILOVER ONLY)
  // =========================================================================
  try {
    process.env.VERCEL = process.env.VERCEL || '1';
    const { default: app, startPromise } = await import('../server.js');
    await startPromise;
    res.setHeader('x-backend-provider', 'vercel-serverless');
    console.log(`[Vercel Handler] Handing off to local Express: ${req.method} ${req.url}`);
    return app(req as any, res as any);
  } catch (err: any) {
    console.error('[Vercel Handler] Fatal error during local bootstrap:', err);
    res.status(500).json({
      error: 'Backend service temporarily unavailable. Please retry in a few moments.',
      detail: err.message
    });
  }
}
