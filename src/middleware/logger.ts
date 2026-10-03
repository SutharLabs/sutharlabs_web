import type { Request, Response, NextFunction } from "express";
import { recordApiRequest } from "../services/telemetryService.js";

/**
 * Production Request Performance Logger Middleware
 * Measures execution duration and flags slow API queries.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  // Skip static asset requests
  if (req.path.startsWith("/assets") || req.path.startsWith("/@") || req.path.includes(".")) {
    return next();
  }

  const start = performance.now();

  res.on("finish", () => {
    const duration = Math.round(performance.now() - start);
    recordApiRequest(duration, res.statusCode);
    const status = res.statusCode;
    const isSlow = duration > 1000;
    const slowBadge = isSlow ? " ⚠️ [SLOW]" : "";

    console.log(
      `[API] ${req.method.padEnd(6)} ${req.originalUrl || req.url} -> ${status} (${duration}ms)${slowBadge}`
    );
  });

  next();
}
