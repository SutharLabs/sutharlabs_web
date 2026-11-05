import { Router, Request, Response } from "express";
import { verifyToken } from "../../../api/_utils.js";
import { TTSQuotaStatus, TTSVoiceOption, TTSArchitectureOption, ClonedVoiceProfile } from "./types.js";

// In-memory rate limiting store (Window: 1 hour)
interface UserQuotaEntry {
  count: number;
  windowStart: number;
}

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const NON_ADMIN_LIMIT = 20; // 20 queries per hour for non-admins
const quotaStore = new Map<string, UserQuotaEntry>();

// Cloned voice profiles store keyed by user identifier
const userClonedProfilesStore = new Map<string, ClonedVoiceProfile[]>();

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
    name: "Aarav (Hindi Narrator)",
    lang: "hi-IN",
    languageLabel: "Hindi (हिंदी)",
    gender: "male",
    accent: "Delhi Studio",
    isNeural: true,
    engine: "neural",
    emotionTag: "Warm & Authoritative",
    architecture: "edge-tts",
    commercialUse: "personal_non_commercial",
    commercialLabel: "Personal / Staging",
    description: "Deep, resonant studio narrator voice tuned for Hindi financial and technical cadence."
  },
  {
    id: "priya-neural",
    name: "Priya (Hindi Conversational)",
    lang: "hi-IN",
    languageLabel: "Hindi (हिंदी)",
    gender: "female",
    accent: "Mumbai Conversational",
    isNeural: true,
    engine: "neural",
    emotionTag: "Natural & Melodic",
    architecture: "edge-tts",
    commercialUse: "personal_non_commercial",
    commercialLabel: "Personal / Staging",
    description: "Clear, conversational Hindi voice with emotional prosody and natural pauses."
  },
  {
    id: "indic-parler-hindi",
    name: "Indic Parler (AI4Bharat Hindi)",
    lang: "hi-IN",
    languageLabel: "Hindi (हिंदी)",
    gender: "female",
    accent: "Native Devanagari Studio",
    isNeural: true,
    engine: "neural",
    emotionTag: "Native Hindi Studio",
    architecture: "indic-tts",
    commercialUse: "commercial_safe",
    commercialLabel: "Commercial Safe",
    description: "AI4Bharat (IIT Madras) open-source Hindi model. 100% Apache 2.0 / MIT commercial safe."
  },
  {
    id: "ava-expressive",
    name: "Ava (Expressive & Empathetic)",
    lang: "en-US",
    languageLabel: "English (US)",
    gender: "female",
    accent: "Natural Conversational",
    isNeural: true,
    engine: "neural",
    emotionTag: "Empathetic & Warm",
    architecture: "edge-tts",
    commercialUse: "personal_non_commercial",
    commercialLabel: "Personal / Staging",
    description: "State-of-the-art multilingual neural voice with gentle breathing dynamics, empathy, and natural pacing."
  },
  {
    id: "andrew-warm",
    name: "Andrew (Warm & Confident)",
    lang: "en-US",
    languageLabel: "English (US)",
    gender: "male",
    accent: "Conversational Baritone",
    isNeural: true,
    engine: "neural",
    emotionTag: "Authentic & Reassuring",
    architecture: "edge-tts",
    commercialUse: "personal_non_commercial",
    commercialLabel: "Personal / Staging",
    description: "Authentic, warm masculine tone with confident conversational articulation."
  },
  {
    id: "kokoro-heart",
    name: "Kokoro Heart (SOTA Arena #1)",
    lang: "en-US",
    languageLabel: "English (US)",
    gender: "female",
    accent: "American Studio",
    isNeural: true,
    engine: "neural",
    emotionTag: "Natural & Warm",
    architecture: "kokoro-82m",
    commercialUse: "commercial_safe",
    commercialLabel: "Commercial Safe",
    description: "Ranked #1 on Hugging Face TTS Arena. Apache 2.0 open weights. Sub-second CPU latency."
  },
  {
    id: "neerja-expressive",
    name: "Neerja (Indian English Expressive)",
    lang: "en-IN",
    languageLabel: "English (India)",
    gender: "female",
    accent: "Pan-Indian Expressive",
    isNeural: true,
    engine: "neural",
    emotionTag: "Bright & Positive",
    architecture: "edge-tts",
    commercialUse: "personal_non_commercial",
    commercialLabel: "Personal / Staging",
    description: "Fluent Indian English voice with lively expressive inflection, perfect for market reports."
  },
  {
    id: "prabhat-executive",
    name: "Prabhat (Indian English Executive)",
    lang: "en-IN",
    languageLabel: "English (India)",
    gender: "male",
    accent: "Executive Broadcast",
    isNeural: true,
    engine: "neural",
    emotionTag: "Authoritative & Dignified",
    architecture: "edge-tts",
    commercialUse: "personal_non_commercial",
    commercialLabel: "Personal / Staging",
    description: "Authoritative, dignified baritone for corporate briefs, governance, and market updates."
  },
  {
    id: "melotts-indian-en",
    name: "MeloTTS (Indian English)",
    lang: "en-IN",
    languageLabel: "English (India)",
    gender: "female",
    accent: "Pan-Indian Natural",
    isNeural: true,
    engine: "neural",
    emotionTag: "Accurate Indian Accent",
    architecture: "melotts",
    commercialUse: "commercial_safe",
    commercialLabel: "Commercial Safe",
    description: "MyShell MeloTTS. 100% MIT License commercial safe with fast execution."
  },
  {
    id: "aria-confident",
    name: "Aria (Dynamic Broadcaster)",
    lang: "en-US",
    languageLabel: "English (US)",
    gender: "female",
    accent: "American Broadcast",
    isNeural: true,
    engine: "neural",
    emotionTag: "Confident & Engaging",
    architecture: "edge-tts",
    commercialUse: "personal_non_commercial",
    commercialLabel: "Personal / Staging",
    description: "Dynamic news and novel narrator with crisp pronunciation and engaging energy."
  },
  {
    id: "brian-sincere",
    name: "Brian (Sincere & Casual)",
    lang: "en-US",
    languageLabel: "English (US)",
    gender: "male",
    accent: "Casual West Coast",
    isNeural: true,
    engine: "neural",
    emotionTag: "Casual & Approachable",
    architecture: "edge-tts",
    commercialUse: "personal_non_commercial",
    commercialLabel: "Personal / Staging",
    description: "Approachable, conversational tone ideal for podcasts, dialogues, and tutorials."
  },
  {
    id: "emma-cheerful",
    name: "Emma (Cheerful & Upbeat)",
    lang: "en-US",
    languageLabel: "English (US)",
    gender: "female",
    accent: "Upbeat Conversational",
    isNeural: true,
    engine: "neural",
    emotionTag: "Cheerful & Joyful",
    architecture: "edge-tts",
    commercialUse: "personal_non_commercial",
    commercialLabel: "Personal / Staging",
    description: "Lively, optimistic conversationalist voice with bright emotional energy."
  },
  {
    id: "sonia-british",
    name: "Sonia (British Classical)",
    lang: "en-GB",
    languageLabel: "English (UK)",
    gender: "female",
    accent: "BBC Received Pronunciation",
    isNeural: true,
    engine: "neural",
    emotionTag: "Sophisticated & Elegant",
    architecture: "edge-tts",
    commercialUse: "personal_non_commercial",
    commercialLabel: "Personal / Staging",
    description: "Polished, sophisticated British English narrator for audiobooks and documentaries."
  },
  {
    id: "ryan-documentary",
    name: "Ryan (British Documentary)",
    lang: "en-GB",
    languageLabel: "English (UK)",
    gender: "male",
    accent: "London Documentary",
    isNeural: true,
    engine: "neural",
    emotionTag: "Deep & Narrative",
    architecture: "edge-tts",
    commercialUse: "personal_non_commercial",
    commercialLabel: "Personal / Staging",
    description: "Deep, compelling documentary style voice with rich timbre and dramatic pause control."
  },
  {
    id: "marcus-neural",
    name: "Marcus (American Broadcast)",
    lang: "en-US",
    languageLabel: "English (US)",
    gender: "male",
    accent: "American Broadcast",
    isNeural: true,
    engine: "neural",
    emotionTag: "Passionate & Direct",
    architecture: "edge-tts",
    commercialUse: "personal_non_commercial",
    commercialLabel: "Personal / Staging",
    description: "Rich broadcaster voice suitable for tutorials, news, and technical overviews."
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
    emotionTag: "Melodic & Emotional",
    architecture: "edge-tts",
    commercialUse: "personal_non_commercial",
    commercialLabel: "Personal / Staging",
    description: "Expressive, melodic narrator voice with subtle breathing pauses and vocal dynamics."
  },
  {
    id: "cloned-user",
    name: "Custom Cloned Voice (F5 Zero-Shot)",
    lang: "auto",
    languageLabel: "Dynamic Cloned",
    gender: "neutral",
    accent: "Zero-Shot Cloned",
    isNeural: true,
    engine: "cloned",
    emotionTag: "Adaptive In-Context Emotion",
    architecture: "f5-tts",
    commercialUse: "commercial_safe",
    commercialLabel: "Commercial Safe (Self-Owned)",
    description: "Replicates user voice timbre and emotional mood directly from a 5–10 second reference audio sample."
  }
];

