# Sovereign LLM & Agentic Inference Architecture

Welcome to the **SutharLabs Sovereign LLM & AI Inference** documentation.

---

## Directory Contents

| Document | Description |
|---|---|
| **[Inference Node Setup & Benchmarks](file:///d:/Code/SutharLabs/website/docs/llm/inference_node_setup_and_benchmarks.md)** | Oracle Cloud VM 2 Ollama configuration, 6 active models, 8192 context window, token throughput benchmarks on 2-vCPU ARM. |
| **[OpenCode & Agent Prompt Tuning](file:///d:/Code/SutharLabs/website/docs/llm/opencode_and_prompt_tuning.md)** | System prompt sizing (reduced from 6.4K to 48 tokens), 8K context optimization, and sub-second agent response latency. |
| **[Speculative Decoding & Speedups](file:///d:/Code/SutharLabs/website/docs/llm/speculative_decoding_and_speedups.md)** | Research on Jev-style speculative decoding, draft model pairing, EAGLE-2, Medusa, and grammar-constrained JSON decoding on CPU. |

---

## Host Architecture
- **Inference Node**: Oracle Cloud VM 2 (`132.226.190.125`)
- **Ollama Gateway**: Port `11434`
- **OpenCode Agent Server**: Port `4096` (PM2 `opencode-server`)
