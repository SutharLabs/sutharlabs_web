# Image Studio & 4K Super-Resolution Documentation

Welcome to the **SutharLabs Image Studio** architecture and operations documentation.

---

## Directory Contents

| Document | Description |
|---|---|
| **[Inference Limits & GPU Sizing Guide](file:///d:/Code/SutharLabs/website/docs/image-studio/inference_limits_and_gpu_sizing.md)** | Hardware sizing breakdown: Why 12B diffusion cannot run on 2-vCPU ARM, Pollinations 45s rate limit explanation, and the Hugging Face zero-watermark solution. |
| **[Diffusion Models & Pipelines](file:///d:/Code/SutharLabs/website/docs/image-studio/diffusion_models_and_pipelines.md)** | Specifications for FLUX.1 [schnell] (12B DiT), SD 3.5 Large (8.1B MMDiT), SDXL Turbo, aspect ratios, and style presets. |
| **[Super-Resolution & Clarity 4K](file:///d:/Code/SutharLabs/website/docs/image-studio/super_resolution_and_clarity.md)** | Comparison of Sovereign Free Real-ESRGAN super-resolution vs Clarity Generative 4K (Fal.ai). |

---

## Quick Architecture Map
```
src/plugins/ImageStudio/
├── index.ts                     (Plugin entrypoint)
├── manifest.json / manifest.ts  (Plugin catalog metadata v0.2.0)
├── routes.ts                    (POST /generate, POST /upscale, GET /models, GET /engines)
├── types.ts                     (TypeScript models, engines, aspect ratio interfaces)
├── upscaleEngine.ts             (Dual-tier Real-ESRGAN / Fal.ai upscaling engine)
└── components/
    └── ImageStudioView.tsx      (Dual-tab React UI: Generator & 4K Upscaler with slider)
```

