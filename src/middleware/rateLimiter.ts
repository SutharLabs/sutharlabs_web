import type { Request, Response, NextFunction } from "express";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export interface RateLimitOptions {
  windowMs: number;       // Window duration in ms
  max: number;            // Max requests per window per IP
  message?: string;       // Custom error message
}

/**
 * In-Memory Sliding-Window Rate Limiter
 * 100% Free, Zero-dependency, prevents brute-force & API abuse.
 */
export function createRateLimiter(options: RateLimitOptions) {
  const { windowMs, max, message = "Too many requests. Please slow down and try again later." } = options;
  const store = new Map<string, RateLimitRecord>();

  // Cleanup expired keys periodically to prevent memory leaks
  const cleanupInterval = Math.max(windowMs, 60000);
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) {
        store.delete(key);
      }
    }
  }, cleanupInterval);
  // Unref timer so it doesn't keep node process alive in test/serverless environments
  if (timer && typeof timer.unref === "function") {
    timer.unref();
  }

  return function rateLimiterMiddleware(req: Request, res: Response, next: NextFunction) {
    // Extract IP (handles X-Forwarded-For in Vercel / reverse proxy environments)
    const forwarded = req.headers["x-forwarded-for"];
    const ip = (typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.socket?.remoteAddress) || "unknown-ip";

    const now = Date.now();
    let record = store.get(ip);

    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      store.set(ip, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    // Standard RFC RateLimit headers
    res.setHeader("RateLimit-Limit", max.toString());
    res.setHeader("RateLimit-Remaining", remaining.toString());
    res.setHeader("RateLimit-Reset", resetSeconds.toString());

    if (record.count > max) {
      res.setHeader("Retry-After", resetSeconds.toString());
      return res.status(429).json({
        error: message,
        retryAfterSeconds: resetSeconds
      });
    }

    next();
  };
}

// 1. Auth limiter: 20 attempts / 5 minutes per IP (blocks credential stuffing)
export const authLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 20,
  message: "Too many authentication attempts. Please try again in 5 minutes."
});

// 2. Heavy API limiter: 60 requests / minute per IP (protects Yahoo Finance / Stock API)
export const stockApiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: "Stock Analyzer query limit reached (60 req/min). Please try again shortly."
});

// 3. General API limiter: 300 requests / minute per IP
export const generalApiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 300,
  message: "API rate limit exceeded. Please throttle your requests."
});
