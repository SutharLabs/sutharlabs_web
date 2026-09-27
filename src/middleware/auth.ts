import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../../api/_utils.js";

export interface AuthenticatedUser {
  id?: string;
  name?: string;
  email?: string;
  role?: "Admin" | "Developer" | "User" | "Banned";
  [key: string]: any;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Authentication Middleware:
 * Inspects `Authorization: Bearer <token>`, validates cryptographic signature & expiration.
 */
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      error: "Access Denied: Bearer authentication token is required.",
      code: "AUTH_TOKEN_REQUIRED"
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({
      error: "Access Denied: Session token is invalid or has expired.",
      code: "AUTH_TOKEN_INVALID"
    });
  }

  if (decoded.role === "Banned") {
    return res.status(403).json({
      error: "Access Denied: Account has been suspended.",
      code: "ACCOUNT_SUSPENDED"
    });
  }

  req.user = decoded;
  next();
}

/**
 * Admin-only authorization guard — must be chained after authenticateToken
 */
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "Admin") {
    return res.status(403).json({
      error: "Access Denied: Administrator privileges are required for this operation.",
      code: "ADMIN_REQUIRED"
    });
  }
  next();
}

/**
 * Generic multi-role guard: allows any specified role
 */
export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role || "")) {
      return res.status(403).json({
        error: `Access Denied: Required role [${roles.join(", ")}].`,
        code: "ROLE_UNAUTHORIZED"
      });
    }
    next();
  };
}

/**
 * Optional Authentication:
 * Attaches user to `req.user` if valid token is present, but doesn't block unauthenticated guests.
 */
export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token) {
    const decoded = verifyToken(token);
    if (decoded && decoded.role !== "Banned") {
      req.user = decoded;
    }
  }
  next();
}
