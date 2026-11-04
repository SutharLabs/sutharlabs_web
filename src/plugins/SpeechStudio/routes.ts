import { Router, Request, Response } from "express";
import { verifyToken } from "../../../api/_utils.js";
import { TTSQuotaStatus } from "./types.js";

// In-memory rate limiting store (Window: 1 hour)
interface UserQuotaEntry {
  count: number;
  windowStart: number;
}

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const NON_ADMIN_LIMIT = 10; // 10 queries per hour for non-admins
const quotaStore = new Map<string, UserQuotaEntry>();

// Periodic cleanup of expired rate limit windows
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of quotaStore.entries()) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
      quotaStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

function getUserIdentifierAndRole(req: Request): { identifier: string; role: string; email?: string } {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (decoded && (decoded as any).email) {
      return {
        identifier: (decoded as any).email,
        role: (decoded as any).role || "Developer",
        email: (decoded as any).email
      };
    }
  }

  // Fallback to client IP
  const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "anonymous";
  return { identifier: `ip:${ip}`, role: "Guest" };
}

function getQuotaStatus(identifier: string, role: string): TTSQuotaStatus {
  const isAdmin = role === "Admin";
  if (isAdmin) {
    return {
      role: "Admin",
      isUnlimited: true,
      limit: Infinity,
      used: 0,
      remaining: Infinity,
      resetInSeconds: 0
    };
  }

  const now = Date.now();
  let entry = quotaStore.get(identifier);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    entry = { count: 0, windowStart: now };
    quotaStore.set(identifier, entry);
  }

  const resetInSeconds = Math.max(0, Math.ceil((entry.windowStart + RATE_LIMIT_WINDOW_MS - now) / 1000));
  const remaining = Math.max(0, NON_ADMIN_LIMIT - entry.count);

  return {
    role,
    isUnlimited: false,
    limit: NON_ADMIN_LIMIT,
    used: entry.count,
    remaining,
    resetInSeconds
  };
}

export function registerRoutes(router: Router) {
  // GET /quota - Returns user quota status
  router.get("/quota", (req: Request, res: Response) => {
    const { identifier, role } = getUserIdentifierAndRole(req);
    const quota = getQuotaStatus(identifier, role);
    return res.json(quota);
  });

  // POST /synthesize - Validates text and rate limiting
  router.post("/synthesize", (req: Request, res: Response) => {
    const { identifier, role, email } = getUserIdentifierAndRole(req);
    const { text, lang = "en-US", voiceName = "Default", rate = 1.0, pitch = 1.0, volume = 1.0 } = req.body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({ error: "Text is required for speech synthesis." });
    }

    if (text.length > 3000) {
      return res.status(400).json({ error: "Text exceeds maximum payload limit of 3,000 characters." });
    }

    const quota = getQuotaStatus(identifier, role);

    // Enforce rate limit for non-admins
    if (!quota.isUnlimited && quota.remaining <= 0) {
      return res.status(429).json({
        error: "Rate limit reached. Non-admin accounts are restricted to 10 synthesis requests per hour.",
        quota,
        upgradeMessage: "Contact system administrators or authenticate with an Admin account for unlimited synthesis."
      });
    }

    // Increment usage for non-admins
    if (!quota.isUnlimited) {
      const entry = quotaStore.get(identifier);
      if (entry) {
        entry.count += 1;
      }
    }

    const updatedQuota = getQuotaStatus(identifier, role);

    // Compute estimated duration and word telemetry
    const words = text.trim().split(/\s+/).length;
    const estimatedDurationSec = Number((words / (2.5 * Number(rate || 1))).toFixed(1));

    return res.json({
      success: true,
      text,
      lang,
      voiceName,
      parameters: { rate, pitch, volume },
      telemetry: {
        characterCount: text.length,
        wordCount: words,
        estimatedDurationSec
      },
      quota: updatedQuota,
      synthesizedAt: new Date().toISOString()
    });
  });

  // GET /models - Returns supported open-source TTS model architectures
  router.get("/models", (_req: Request, res: Response) => {
    res.json({
      openSourceModels: [
        {
          name: "Chatterbox Multilingual V3",
          organization: "Resemble AI",
          license: "MIT",
          parameters: "0.5B",
          languages: ["English", "Hindi", "23+ Multilingual"],
          keyFeature: "Zero-shot cross-lingual voice cloning with seamless Hindi-English code switching."
        },
        {
          name: "svara-TTS",
          organization: "Open Academic Research",
          license: "Apache 2.0",
          parameters: "300M",
          languages: ["Hindi", "English (India)", "19 Indian Languages"],
          keyFeature: "Optimized for natural Indian cadence, phonetic inflections, and emotional nuance."
        },
        {
          name: "XTTS-v2",
          organization: "Coqui Community",
          license: "Coqui Public Model License",
          parameters: "1.2B",
          languages: ["English", "Hindi", "17 Languages"],
          keyFeature: "Industry-standard voice cloning from 6-second reference audio."
        },
        {
          name: "AI4Bharat IndicTTS",
          organization: "IIT Madras",
          license: "MIT",
          parameters: "Specialized Indic",
          languages: ["Hindi", "22 Scheduled Indian Languages"],
          keyFeature: "Gold standard Indian government and linguistic benchmark dataset."
        }
      ]
    });
  });
}

