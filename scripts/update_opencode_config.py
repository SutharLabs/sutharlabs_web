import json

cfg = {
  "$schema": "https://opencode.ai/config.json",
  "schema": "https://opencode.ai/config.json",
  "timeout": 600000,
  "chunkTimeout": 600000,
  "provider": {
    "ollama": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Ollama Sovereign Engine",
      "options": {
        "baseURL": "http://127.0.0.1:11434/v1",
        "timeout": 600000,
        "chunkTimeout": 600000
      },
      "models": {
        "qwen2.5:1.5b": { "name": "Qwen 2.5 1.5B (Ultra-Fast 48 tok/s)" },
        "deepseek-r1:1.5b": { "name": "DeepSeek R1 1.5B (Fast Reasoning 40 tok/s)" },
        "qwen2.5-coder:3b": { "name": "Qwen 2.5 Coder 3B (SOTA Code 28 tok/s)" },
        "gemma2:2b": { "name": "Gemma 2 2B (Fast 35 tok/s)" },
        "qwen2.5:7b": { "name": "Qwen 2.5 7B (Deep Knowledge 8 tok/s)" },
        "deepseek-r1:7b": { "name": "DeepSeek R1 7B (Frontier Reasoning 6 tok/s)" }
      }
    }
  },
  "model": "ollama/qwen2.5-coder:3b"
}

with open('/home/ubuntu/.config/opencode/opencode.jsonc', 'w') as f:
    json.dump(cfg, f, indent=2)

print('OpenCode config updated successfully with 6 local models and 10min timeouts.')
