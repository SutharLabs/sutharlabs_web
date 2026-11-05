# Open-Source Diffusion Models & Synthesis Pipelines

## Executive Summary
This document provides specifications for the open-source text-to-image foundation models supported in **Image Studio v0.2.0** (`src/plugins/ImageStudio/`).

---

## 1. Supported Open-Source Foundation Models

| Model Name | Parameter Count | Creator / Architecture | License | Distinguishing Strengths |
|---|---|---|---|---|
| **FLUX.1 [schnell]** | **12.0 Billion** | Black Forest Labs / Flow-Matching DiT | Apache 2.0 (Open Weights) | Global SOTA #1 open-source image model. Unrivaled anatomical precision (hands, fingers), photorealistic textures, complex spatial composition, and accurate legible text rendering. 4-step distilled rectified flow. |
| **FLUX.1 Realism** | **12.0 Billion** | Black Forest Labs Fine-Tune | Open Commercial | Fine-tuned for portraiture, natural skin pores, realistic depth-of-field, lens aberrations, and cinematic ambient occlusion. |
| **Stable Diffusion 3.5 Large** | **8.1 Billion** | Stability AI / MMDiT (Multimodal DiT) | Stability Community License | Stability AI's flagship architecture. Distinctive artistic styling, typography within imagery, and diverse rendering aesthetics. |
| **SDXL Turbo** | **3.5 Billion** | Stability AI / ADD (Adversarial Distillation) | Research & Commercial | Near-instantaneous single-step generation (<2 seconds). Ideal for rapid prompt prototyping and rough sketches. |
| **FLUX Anime & Manga** | **12.0 Billion** | Stylized DiT Fine-Tune | Open Commercial | Studio Ghibli and modern Japanese anime aesthetics with cel shading, crisp line art, and vibrant color palettes. |
| **FLUX 3D & Octane** | **12.0 Billion** | Raytraced DiT Fine-Tune | Open Commercial | Unreal Engine 5 volumetric lighting, subsurface scattering, isometric game assets, and CGI render depth. |

---

## 2. Aspect Ratio Latent Dimensions

Diffusion latent grids operate on $8\times$ or $16\times$ downsampled spatial patches. Dimensions must be exact multiples of 64 to avoid convolution boundary artifacts:

| Aspect Ratio | Dimensions (Width × Height) | Pixel Count | Primary Use Case |
|---|---|---|---|
| **1:1 (Square)** | $1024 \times 1024$ | 1.05 MP | Social media avatars, album covers, icon assets, Instagram posts. |
| **16:9 (Landscape)** | $1280 \times 720$ | 0.92 MP | Cinematic desktop wallpapers, YouTube thumbnails, web banners. |
| **9:16 (Portrait / Story)** | $720 \times 1280$ | 0.92 MP | Mobile wallpapers, Instagram Stories, TikTok / Reels backgrounds. |
| **4:3 (Classic Photo)** | $1024 \times 768$ | 0.79 MP | Traditional photography composition, print layouts, tablets. |

---

## 3. Style Preset Prompt Injection

When a style preset is selected in the UI, the engine automatically injects curated photographic prompt tokens:

```typescript
if (stylePreset === "photorealistic") {
  finalPrompt = `${prompt}, 8k uhd, photorealistic, 35mm dslr photography, natural skin texture, soft shadows, sharp focus`;
} else if (stylePreset === "cinematic") {
  finalPrompt = `${prompt}, cinematic movie still, anamorphic lens, dramatic ambient lighting, depth of field, 8k resolution`;
} else if (stylePreset === "digital-art") {
  finalPrompt = `${prompt}, digital art masterpiece, trending on artstation, highly detailed, vibrant composition`;
} else if (stylePreset === "anime") {
  finalPrompt = `${prompt}, anime artwork, studio ghibli aesthetic, vibrant cel shading, detailed illustration`;
} else if (stylePreset === "3d-render") {
  finalPrompt = `${prompt}, 3d render, octane render, unreal engine 5, raytraced volumetric lighting, highly detailed cgi`;
}
```

---

## 4. REST API Endpoint Specification

### `POST /api/plugins/image-studio/generate`
- **Request Body**:
  ```json
  {
    "prompt": "A majestic snow leopard resting on Himalayan peaks at twilight",
    "negativePrompt": "blurry, low quality, deformed hands",
    "model": "flux-schnell",
    "aspectRatio": "16:9",
    "stylePreset": "cinematic",
    "seed": 482910,
    "hfToken": "hf_xxxxxxxxxxxxxxxxxxxx (Optional)",
    "pollenKey": "pollen_xxxx (Optional)"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "imageUrl": "data:image/jpeg;base64,...",
    "prompt": "A majestic snow leopard...",
    "model": "flux-schnell",
    "aspectRatio": "16:9",
    "dimensions": { "width": 1280, "height": 720 },
    "executionTimeMs": 3480,
    "provider": "Hugging Face H100 Cloud (black-forest-labs/FLUX.1-schnell) [Zero Watermark]",
    "cost": "$0.00"
  }
  ```
