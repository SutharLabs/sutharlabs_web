# SutharLabs Plugin Versioning & Mandatory Pre-Commit Rules

All AI agents and developers modifying code in this repository MUST strictly follow these rules before committing any code changes.

---

## 1. Plugin Initial Versioning & Increment Standards

All plugins in `src/plugins/*` follow Semantic Versioning (SemVer 2.0.0): `MAJOR.MINOR.PATCH`.

### A. Initial Version Standard (`0.1.0`)
* **Rule**: Every new in-tree or standalone plugin MUST start at initial version **`0.1.0`** (initial alpha/beta release). Never start a new plugin at `1.0.0` or `0.0.1`.

### B. Mandatory Minimum Increment on Every Commit (`+0.0.1`)
* **Rule**: Whenever any commit introduces changes to a plugin directory (`src/plugins/<PluginName>/*`), that plugin's `version` field **MUST at least be incremented by `0.0.1`** (Patch bump).
* **Where to Update**:
  1. `src/plugins/<PluginName>/manifest.json`
  2. `src/plugins/<PluginName>/manifest.ts` (if present)
  3. `scripts/package-plugins.ts` (if listed under `IN_TREE_PLUGINS`)

### C. Version Increment Thresholds
* **PATCH (`+0.0.1`, e.g. `0.1.0` → `0.1.1` or `1.1.4` → `1.1.5`)**:
  * Any bug fix, UI styling tweak, performance tuning, minor logic change, or documentation update within the plugin.
* **MINOR (`+0.1.0`, e.g. `0.1.0` → `0.2.0`)**:
  * New user-facing feature additions, new plottable indicators, new trade strategies, new exported actions, or non-breaking API expansions.
* **MAJOR (`+1.0.0`, e.g. `0.x.x` → `1.0.0` or `1.x.x` → `2.0.0`)**:
  * Breaking architectural changes, state format migrations, backward-incompatible API changes, or production-stable 1.0.0 transitions.

---

## 2. Mandatory Pre-Commit Checklist & Verification Sequence

Before executing any `git commit`, the following sequence MUST be completed in order:

1. **Step 1: Check Modified Plugins (`git status`)**
   * Inspect all modified files under `src/plugins/`.
   * For every touched plugin, bump its version by at least `+0.0.1` in `manifest.json` and `manifest.ts`.

2. **Step 2: Run TypeScript Type Check (`npm run lint` / `npx tsc --noEmit`)**
   * **Mandatory**: Must pass with 0 errors (`exit code 0`).
   * Never commit code with unresolved TypeScript compilation errors.

3. **Step 3: Run Production Bundler Build (`npm run build`)**
   * **Mandatory**: Must successfully compile both Vite React frontend and ESBuild Express server (`exit code 0`).
   * Verifies bundle integrity, dynamic imports, and asset resolution.

4. **Step 4: Update Knowledge Graph (`graphify update .`)**
   * **Mandatory**: Keep the codebase AST graph synchronized after any code modifications.

5. **Step 5: Stage and Commit**
   * Stage all modified manifests and source files (`git add ...`).
   * Commit with a descriptive conventional commit message (`feat: ...`, `fix: ...`).