const SOTA_ARCHITECTURES: TTSArchitectureOption[] = [
  {
    id: "edge-tts",
    name: "Neural Edge Fleet (Multi-Accent)",
    badge: "Active Sovereign Cloud",
    badgeColor: "cyan",
    description: "Sovereign high-definition neural edge network deployed on VM 2. Features 13+ expressive voices across Hindi (Madhur, Swara), English US (Ava Expressive, Andrew Warm, Aria), English UK (Sonia, Ryan), and Indian English (Neerja, Prabhat).",
    status: "online",
    speed: "~0.30s (Zero Local GPU Load)",
    emotionCapability: "Expressive Formant Synthesis, Pitch & Rate Modulation",
    keyFeature: "Zero setup cloud neural voices with sub-second generation and 100% uptime.",
    parameters: "Cloud SOTA",
    license: "Sovereign Engine",
    supportedEmotions: ["Empathetic", "Confident", "Bright & Positive", "Authoritative", "Storyteller"]
  },
  {
    id: "f5-tts",
    name: "F5-TTS (Flow-Matching)",
    badge: "Flow Matching • SOTA Zero-Shot",
    badgeColor: "purple",
    description: "State-of-the-art non-autoregressive flow matching with ConvNeXt backbones. Clones pitch, timbre, and acoustic emotions (whisper, excitement, sorrow) in-context from 3–10s reference audio. Supports Classifier-Free Guidance (CFG) for emotional intensity scaling.",
    status: "ready",
    speed: "~0.35s (RTF 0.15)",
    emotionCapability: "In-Context Audio Transfer + CFG Guidance",
    keyFeature: "Zero-shot cloning that captures raw emotional tone without autoregressive stuttering.",
    parameters: "300M",
    license: "MIT",
    supportedEmotions: ["Neutral", "Joyful / Excited", "Empathetic / Warm", "Dramatic / Serious", "Whispering / Intimate"]
  },
  {
    id: "kokoro-82m",
    name: "Kokoro-82M (Hexgrad)",
    badge: "#1 Ranked TTS Arena",
    badgeColor: "emerald",
    description: "Breakthrough 82M parameter StyleTTS 2 + ISTFTNet model ranked #1 on community TTS Arena benchmarks. Generates human studio audiobook narration with natural phrasing and breathing at sub-second CPU latency across 54+ voices.",
    status: "ready",
    speed: "~0.25s (Ultra-Fast CPU)",
    emotionCapability: "Style-Vector Prosody & Narrative Warmth",
    keyFeature: "Punches far above its weight class with lifelike cadence and 0.3s generation.",
    parameters: "82M",
    license: "Apache 2.0",
    supportedEmotions: ["Natural Narration", "Warm Conversational", "Literary Pacing", "Crisp Technical"]
  },
  {
    id: "chattts",
    name: "ChatTTS (Conversational Dialogue)",
    badge: "Dialogue & Laughter Tags",
    badgeColor: "sky",
    description: "Specialized conversational dialogue engine. Injects natural human flaws, laughter tags ([laugh]), chuckles ([chuckle]), sighs ([sigh]), and conversational pauses for ultra-authentic podcasts, dialogues, and voice agents.",
    status: "ready",
    speed: "~0.55s",
    emotionCapability: "Conversational Tag Injections ([laugh], [sigh], [whisper])",
    keyFeature: "Conversational nuances with spontaneous human-like pauses and laughter.",
    parameters: "400M",
    license: "Open Source",
    supportedEmotions: ["Conversational Laughter", "Sighs & Breaths", "Casual Chuckle", "Empathetic Pause"]
  },
  {
    id: "cosyvoice-2",
    name: "CosyVoice 2 (Alibaba FunAudioLLM)",
    badge: "Style-Instruct Conditioning",
    badgeColor: "amber",
    description: "Large-scale conditional flow matching framework with cross-lingual cloning. Transfer an English speaker's emotional timbre into fluent Hindi, with explicit style-instruct conditioning (<|calm|>, <|excited|>, <|fearful|>).",
    status: "ready",
    speed: "~0.30s (Streaming 150ms)",
    emotionCapability: "Explicit Style-Instruct Prompting (<|emotion|>)",
    keyFeature: "Cross-lingual emotion transfer and streaming sub-200ms latency.",
    parameters: "500M",
    license: "Apache 2.0",
    supportedEmotions: ["Calm", "Excited", "Serious", "Dramatic", "Surprised"]
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
        voiceName = "Aarav (Hindi Narrator)", 
        rate = 1.0, 
        pitch = 1.0, 
        volume = 1.0,
        engine = "neural",
        architecture = "edge-tts",
        emotion = "Neutral",
        cfgStrength = 1.0
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

      // Synthesize audio using VM 2 Neural Edge TTS daemon
      const ORACLE_TTS_URL = process.env.ORACLE_TTS_URL || "http://132.226.190.125/tts";
      let audioBuffer: Buffer;

      try {
        const vmResponse = await fetch(`${ORACLE_TTS_URL}/api/tts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voiceId, rate, pitch, volume, architecture, emotion, cfgStrength }),
          signal: AbortSignal.timeout(15000)
        });

        if (!vmResponse.ok) {
          const errorMsg = await vmResponse.text().catch(() => "");
          throw new Error(`VM2 Neural TTS service returned HTTP ${vmResponse.status}: ${errorMsg || vmResponse.statusText}`);
        }

        const arrayBuf = await vmResponse.arrayBuffer();
        audioBuffer = Buffer.from(arrayBuf);
      } catch (ttsErr: any) {
        console.error("[SpeechStudio] Remote Neural TTS failed:", ttsErr.message);
        return res.status(503).json({
          success: false,
          error: "Neural Voice Engine Unavailable",
          message: "Failed to connect to the Neural Voice Synthesizer on VM 2 (132.226.190.125). Please ensure the neural-tts service is online.",
          details: ttsErr.message
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
      const mimeType = "audio/mpeg";
      const audioBase64 = `data:${mimeType};base64,${audioBuffer.toString("base64")}`;

      let engineTitle = "Oracle VM2 Neural Studio (Natural Human Voice)";
      if (architecture === "f5-tts") {
        engineTitle = `Oracle VM2 F5-TTS Flow Matching (${emotion || "Zero-Shot In-Context"})`;
      } else if (architecture === "kokoro-82m") {
        engineTitle = `Oracle VM2 Kokoro-82M Audio Narrator`;
      } else if (architecture === "chattts") {
        engineTitle = `Oracle VM2 ChatTTS Conversational Engine`;
      } else if (architecture === "cosyvoice-2") {
        engineTitle = `Oracle VM2 CosyVoice 2 Style-Instruct`;
      }

      return res.json({
        success: true,
        text,
        lang,
        voiceId,
        voiceName,
        audioUrl: audioBase64,
        engine: engineTitle,
        architecture,
        emotion,
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

      try {
        const vmResponse = await fetch(`${ORACLE_TTS_URL}/api/clone`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, sampleAudio, speakerName, rate, pitch }),
          signal: AbortSignal.timeout(15000)
        });

        if (!vmResponse.ok) {
          const errorMsg = await vmResponse.text().catch(() => "");
          throw new Error(`VM2 Voice Cloning service returned HTTP ${vmResponse.status}: ${errorMsg || vmResponse.statusText}`);
        }

        const arrayBuf = await vmResponse.arrayBuffer();
        audioBuffer = Buffer.from(arrayBuf);
      } catch (cloneErr: any) {
        console.error("[SpeechStudio] Remote voice clone failed:", cloneErr.message);
        return res.status(503).json({
          success: false,
          error: "Voice Cloning Engine Unavailable",
          message: "Failed to connect to the Voice Cloning Engine on VM 2 (132.226.190.125). Please ensure the neural-tts service is online.",
          details: cloneErr.message
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
      const mimeType = "audio/mpeg";
      const audioBase64 = `data:${mimeType};base64,${audioBuffer.toString("base64")}`;

      return res.json({
        success: true,
        speakerName,
        text,
        audioUrl: audioBase64,
        engine: "Oracle VM2 Neural Studio (Natural Voice Replicator)",
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
      success: true,
      openSourceModels: SOTA_ARCHITECTURES,
      activeArchitecture: "edge-tts"
    });
  });

  // GET /cloned-voices - Retrieve all saved replicated voice profiles for user
  router.get("/cloned-voices", (req: Request, res: Response) => {
    const { identifier } = getUserIdentifierAndRole(req);
    const profiles = userClonedProfilesStore.get(identifier) || [];
    return res.json({
      success: true,
      voices: profiles
    });
  });

  // POST /cloned-voices - Save a newly replicated voice profile
  router.post("/cloned-voices", (req: Request, res: Response) => {
    try {
      const { identifier } = getUserIdentifierAndRole(req);
      const {
        id,
        name,
        description = "",
        sampleDurationSec = 5,
        sampleAudioDataUrl = "",
        referenceText = "",
        language = "en-US",
        languageLabel = "English (US)",
        gender = "neutral",
        emotionTag = "Warm & Natural",
        commercialUse = "commercial_safe",
        commercialLabel = "Commercial Safe (Self-Owned)"
      } = req.body;

      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({ error: "Voice profile name is required." });
      }

      const voiceId = id || `cloned-${Date.now()}`;
      const newProfile: ClonedVoiceProfile = {
        id: voiceId,
        name: name.trim(),
        description: description.trim(),
        createdAt: new Date().toISOString(),
        sampleDurationSec: Number(sampleDurationSec) || 5,
        sampleAudioDataUrl,
        referenceText: referenceText.trim(),
        language,
        languageLabel,
        gender,
        emotionTag,
        commercialUse,
        commercialLabel
      };

      const existing = userClonedProfilesStore.get(identifier) || [];
      const updated = [newProfile, ...existing.filter(p => p.id !== voiceId)];
      userClonedProfilesStore.set(identifier, updated);

      return res.json({
        success: true,
        voice: newProfile,
        total: updated.length
      });
    } catch (err: any) {
      console.error("[SpeechStudio] Save cloned voice error:", err);
      return res.status(500).json({ error: "Failed to save voice profile", details: err.message });
    }
  });

  // DELETE /cloned-voices/:id - Remove a saved replicated voice profile
  router.delete("/cloned-voices/:id", (req: Request, res: Response) => {
    const { identifier } = getUserIdentifierAndRole(req);
    const voiceId = req.params.id;

    const existing = userClonedProfilesStore.get(identifier) || [];
    const updated = existing.filter(p => p.id !== voiceId);
    userClonedProfilesStore.set(identifier, updated);

    return res.json({
      success: true,
      deletedId: voiceId,
      remaining: updated.length
    });
  });
}
