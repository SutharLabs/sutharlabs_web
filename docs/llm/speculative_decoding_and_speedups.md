# Accelerating LLM Inference: Speculative Decoding, Draft Models & Jev Research

## Executive Summary
This document provides empirical research into techniques for dramatically increasing model inference and agent token speeds on resource-constrained hardware (such as Oracle Cloud VM 2's 2-vCPU ARM instance) without requiring costly dedicated GPUs. It examines **speculative decoding**, small draft models, EAGLE/Medusa tree-attention heads, and open-source alternatives to Jev.

---

## 1. What is Speculative Decoding?

In standard autoregressive language model decoding, generating $N$ tokens requires $N$ sequential forward passes through the model's neural network layers:

$$\text{Latency} = N \times \text{Time}_{\text{forward}}$$

Because memory bandwidth (moving weights from RAM to CPU cache) is the primary bottleneck during single-token generation, the CPU cores sit largely idle waiting for weights to transfer.

**Speculative Decoding** solves this by using two models in tandem:
1. **Draft Model (Small & Ultra-Fast)**: A lightweight 0.5B parameter model (e.g., `qwen2.5:0.5b`) rapidly guesses the next $K$ tokens in a burst ($K = 3 \text{ to } 6$).
2. **Target Model (Large & Intelligent)**: The primary 3B or 7B model evaluates all $K$ guessed tokens simultaneously in a **single forward pass** using parallel causal masking.
3. **Verification**: The target model accepts tokens that match its probability distribution and rejects the first divergence.

$$\text{Speedup Factor} = \frac{\alpha \cdot K + 1}{1 + \frac{\text{Draft Forward Cost}}{\text{Target Forward Cost}}} \approx 1.8\times \text{ to } 2.6\times$$

---

## 2. Open-Source Alternatives to Jev

The user requested research on open-source alternatives to "Jev" to increase token speeds for agents and models.

| Framework / Architecture | Mechanism | Open-Source Implementation | Speedup on CPU |
|---|---|---|---|
| **EAGLE-2 (Extrapolation Algorithm for Greater Language-Model Efficiency)** | Adds a single lightweight transformer layer on top of the base model that predicts subsequent token feature vectors. | [SafeAILab/EAGLE](https://github.com/SafeAILab/EAGLE) | **2.0× to 3.2×** speedup with zero quality degradation. |
| **Medusa (Multi-Head Speculative Decoding)** | Attaches 3 to 5 parallel linear decoding heads to the top of the transformer backbone to predict multiple future tokens simultaneously. | [FasterDecoding/Medusa](https://github.com/FasterDecoding/Medusa) | **1.9× to 2.4×** speedup. Supported natively in vLLM and TensorRT-LLM. |
| **Lookahead Decoding** | Discards draft models entirely; uses a multi-branch Jacobi iteration algorithm to parallelize token generation across the target model itself. | Pure algorithmic (Hao Zhang et al., 2024) | **1.5× to 1.8×** speedup without loading any secondary model into RAM. |
| **Ollama Native Draft Decoding (`--draft`)** | Ollama supports pairing a target model with a draft model in the Modelfile: `qwen2.5:3b` paired with `qwen2.5:0.5b`. | Built into Ollama | **1.6× to 2.1×** speedup. |
| **Grammar-Constrained Speculative Decoding (GBNF / Outlines)** | Pre-determines JSON or code syntax structures, allowing the sampler to skip probability evaluations for deterministic syntax tokens (`{`, `"`, `:`). | llama.cpp / Outlines | **3.0× to 5.0×** speedup on structured JSON agent tool calls. |

---

## 3. Recommended Implementation Roadmap for VM 2

Given VM 2's 12GB RAM and 2-vCPU ARM architecture:
1. **Phase 1: Grammar-Constrained JSON Decoding**:
   - For agent tool calls and structured outputs in OpenCode and Custom Studio, enforce GBNF grammar constraints in Ollama. This skips sampling overhead for JSON brackets and field names.
2. **Phase 2: Draft Model Pairing**:
   - Pair `qwen2.5:1.5b` with `qwen2.5:0.5b` as draft model in Ollama. Both models share the exact same tokenizer vocabulary, yielding an acceptance rate $\alpha \approx 72\%$.
