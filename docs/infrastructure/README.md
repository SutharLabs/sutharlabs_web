# Sovereign Cloud Fleet & Infrastructure Operations

Welcome to the **SutharLabs Cloud Infrastructure & DevOps** documentation.

---

## 1. Fleet Topology Overview

```
                                  ┌────────────────────────────────────────┐
                                  │      SUTHARLABS CLOUD FLEET            │
                                  └────────────────────────────────────────┘

    ┌───────────────────────────┐  PostgreSQL Sync  ┌───────────────────────────┐
    │  PRIMARY DATABASE HOST    │──────────────────►│  DISASTER RECOVERY HOST   │
    │  Oracle Cloud VM 1        │  (Dual-DB Cron)   │  Neon Serverless DB       │
    │  IP: 137.23.61.191        │                   │  ep-damp-flower-a14oijq1  │
    │  PostgreSQL 16 (:5432)    │                   │  PostgreSQL 16 (:5432)    │
    │  Encrypted Vault (:8080)  │                   │  Automated Failover Standby│
    └───────────────────────────┘                   └───────────────────────────┘
                 ▲                                                ▲
                 │                                                │
                 │                ┌───────────────────────────────┘
                 │                │
    ┌────────────┴──────────────┐ │                 ┌───────────────────────────┐
    │  PRODUCTION APP GATEWAY   │─┘                 │  AI & SPEECH INFERENCE    │
    │  Oracle Cloud VM 3        │                   │  Oracle Cloud VM 2        │
    │  IP: 130.210.37.199       │                   │  IP: 132.226.190.125      │
    │  Node.js / Express (:80)  │──HTTP AI Proxy───►│  Ollama 6 Models (:11434) │
    │  PM2 Gateway Server       │   (Private VCN)   │  OpenCode Agent (:4096)   │
    │  Nginx Reverse Proxy      │                   │  Neural Edge TTS (:5050)  │
    └───────────────────────────┘                   └───────────────────────────┘
```

---

## 2. Directory Contents

| Document | Description |
|---|---|
| **[Oracle Fleet & Replication Runbook](file:///d:/Code/SutharLabs/website/docs/infrastructure/oracle_fleet_and_replication.md)** | Complete 3-VM Oracle topology, primary-to-backup sync, automatic failover runbook, crontab automation, and Nginx reverse proxy configs. |
| **[Database Migration & Backup](file:///d:/Code/SutharLabs/website/docs/infrastructure/database_migration_and_backup.md)** | Dual-database PostgreSQL 16 schema migrations, Prisma migrations, Neon DR replication, and cron synchronization. |
| **[Storage Vault & Security](file:///d:/Code/SutharLabs/website/docs/infrastructure/storage_vault_and_security.md)** | VM 1 Encrypted Storage Vault, AES-256-GCM encryption at rest, JWT authentication, and pre-signed upload URLs. |
| **[Data Segregation & Privacy](file:///d:/Code/SutharLabs/website/docs/infrastructure/data_segregation_and_privacy.md)** | Multi-tenant tenant isolation, organization data scoping, workspace privacy boundaries, and cryptographic protection. |
| **[Pre-Commit & Deployment Automation](file:///d:/Code/SutharLabs/website/docs/infrastructure/pre_commit_and_deployment.md)** | Pre-commit checklist, packaging verification, deploy.sh automation on VM 3, and zero-downtime rolling restart. |
