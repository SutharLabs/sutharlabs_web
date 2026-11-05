import { Router, Request, Response } from "express";
import { processImageUpscale } from "./upscaleEngine.js";

export function registerRoutes(router: Router) {
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

