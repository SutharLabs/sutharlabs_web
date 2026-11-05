import json

cfg = {
  "schema": "https://opencode.ai/config.json",
  "provider": {
    "ollama": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Ollama Sovereign Engine",
      "options": {
        "baseURL": "http://127.0.0.1:11434/v1"
      },
      "models": {
        "qwen2.5:1.5b": { "name": "Qwen 2.5 1.5B Ultra-Fast" },
        "gemma2:2b": { "name": "Gemma 2 2B Fast" },
        "qwen2.5-coder:3b": { "name": "Qwen 2.5 Coder 3B Code" },
        "qwen2.5:7b": { "name": "Qwen 2.5 7B Deep Reasoning" },
        "deepseek-r1:1.5b": { "name": "DeepSeek R1 1.5B Fast Reasoning" },
        "deepseek-r1:7b": { "name": "DeepSeek R1 7B Frontier Reasoning" }
      }
    }
  },
  "model": "ollama/qwen2.5-coder:3b"
}

with open('/home/ubuntu/.config/opencode/opencode.jsonc', 'w') as f:
    json.dump(cfg, f, indent=2)

print('OpenCode config updated successfully with 6 local models.')
