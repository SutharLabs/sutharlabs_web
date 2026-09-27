import type { Request, Response, NextFunction } from "express";

/**
 * Centralized Application Error Handling Middleware
 * Catches unhandled synchronous or asynchronous exceptions across the API.
 */
export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error(`[Error Handler] ${req.method} ${req.originalUrl || req.url} failed:`, err);

  const isProduction = process.env.NODE_ENV === "production";

  return res.status(status).json({
    error: isProduction && status === 500 ? "Internal Server Error occurred." : message,
    code: err.code || "INTERNAL_SERVER_ERROR",
    ...(isProduction ? {} : { stack: err.stack })
  });
}

/**
 * 404 Not Found Middleware for unknown /api/* routes
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.originalUrl || req.url}`,
    code: "NOT_FOUND"
  });
}
