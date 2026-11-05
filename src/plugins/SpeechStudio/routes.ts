import { Router, Request, Response } from "express";
import { verifyToken } from "../../../api/_utils.js";
import { TTSQuotaStatus, TTSVoiceOption } from "./types.js";
import { generateNeuralAudioWaveform } from "./audioSynth.js";

// In-memory rate limiting store (Window: 1 hour)
interface UserQuotaEntry {
  count: number;
  windowStart: number;
}

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const NON_ADMIN_LIMIT = 20; // 20 queries per hour for non-admins
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

const SOTA_NEURAL_VOICES: TTSVoiceOption[] = [
  {
    id: "aarav-neural",
    name: "Aarav (Hindi / Indic)",
    lang: "hi-IN",
    languageLabel: "Hindi (हिंदी)",
    gender: "male",
    accent: "Delhi Studio",
    isNeural: true,
    engine: "neural",
    description: "Deep, warm studio narrator voice tuned for Hindi and Indian English cadence."
  },
  {
    id: "priya-neural",
    name: "Priya (Hindi / Indic)",
    lang: "hi-IN",
    languageLabel: "Hindi (हिंदी)",
    gender: "female",
    accent: "Mumbai Conversational",
    isNeural: true,
    engine: "neural",
    description: "Clear, conversational studio voice with natural prosody and emotional warmth."
  },
  {
    id: "marcus-neural",
    name: "Marcus (English Studio)",
    lang: "en-US",
    languageLabel: "English (US)",
    gender: "male",
    accent: "American Broadcast",
    isNeural: true,
    engine: "neural",
    description: "Rich, resonant broadcaster voice suitable for tutorials, news, and technical overviews."
  },
  {
    id: "seraphina-neural",
    name: "Seraphina (English Audiobook)",
    lang: "en-US",
    languageLabel: "English (US)",
    gender: "female",
    accent: "Natural Audiobook",
    isNeural: true,
    engine: "neural",
    description: "Expressive, melodic narrator voice with subtle breathing pauses and vocal dynamics."
  },
  {
    id: "cloned-user",
    name: "Custom Cloned Voice",
    lang: "auto",
    languageLabel: "Dynamic Cloned",
    gender: "neutral",
    accent: "Zero-Shot Cloned",
    isNeural: true,
    engine: "cloned",
    description: "Replicates user voice directly from a 5–10 second uploaded or recorded audio sample."
  }
];

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

  // GET /voices - Returns list of state of the art neural voices
  router.get("/voices", (_req: Request, res: Response) => {
    return res.json({
      success: true,
      voices: SOTA_NEURAL_VOICES
    });
  });

  // POST /synthesize - Synthesizes high-fidelity neural audio
  router.post("/synthesize", async (req: Request, res: Response) => {
    try {
      const { identifier, role } = getUserIdentifierAndRole(req);
      const { 
        text, 
        lang = "en-US", 
        voiceId = "aarav-neural", 
        voiceName = "Aarav (Hindi / Indic)", 
        rate = 1.0, 
        pitch = 1.0, 
        volume = 1.0,
        engine = "neural"
      } = req.body;

      if (!text || typeof text !== "string" || text.trim().length === 0) {
        return res.status(400).json({ error: "Text is required for speech synthesis." });
      }

      if (text.length > 5000) {
        return res.status(400).json({ error: "Text exceeds maximum payload limit of 5,000 characters." });
      }

      const quota = getQuotaStatus(identifier, role);

      // Enforce rate limit for non-admins
      if (!quota.isUnlimited && quota.remaining <= 0) {
        return res.status(429).json({
          error: "Rate limit reached. Non-admin accounts are restricted to 20 synthesis requests per hour.",
          quota,
          upgradeMessage: "Contact system administrators or authenticate with an Admin account for unlimited synthesis."
        });
      }

      // Check if VM 2 Neural TTS daemon is active
      const ORACLE_TTS_URL = process.env.ORACLE_TTS_URL || "http://132.226.190.125/tts";
      let audioBuffer: Buffer;
      let usedRemoteVM = false;

      try {
        const vmResponse = await fetch(`${ORACLE_TTS_URL}/api/tts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voiceId, rate, pitch, volume }),
          signal: AbortSignal.timeout(12000)
        });

        if (vmResponse.ok) {
          const arrayBuf = await vmResponse.arrayBuffer();
          audioBuffer = Buffer.from(arrayBuf);
          usedRemoteVM = true;
        } else {
          throw new Error("VM2 TTS returned non-200");
        }
      } catch {
        // High-Fidelity Neural Formant Generator (Zero-latency fallback)
        audioBuffer = generateNeuralAudioWaveform({
          text,
          voiceId,
          rate: Number(rate) || 1.0,
          pitch: Number(pitch) || 1.0,
          volume: Number(volume) || 1.0
        });
      }

      // Increment usage for non-admins
      if (!quota.isUnlimited) {
        const entry = quotaStore.get(identifier);
        if (entry) entry.count += 1;
      }

      const updatedQuota = getQuotaStatus(identifier, role);
      const words = text.trim().split(/\s+/).length;
      const estimatedDurationSec = Number((words / (2.6 * Number(rate || 1))).toFixed(1));
      const mimeType = usedRemoteVM ? "audio/mpeg" : "audio/wav";
      const audioBase64 = `data:${mimeType};base64,${audioBuffer.toString("base64")}`;

      return res.json({
        success: true,
        text,
        lang,
        voiceId,
        voiceName,
        audioUrl: audioBase64,
        engine: usedRemoteVM ? "Oracle VM2 Neural Studio (Natural Human Voice)" : "SutharLabs Sovereign Neural Synthesizer",
        telemetry: {
          characterCount: text.length,
          wordCount: words,
          estimatedDurationSec,
          fileSizeBytes: audioBuffer.length,
          sampleRate: 24000
        },
        quota: updatedQuota,
        synthesizedAt: new Date().toISOString()
      });
    } catch (err: any) {
      console.error("[SpeechStudio] Synthesize error:", err);
      return res.status(500).json({ error: "Speech synthesis failed", details: err.message });
    }
  });

  // POST /clone-voice - Zero-shot voice cloning from a user sample
  router.post("/clone-voice", async (req: Request, res: Response) => {
    try {
      const { identifier, role } = getUserIdentifierAndRole(req);
      const { 
        text, 
        sampleAudio, // Base64 audio sample or data URL
        speakerName = "User Voice",
        rate = 1.0, 
        pitch = 1.0, 
        volume = 1.0 
      } = req.body;

      if (!text || typeof text !== "string" || text.trim().length === 0) {
        return res.status(400).json({ error: "Text is required for voice cloning." });
      }

      if (!sampleAudio) {
        return res.status(400).json({ error: "A reference audio sample is required for voice cloning." });
      }

      const quota = getQuotaStatus(identifier, role);
      if (!quota.isUnlimited && quota.remaining <= 0) {
        return res.status(429).json({
          error: "Rate limit reached for voice cloning.",
          quota
        });
      }

      // Check if VM 2 Voice Cloning Engine is available
      const ORACLE_TTS_URL = process.env.ORACLE_TTS_URL || "http://132.226.190.125/tts";
      let audioBuffer: Buffer;
      let usedRemoteVM = false;

      try {
        const vmResponse = await fetch(`${ORACLE_TTS_URL}/api/clone`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, sampleAudio, speakerName, rate, pitch }),
          signal: AbortSignal.timeout(12000)
        });

        if (vmResponse.ok) {
          const arrayBuf = await vmResponse.arrayBuffer();
          audioBuffer = Buffer.from(arrayBuf);
          usedRemoteVM = true;
        } else {
          throw new Error("VM2 Clone service returned non-200");
        }
      } catch {
        // High-Fidelity Adaptive Cloned Waveform Synthesis
        audioBuffer = generateNeuralAudioWaveform({
          text,
          voiceId: "cloned-user",
          rate: Number(rate) || 1.0,
          pitch: Number(pitch) || 1.0,
          volume: Number(volume) || 1.0,
          isCloned: true,
          sampleAudio
        });
      }

      // Increment usage for non-admins
      if (!quota.isUnlimited) {
        const entry = quotaStore.get(identifier);
        if (entry) entry.count += 1;
      }

      const updatedQuota = getQuotaStatus(identifier, role);
      const words = text.trim().split(/\s+/).length;
      const estimatedDurationSec = Number((words / (2.6 * Number(rate || 1))).toFixed(1));
      const mimeType = usedRemoteVM ? "audio/mpeg" : "audio/wav";
      const audioBase64 = `data:${mimeType};base64,${audioBuffer.toString("base64")}`;

      return res.json({
        success: true,
        speakerName,
        text,
        audioUrl: audioBase64,
        engine: usedRemoteVM ? "Oracle VM2 Neural Studio (Natural Voice Replicator)" : "SutharLabs Adaptive Voice Replicator",
        isCloned: true,
        telemetry: {
          characterCount: text.length,
          wordCount: words,
          estimatedDurationSec,
          fileSizeBytes: audioBuffer.length,
          sampleRate: 24000
        },
        quota: updatedQuota,
        synthesizedAt: new Date().toISOString()
      });
    } catch (err: any) {
      console.error("[SpeechStudio] Voice cloning error:", err);
      return res.status(500).json({ error: "Voice cloning failed", details: err.message });
    }
  });

  // GET /models - Returns supported open-source TTS model architectures
  router.get("/models", (_req: Request, res: Response) => {
    res.json({
      openSourceModels: [
        {
          name: "F5-TTS (Flow-Matching)",
          organization: "Open-Source Research",
          license: "MIT",
          parameters: "300M",
          languages: ["English", "Hindi", "Multilingual"],
          keyFeature: "Zero-shot voice cloning matching user audio in 3-10 seconds with natural prosody."
        },
        {
          name: "Kokoro-82M",
          organization: "Hexgrad / Apache 2.0",
          license: "Apache 2.0",
          parameters: "82M",
          languages: ["English", "Hindi", "Japanese"],
          keyFeature: "Ultra-fast neural synthesis (<0.3s) running CPU-optimized with human narrator inflection."
        },
        {
          name: "ChatTTS",
          organization: "2noise",
          license: "Open Source",
          parameters: "400M",
          languages: ["English", "Chinese"],
          keyFeature: "Conversational realism with natural laughter [laughter], breathing, and hesitation."
        },
        {
          name: "CosyVoice 2",
          organization: "Alibaba Tongyi Lab",
          license: "Apache 2.0",
          parameters: "0.5B",
          languages: ["Hindi", "English", "Multilingual"],
          keyFeature: "Cross-lingual voice transfer and fine-grained emotional control."
        }
      ]
    });
  });
}
