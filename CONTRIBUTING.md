# Contributing to SutharLabs

Thank you for contributing to the SutharLabs Developer Platform!

## Pre-Commit Checklist

Before committing any code, please review the complete [docs/pre_commit_checklist.md](docs/pre_commit_checklist.md) guide.

### Quick Pre-Commit Verification:
```bash
# 1. If plugin source files (src/plugins/*) were modified:
# Update the version in src/plugins/<Plugin>/manifest.json, then:
npm run package:plugins

# 2. If database schema was modified:
npx prisma db push
npx prisma generate

# 3. Mandatory checks before every commit:
npm run lint
npm run build

# 4. Update the structural knowledge graph (AST-only, 0 token cost):
graphify update .
```

Or run all verification steps in one command:
```bash
npm run package:plugins && npm run lint && npm run build && graphify update .
```

## Architecture & Versioning Documentation
- [docs/graphify_installation_and_usage_guide.md](docs/graphify_installation_and_usage_guide.md): Comprehensive guide to Graphify AST knowledge graphs, token-optimization, CLI commands, and setup for future workspaces.
- [docs/plugin_versioning_and_releases.md](docs/plugin_versioning_and_releases.md): Comprehensive guide to plugin versioning, SemVer standards, archive packaging, and database release tracking.
- [docs/state_of_plugin_dev.md](docs/state_of_plugin_dev.md): Overview of in-tree vs uploaded plugin architecture.
- [docs/architecture.md](docs/architecture.md): Core platform system topology.
