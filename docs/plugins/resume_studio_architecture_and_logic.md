# Resume Studio: Universal Ingestion & Vector Export Engine

> **Plugin ID:** `wp_resume_studio`  
> **Route:** `/workspace/resume`  
> **Category:** Productivity & Career  
> **Privacy Model:** 100% Client-Side Ingestion & Vector Rendering (Zero Server Uploads)  

---

## 1. Executive Summary

**Resume Studio** is an enterprise-grade standalone workspace plugin designed for privacy-first resume creation, analysis, and multi-format document conversion. It supports universal multi-format document ingestion (DOCX Word, PDF, LaTeX, Markdown, Text, and JSON) and 4-format high-fidelity vector export (PDF, Word DOCX, LaTeX `.tex`, and ATS-friendly Plain Text).

---

## 2. Universal Ingestion Pipeline

The resume parser (`src/plugins/ResumeStudio/utils/resumeParser.ts`) implements specialized extractors for every standard document format:
* **DOCX (Microsoft Word)**: Uses `jszip` to extract `word/document.xml`, stripping XML tags and preserving paragraph and bullet structures.
* **PDF Documents**: Uses `pdfjs-dist` to extract text items and geometric character streams page-by-page.
* **LaTeX Source (`.tex`)**: Parses section macros (`\section`, `\cventry`, `\resumeItem`) and strips math mode delimiters and formatting commands.
* **Markdown & Plain Text**: Direct regex-driven extraction of headers, dates, bullet points, skills, and contact info.
* **JSON Resume**: Standard Schema compliance (JSON Resume v1.0.0).

---

## 3. High-DPI Vector Export Engine

* **Vector PDF**: Uses `pdf-lib` to generate crisp, searchable, ATS-compliant PDF documents with vector typography, selectable text layers, and embedded font metrics.
* **Word DOCX**: Formatted XML document package with native Word tables, bold headings, and bullet styles.
* **LaTeX Source (`.tex`)**: Clean, compilable moderncv / Overleaf LaTeX code.
* **Plain Text**: Optimized for Applicant Tracking Systems (ATS) keyword parsers.

---

## 4. File Organization

```
src/plugins/ResumeStudio/
├── types.ts                         # Complete Resume profile data model
├── manifest.ts                      # Plugin metadata and route specification
├── manifest.json                    # Plugin engine manifest descriptor
├── index.ts                         # Module export
└── utils/
    ├── resumeParser.ts              # Universal multi-format document parser
    └── resumeExporter.ts            # 4-format vector exporter
```

