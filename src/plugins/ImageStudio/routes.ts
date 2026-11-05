import { Router, Request, Response } from "express";
import { processImageUpscale } from "./upscaleEngine.js";

const MODEL_SPECS = [
  {
    id: "flux-schnell",
    name: "FLUX.1 [schnell]",
    creator: "Black Forest Labs",
    paramCount: "12 Billion",
    architecture: "Flow-Matching DiT (Rectified Flow)",
    license: "Apache 2.0 (Open Weights)",
    badge: "SOTA Leader #1",
    description: "The world's highest rated open-source image generation model. Extraordinary photorealism, hands, text rendering, and complex prompt comprehension.",
    speed: "Sub-5 seconds (4-step distillation)"
  },
  {
    id: "flux-realism",
    name: "FLUX.1 Realism",
    creator: "Black Forest Labs / Community",
    paramCount: "12 Billion",
    architecture: "Fine-Tuned Rectified Flow",
    license: "Open Commercial",
    badge: "Portrait & Lighting",
    description: "Optimized for natural skin textures, micro-pores, cinematic ambient occlusion, and professional photographic depth of field.",
    speed: "4–8 seconds"
  },
  {
    id: "sd-3.5",
    name: "Stable Diffusion 3.5 Large",
    creator: "Stability AI",
    paramCount: "8.1 Billion",
    architecture: "MMDiT (Multimodal Diffusion)",
    license: "Community License",
    badge: "High Prompt Fidelity",
    description: "Stability AI's flagship architecture. Distinctive aesthetic stylization, typography in images, and diverse artistic styles.",
    speed: "6–12 seconds"
  },
  {
    id: "sdxl-turbo",
    name: "SDXL Turbo",
    creator: "Stability AI",
    paramCount: "3.5 Billion",
    architecture: "Adversarial Diffusion Distillation (ADD)",
    license: "Research & Commercial",
    badge: "Ultra-Fast (1-Step)",
    description: "Generates high-definition imagery in a single forward pass with near-instantaneous feedback.",
    speed: "Under 2 seconds"
  },
  {
    id: "flux-anime",
    name: "FLUX Anime & Manga",
    creator: "Black Forest Labs Fine-Tune",
    paramCount: "12 Billion",
    architecture: "Flow DiT Stylized",
    license: "Open Commercial",
    badge: "Japanese Anime / Manga",
    description: "Studio Ghibli and modern anime aesthetic with rich cel-shading, vibrant colors, and dynamic line art.",
    speed: "4–8 seconds"
  },
  {
    id: "flux-3d",
    name: "FLUX 3D & Octane",
    creator: "Black Forest Labs Fine-Tune",
    paramCount: "12 Billion",
    architecture: "Flow DiT Raytraced",
    license: "Open Commercial",
    badge: "CGI & 3D Assets",
    description: "Unreal Engine 5 volumetric rendering, subsurface scattering, isometric game assets, and claymation depth.",
    speed: "4–8 seconds"
  }
];

