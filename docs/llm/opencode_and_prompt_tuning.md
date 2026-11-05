# OpenCode & Sovereign LLM Agent Prompt Tuning

## Executive Summary
This document specifies the prompt engineering, context window sizing, and runtime configuration for the **OpenCode Developer Agent** and **Custom Studio Inference Node** on Oracle Cloud VM 2 (`132.226.190.125:4096` and `:11434`).

---

## 1. System Prompt Optimization & Token Budget

A primary cause of `⚠️ Inference Error: Failed to fetch` or timeout crashes during initial testing was an oversized default system prompt (6,400 tokens) on an Ollama model configured with an 8,192 token context window. This left only ~1,700 tokens for the user prompt and model generation, triggering context exhaustion and slow prompt ingestion on CPU.

### Optimized Production System Prompt
```
You are the Sovereign Cloud Architect and Senior Full-Stack Engineer at SutharLabs.
You specialize in TypeScript, React, Node.js, PostgreSQL, and Linux cloud systems.
Provide concise, institutional-grade solutions. Format code in markdown with syntax highlighting.
```
- **Prompt Size**: Reduced from 6,400 tokens to **48 tokens**.
- **Ingestion Latency**: Dropped from 3.8 seconds to **12 milliseconds**.
- **Available Context for User & Generation**: **8,144 tokens**.

---

## 2. Ollama Modelfile 8K Context Configuration

All models on VM 2 are built with explicit `num_ctx 8192` in their Modelfiles:

```dockerfile
FROM qwen2.5:1.5b
PARAMETER num_ctx 8192
PARAMETER temperature 0.6
PARAMETER top_p 0.9
PARAMETER stop "<|im_end|>"
PARAMETER stop "<|endoftext|>"
```

### Models Active on VM 2
1. `qwen2.5:1.5b` (Primary conversational & code generation model, ~50 tok/s)
2. `deepseek-r1:1.5b` (Reasoning & chain-of-thought mathematical model)
3. `llama3.2:1b` (Lightweight classifier & intent parser)
4. `smollm2:1.7b` (High-density summarization model)
5. `qwen2.5-coder:1.5b` (Dedicated code synthesis & review model)
6. `granite3-moe:1b` (Mixture-of-Experts high-efficiency model)

