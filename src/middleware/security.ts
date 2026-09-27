import type { Request, Response, NextFunction } from "express";

/**
 * Modern HTTP Security Headers Middleware
 * Protects against MIME-sniffing, clickjacking, and XSS attacks.
 * Replaces heavy external dependencies like Helmet with zero overhead.
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent browsers from MIME-sniffing a response away from declared content-type
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Prevent clickjacking by forbidding embedding in foreign iframes
  res.setHeader("X-Frame-Options", "SAMEORIGIN");

  // Enable legacy browser XSS filters
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Limit referrer information sent to other sites
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Standard CORS headers for API consumers
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.setHeader("Access-Control-Max-Age", "86400"); // 24-hour preflight cache

  // Immediately respond to preflight OPTIONS requests without invoking route logic
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  next();
}
