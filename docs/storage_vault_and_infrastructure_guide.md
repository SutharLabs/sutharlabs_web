# SutharLabs Private Storage Vault & Oracle Cloud Infrastructure Guide

This guide details the architecture, setup, and frontend integration of the **SutharLabs Sovereign Storage Vault** hosted on Oracle Cloud Infrastructure Always Free VM (`sutharlabs-db-store`, `137.23.61.191`).

---

## 1. Fleet Architecture Overview

The SutharLabs cloud infrastructure leverages Oracle Cloud's Always Free tier across three dedicated virtual machines in Mumbai (`ap-mumbai-1`):

| VM Name | Shape & Specs | Public IP | Private IP | Role & Usage | RAM Footprint |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`sutharlabs-db-store`** (VM 1) | AMD `VM.Standard.E2.1.Micro` (1 OCPU, 1 GB RAM + 2GB swap, 50 GB SSD) | `137.23.61.191` | `10.0.0.122` | Primary PostgreSQL 16 DB + Storage Vault Daemon + DR Sync | ~250 MB (Postgres) + ~55 MB (Vault) |
| **`sutharlabs-prod`** (VM 2) | Ampere `VM.Standard.A1.Flex` (2–4 OCPU, 12–24 GB RAM, 47 GB SSD) | `132.226.190.125` | `10.0.0.188` | Local LLM Inference (Ollama) + Neural Speech Studio + Heavy Quant | 4–12 GB (Model & Compute dependent) |
| **`sutharlabs-backend`** (VM 3) | AMD `VM.Standard.E2.1.Micro` (1 OCPU, 1 GB RAM + 2GB swap, 50 GB SSD) | `130.210.37.199` | `10.0.0.228` | Production Node.js Express Gateway (:3000) + Nginx Ingress (:80) | ~75 MB (Express + PM2) + ~15 MB (Nginx) |

---

## 2. Storage Vault Architecture & Low-Footprint Daemon

Because `sutharlabs-db-store` operates on 1 GB of physical RAM alongside PostgreSQL, standard storage suites (MinIO, Nextcloud) would trigger Out-of-Memory (OOM) failures.

### The Low-Footprint Solution
* **Engine:** Dedicated Node.js streaming micro-daemon (`sutharlabs_vault`) packaged in `node:20-alpine`.
* **RAM Safeguard:** Hard container memory ceiling (`--memory=96m`) and Node GC boundary (`--max-old-space-size=64`), consuming **< 60 MB RAM total**.
* **Storage Allocation:** Persistent host directory `/home/ubuntu/vault_storage` mounted to `/data/storage` (with **44+ GB available free space** on the SSD).
* **Port / Protocol:** Port `80` (HTTP) with strict `x-vault-token` secret header authentication.
* **Integrity:** Automatically computes and records SHA-256 checksums on all uploaded artifacts.
* **Streaming & Range Support:** Supports HTTP 206 `Range` requests for streaming large logs, video, database dumps, and PDF documents.

---

## 3. Website Backend Proxy Pattern (`server.ts`)

To avoid exposing the storage port directly to public networks or handling CORS across domains, the website Express backend (`server.ts`) proxies all vault interactions:

```
[Browser (Admin UI)]
         │
         │ Authenticated HTTPS (Bearer JWT / Admin Role)
         ▼
[SutharLabs Web Server (server.ts)]
         │
         │ Authenticated HTTP with x-vault-token
         ▼
[Oracle VM Vault Daemon (137.23.61.191:80)]
         │
         │ Stream directly to disk
         ▼
[/home/ubuntu/vault_storage]
```

### Endpoints in `server.ts`:
* `GET /api/vault/health`: Public status check of the Oracle storage volume.
* `GET /api/vault/stats`: Live disk capacity, free bytes, and RAM metrics (Admin only).
* `GET /api/vault/files`: Retrieves the catalog of stored private files (Admin only).
* `POST /api/vault/upload`: Multipart file upload stream directly forwarded to the VM (Admin only).
* `GET /api/vault/download/:id`: Authorized streaming download (supports Range headers) (Admin only).
* `DELETE /api/vault/files/:id`: Removes the file from the VM disk and updates the catalog (Admin only).

---

## 4. Frontend Admin UI (`StorageVaultView.tsx`)

Accessible in the website sidebar under **ADMINISTRATION $\rightarrow$ Storage Vault** (`/admin/storage`) for users with the `Admin` role:

* **Live Telemetry Cockpit:** Displays Node status (`137.23.61.191:80`), Free Disk Volume (`44+ GB Free`), Total Vault Files, and Memory Safety (`< 60 MB RAM`).
* **Drag-and-Drop Uploader:** Supports direct file streaming with live upload progress percentage and category tagging (`Credentials`, `Backups`, `Database Dump`, `Config & Keys`, `Sensitive Docs`, `General`).
* **Search & Filters:** Real-time search across file names and SHA-256 checksums, with category filtering and multi-column sorting.
* **Security & Auditing:** Displays SHA-256 integrity hashes with quick-copy buttons and confirmation dialogs via `<ConfirmModal />` for permanent file deletion.

---

## 5. Related Setup Documentation

For the complete infrastructure setup guide, SSH keys, crontab backup scripts, and dual-database replication documentation, refer to:
* [`D:\Code\SutharLabs\OracleFreeTier\ORACLE_CLOUD_SETUP_GUIDE.md`](file:///D:/Code/SutharLabs/OracleFreeTier/ORACLE_CLOUD_SETUP_GUIDE.md)
* [`D:\Code\SutharLabs\website\docs\database_migration_guide.md`](file:///d:/Code/SutharLabs/website/docs/database_migration_guide.md)