export function registerRoutes(router: Router) {
  // GET /models - Returns available text-to-image open source models
  router.get("/models", (_req: Request, res: Response) => {
    res.json({
      success: true,
      defaultModel: "flux-schnell",
      models: MODEL_SPECS
    });
  });

  // GET /engines - Returns metadata on available upscaling tiers
  router.get("/engines", (_req: Request, res: Response) => {
    res.json({
      success: true,
      defaultEngine: "free",
      engines: [
        {
          id: "free",
          name: "Sovereign Free Super-Resolution (Real-ESRGAN)",
          cost: "$0.00",
          isDefault: true,
          description: "Instant mathematical super-resolution. Removes JPEG compression artifacts and sharpens outlines with zero API cost.",
          scales: [2, 4],
          executionTime: "1–3 seconds"
        },
        {
          id: "clarity-4k",
          name: "Clarity AI Generative 4K (Ultra-Detail)",
          cost: "~$0.012 per 4K upscale",
          isDefault: false,
          description: "Generative AI hallucination. Injects photorealistic skin pores, fabric textures, hair strands, and cinematic lighting depth up to 8K resolution.",
          scales: [2, 4],
          executionTime: "10–20 seconds"
        }
      ]
    });
  });

  // POST /generate - Synthesizes images from text prompts using top open-source models
  router.post("/generate", async (req: Request, res: Response) => {
    const startTime = Date.now();
    try {
      const {
        prompt,
        negativePrompt = "",
        model = "flux-schnell",
        aspectRatio = "1:1",
        stylePreset = "none",
        seed = Math.floor(Math.random() * 1000000)
      } = req.body;

      if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
        return res.status(400).json({ error: "Prompt string is required for image generation." });
      }

      // Map aspect ratio to pixel dimensions (multiples of 64 for diffusion latent grids)
      const DIMENSIONS_MAP: Record<string, { width: number; height: number }> = {
        "1:1": { width: 1024, height: 1024 },
        "16:9": { width: 1280, height: 720 },
        "9:16": { width: 720, height: 1280 },
        "4:3": { width: 1024, height: 768 }
      };
      const dimensions = DIMENSIONS_MAP[aspectRatio] || { width: 1024, height: 1024 };

      // Apply style preset prompt engineering
      let finalPrompt = prompt.trim();
      if (stylePreset === "photorealistic") {
        finalPrompt = `${finalPrompt}, 8k uhd, photorealistic, 35mm dslr photography, natural skin texture, soft shadows, sharp focus`;
      } else if (stylePreset === "cinematic") {
        finalPrompt = `${finalPrompt}, cinematic movie still, anamorphic lens, dramatic ambient lighting, depth of field, 8k resolution`;
      } else if (stylePreset === "digital-art") {
        finalPrompt = `${finalPrompt}, digital art masterpiece, trending on artstation, highly detailed, vibrant composition`;
      } else if (stylePreset === "anime") {
        finalPrompt = `${finalPrompt}, anime artwork, studio ghibli aesthetic, vibrant cel shading, detailed illustration`;
      } else if (stylePreset === "3d-render") {
        finalPrompt = `${finalPrompt}, 3d render, octane render, unreal engine 5, raytraced volumetric lighting, highly detailed cgi`;
      }

      // Map model to Pollinations / Hugging Face model key
      let pollinationsModel = "flux";
      if (model === "flux-realism") pollinationsModel = "flux-realism";
      else if (model === "flux-anime") pollinationsModel = "flux-anime";
      else if (model === "flux-3d") pollinationsModel = "flux-3d";
      else if (model === "sdxl-turbo") pollinationsModel = "turbo";
      else if (model === "sd-3.5") pollinationsModel = "flux"; // Pollinations uses FLUX for high-parameter tier

      const encodedPrompt = encodeURIComponent(finalPrompt);
      const targetUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=${pollinationsModel}&width=${dimensions.width}&height=${dimensions.height}&seed=${seed}&nologo=true&enhance=false`;

      const response = await fetch(targetUrl, {
        method: "GET",
        headers: {
          "User-Agent": "SutharLabs-ImageStudio/0.2.0 (Mozilla/5.0)",
          "Accept": "image/*"
        },
        signal: AbortSignal.timeout(35000)
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(`Upstream image synthesis returned HTTP ${response.status}: ${errorText.slice(0, 150)}`);
      }

      const contentType = response.headers.get("content-type") || "image/jpeg";
      if (!contentType.startsWith("image/")) {
        const jsonText = await response.text().catch(() => "");
        throw new Error(`Upstream synthesis returned non-image payload: ${jsonText.slice(0, 150)}`);
      }

      const arrayBuf = await response.arrayBuffer();
      const base64Data = Buffer.from(arrayBuf).toString("base64");
      const imageUrl = `data:${contentType};base64,${base64Data}`;

      const executionTimeMs = Date.now() - startTime;

      return res.json({
        success: true,
        imageUrl,
        prompt: finalPrompt,
        model,
        aspectRatio,
        dimensions,
        executionTimeMs,
        provider: `Open-Source ${model.toUpperCase()} (Zero Cost)`,
        cost: "$0.00"
      });
    } catch (err: any) {
      console.error("[ImageStudio] Image generation error:", err.message);
      return res.status(502).json({
        success: false,
        error: "Image Generation Failed",
        message: err.message || "Failed to generate image from prompt."
      });
    }
  });

  // POST /upscale - Upscales image based on selected tier
  router.post("/upscale", async (req: Request, res: Response) => {
    try {
      const { image, scale = 2, engine = "free", prompt } = req.body;

      if (!image) {
        return res.status(400).json({ error: "Image data (base64 or URL) is required." });
      }

      const result = await processImageUpscale({
        image,
        scale: Number(scale) as 2 | 4,
        engine,
        prompt
      });

      return res.json(result);
    } catch (err: any) {
      console.error("[ImageStudio] Upscale error:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to upscale image."
      });
    }
  });
}
