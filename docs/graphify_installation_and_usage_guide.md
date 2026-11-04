# Graphify Installation, Architecture & Workflow Guide

> **Classification:** Developer Tooling & Context Optimization Standard  
> **Target Audience:** Core Contributors, AI Agent Pair-Programmers & Systems Engineers  
> **Last Updated:** November 2026  
> **Status:** Active & Integrated in SutharLabs Workspaces  

---

## 1. Executive Summary: What Graphify Solves

When an AI coding assistant (such as **Google Antigravity**, **Cursor**, **Claude Code**, or **GitHub Copilot**) operates on a medium-to-large repository, it typically suffers from the **"Navigation Tax"**:
1. The assistant executes repetitive `Glob` and `Grep` loops across directories.
2. It ingests thousands of lines of irrelevant code, tests, and mock files into its active context window.
3. It expends **20,000 to 100,000+ tokens** merely to answer simple structural questions (e.g., *"Where is `StockTrackerView` mounted?"* or *"What dependencies does `gstEngine.ts` touch?"*).

### The Solution: Deterministic Code Graphing
**Graphify** replaces runtime brute-force search with **pre-compiled structural graph traversal**. 

* **Deterministic AST Parsing:** Uses [Tree-sitter](https://tree-sitter.github.io/) locally across 25+ languages (TypeScript, JavaScript, Python, Go, Rust, C#, etc.) to map functions, classes, imports, and call hierarchies.
* **Zero API Cost in Code-Only Mode:** The AST parser runs 100% on the local CPU without external API calls or LLM token expenses.
* **Token Reduction:** Reduces agent exploration tokens by **up to 70x**, allowing assistants to jump directly to exact file paths and line numbers in a single lookup.

---

## 2. Machine-Wide Installation (One-Time Setup)

Graphify is distributed as the Python package **`graphifyy`** (note the double `y`).

### Prerequisites
* **Python 3.10+** (Python 3.14 verified and supported).
* **pip**, **pipx**, or **uv**.

### Installation Commands
Run either of the following in your system terminal (PowerShell / Bash):

```powershell
# Standard Python pip
pip install graphifyy

# Or using uv (recommended for isolated CLI tools)
uv tool install graphifyy
```

### Verification
Confirm the CLI binary is available:
```powershell
graphify --version
```

---

## 3. Integrating Graphify into a Workspace (Step-by-Step)

Follow this 5-step sequence when initializing Graphify in a project:

### Step 1: Create `.graphifyignore`
Create a `.graphifyignore` file in the root of your workspace to exclude build artifacts, large datasets, binary stores, and generated assets from being parsed:

```gitignore
# Dependencies & Compilation Outputs
node_modules/
dist/
build/
coverage/

# Runtime Storage & Uploads
storage/
installed_plugins/
uploads/
data/

# Temporary, Test & Script Backups
*.backup
*.txt
*.bat
*.cjs
*.py

# Local Databases & Lockfiles
*.db
*.db-journal
package-lock.json
```

---

### Step 2: Build the Knowledge Graph

#### Option A: Code-Only Mode (Recommended — 100% Free & Local)
For code search, AST dependencies, call graphs, and token optimization:
```powershell
graphify . --code-only
```
* **Tree-sitter** scans your source files locally.
* **Zero API key required**, zero tokens consumed.

#### Option B: Full Multimodal Mode (Code + Markdown Docs + Architecture Specs)
If you want Graphify to also index markdown files (`docs/*.md`) and connect doc concepts to code entities via an LLM:
```powershell
# Set an API key for your preferred provider:
$env:GEMINI_API_KEY = "your-api-key"
# Or: $env:ANTHROPIC_API_KEY = "sk-..." / $env:OPENAI_API_KEY = "sk-..."

graphify .
```

---

### Step 3: Generate Visual Map and Architecture Report

To cluster the graph and generate human-readable reports without calling an LLM:
```powershell
graphify cluster-only . --no-label
```

#### Generated Artifacts in `graphify-out/`:
* **`graphify-out/graph.json`**: The machine-readable node/edge graph queried by AI agents.
* **`graphify-out/GRAPH_REPORT.md`**: Architectural breakdown detailing module clusters, coupling hubs, and "god nodes".
* **`graphify-out/graph.html`**: Interactive force-directed 2D/3D visualization that can be opened in any web browser.

---

### Step 4: Install AI Coding Assistant Skills & Rules

Teach your AI coding assistants to automatically consult `graphify-out/graph.json` before performing file searches:

#### For Google Antigravity:
```powershell
graphify antigravity install
```
This automatically configures:
* **Rule:** `.agents/rules/graphify.md` (Instructs Antigravity to prioritize `graphify query` and `graphify explain` over raw greps).
* **Workflow:** `.agents/workflows/graphify.md`.
* **Skill:** `~/.gemini/config/skills/graphify/SKILL.md`.

#### For Other Editors & Assistants:
```powershell
# Cursor IDE (writes .cursor/rules/graphify.mdc)
graphify cursor install

# Claude Code (writes CLAUDE.md section + pre-tool hooks)
graphify claude install

# VS Code / Copilot Chat (writes .github/copilot-instructions.md)
graphify vscode install

# Gemini CLI
graphify gemini install
```

---

### Step 5: Automate Synchronization with Git Hooks

To keep the graph synchronized with code changes without manually re-indexing:
```powershell
graphify hook install
```

This installs:
* **`post-commit` / `post-merge` / `post-checkout` hooks**: Automatically runs incremental re-indexing (`graphify update .`) whenever code branches or commits change.
* **Git Merge Driver**: Registers a custom merge driver in `.gitattributes` (`graphify-out/graph.json merge=graphify`) so team branches merge graph states smoothly.

---

### Step 6: Configure `.gitignore`

Ensure cache files are ignored while keeping structural reports tracked:
```gitignore
# Graphify internal cache
graphify-out/cache/
```

---

## 4. Day-to-Day CLI Usage & Search Cheat Sheet

| Intent | Command | Description |
| :--- | :--- | :--- |
| **Inspect a Component / Symbol** | `graphify explain "<SymbolName>"` | Displays exact file location, line number, incoming callers, and outgoing callees. |
| **Find Shortest Call Path** | `graphify path "<SymbolA>" "<SymbolB>"` | Traces the shortest directed execution chain connecting two functions or classes. |
| **Ask Architectural Questions** | `graphify query "<Your question>"` | Performs a scoped breadth-first traversal across graph nodes to isolate relevant logic. |
| **Incremental Re-Index** | `graphify update .` | Scans modified files and updates `graph.json` in seconds (0 API tokens). |
| **Force Overwrite** | `graphify update . --force` | Overwrites the graph even if nodes were removed during major refactoring. |
| **Open Visual Web Canvas** | Double-click or open `graphify-out/graph.html` | Interactive browser canvas for visually exploring project modules and coupling. |

---

## 5. Quick Checklist for FUTURE Workspaces

Whenever you spin up or clone a new repository in the future, follow this 30-second workflow:

```powershell
# 1. Switch to repository directory
cd D:\Code\my-new-app

# 2. Extract code AST graph (free, local)
graphify . --code-only

# 3. Cluster and generate reports & visual HTML map
graphify cluster-only . --no-label

# 4. Wire up to AI assistant (Antigravity, Cursor, etc.)
graphify antigravity install
# (or: graphify cursor install / graphify claude install)

# 5. Enable auto-update on git commit
graphify hook install
```

---

## 6. Common Diagnostics & Troubleshooting

### Issue 1: `error: no LLM API key found (N doc/paper/image file(s) need semantic extraction)`
* **Cause:** Graphify found documentation or image files alongside code and attempted multimodal extraction.
* **Resolution:** Pass `--code-only` to strictly perform local Tree-sitter AST extraction without API keys:
  ```powershell
  graphify . --code-only
  ```

### Issue 2: `Rebuild has fewer nodes than previous graph, skipping`
* **Cause:** You deleted or refactored files and Graphify protects against accidental graph truncation.
* **Resolution:** Pass `--force`:
  ```powershell
  graphify update . --force
  ```

### Issue 3: Stale Graph Warnings from Assistant
* **Cause:** New files were added or functions renamed without committing.
* **Resolution:** Run `graphify update .` to bring the AST cache into 100% sync with current working tree state.

