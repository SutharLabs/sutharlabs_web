# Sovereign LLM & Agentic Inference Architecture

Welcome to the **SutharLabs Sovereign LLM & AI Inference** documentation.

---

## Directory Contents

| Document | Description |
|---|---|
| **[Frontier SSE Router & Resilient Streaming](file:///d:/Code/SutharLabs/website/docs/llm/frontier_sse_router_and_resilient_streaming.md)** | Architectural design of the Decoupled SSE Router, dual-transport stream resumption (`GET /stream/:id?offset=X`) defeating Vercel 60s timeouts, in-memory session ring buffer on VM 3, instant `<5ms` handshakes, and explicit server-side abort engine. |
| **[Google Gemma 4 E2B & E4B Architecture](file:///d:/Code/SutharLabs/website/docs/llm/gemma_4_e2b_e4b_architecture_and_benchmarks.md)** | Technical breakdown of Google DeepMind's Gemma 4 Edge models (Effective 2B & 4B parameters), Per-Layer Embeddings (PLE), native multimodal vision/audio encoders, 128K context window, and Oracle VM 2 deployment benchmarks. |
| **[EdgeRock-4B & llama.cpp Feasibility](file:///d:/Code/SutharLabs/website/docs/llm/edgerock_4b_llama_cpp_feasibility_and_architecture.md)** | Deep architectural analysis of EdgeRock-4B (Rock Matrix/HKUST/CMU), 546 GGUF tensor anatomy, Gated DeltaNet + RMA kernels, and step-by-step roadmap for updating `llama.cpp`. |
| **[Inference Node Setup & Benchmarks](file:///d:/Code/SutharLabs/website/docs/llm/inference_node_setup_and_benchmarks.md)** | Oracle Cloud VM 2 Ollama configuration, 6 active models, 8192 context window, token throughput benchmarks on 2-vCPU ARM. |
| **[OpenCode & Agent Prompt Tuning](file:///d:/Code/SutharLabs/website/docs/llm/opencode_and_prompt_tuning.md)** | System prompt sizing (reduced from 6.4K to 48 tokens), 8K context optimization, and sub-second agent response latency. |
| **[Speculative Decoding & Speedups](file:///d:/Code/SutharLabs/website/docs/llm/speculative_decoding_and_speedups.md)** | Research on Jev-style speculative decoding, draft model pairing, EAGLE-2, Medusa, and grammar-constrained JSON decoding on CPU. |

---

## Host Architecture
- **Inference Node**: Oracle Cloud VM 2 (`132.226.190.125`)
- **Ollama Gateway**: Port `11434`
- **OpenCode Agent Server**: Port `4096` (PM2 `opencode-server`)

