# SutharLabs Custom Flow Designer: Master Specification

> **Plugin ID:** `wp_flow_designer`  
> **Version:** `v0.1.0` (Production)  
> **Route:** `/workspace/flow`  
> **Category:** Architecture  

---

## 1. Executive Summary

**Custom Flow Designer** (`wp_flow_designer`) is an interactive visual system architecture canvas that allows engineers and solutions architects to model microservices topologies, data pipelines, and workflow orchestration nodes with JSON state import/export.

### Core Capabilities:
- **Interactive Node Canvas**: Drag-and-drop source, processor, and output nodes.
- **Node State Machine**: Toggle states between `IDLE`, `ACTIVE`, and `EXECUTED`.
- **Database Persistence**: State synchronized via PostgreSQL `FlowNode` model (`/api/nodes` & `/api/nodes/sync`).
- **State Export/Import**: Export system architecture schemas as JSON for CI/CD pipeline automation.
