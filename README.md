# SutharLabs Sovereign Engine Portal

Welcome to the **SutharLabs Sovereign Engine Portal**, a high-performance command center for modern developers. This workspace is engineered with a premium glassmorphic dark interface, real-time analytics, and visual microservice orchestration, providing an interactive, full-stack environment for deploying next-generation web apps, agents, and modular workflows.

---

## 🚀 Key Features & Applets

- **NVDA Stock Tracker**: Interactive Bollinger predictive analytics panel with real-time SVG charting, trade execution (BUY/SELL), and multi-tabbed developer terminal logs.
- **Visual Flow Designer**: An interactive pipeline canvas using dynamic Bezier curves, draggable nodes, custom plugin triggers, and a schema dataset drop-zone (.csv/.json).
- **Ledger Accounting**: A financial payout analyzer featuring dynamic aggregate formula calculations, custom cycle bar metrics, and real-time client-filtering logs.
- **Admin Command Center**: Secure gateway cockpit with live hardware telemetry flutters, system-wide maintenance locks, stress-test triggers, localized account CRUD tools, and an outward marketplace publisher.
- **Live Markdown Compiler**: Dual-pane Markdown editor and preview window built with a custom regex compiler parsing typography, code scripts, lists, and blockquotes.

---

## 🛠 Tech Stack

- **Frontend**: React 19 + TypeScript + Lucide Icons + Framer Motion
- **Styling**: Tailwind CSS v4 featuring Curated Theme CSS-variables and Neon Matrix Grids
- **Backend Node**: Node.js + Express (Full-stack API & Vite middleware integration)
- **Database**: Local File-system JSON Database (`plugins-db.json`)

---

## 📂 Systems Documentation

For a detailed walkthrough of file directories, coordinate SVG math formulas, regex parsing rules, backend REST API endpoint definitions, and CSS theme specifications, read the **[SutharLabs Systems Documentation](docs/DOCUMENTATION.md)**.

---

## ⚡ Run Locally

### Prerequisites
Make sure you have **Node.js** (v18 or higher recommended) installed.

### 1. Clone & Install Dependencies
Navigate to your local repository path and install the package dependencies:
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` and specify your credentials:
```bash
cp .env.example .env.local
```
*(Open `.env.local` and add your `GEMINI_API_KEY` to enable active model context features).*

### 3. Start the Full-Stack Workspace Server
Run the local hot-reloading development server:
```bash
npm run dev
```

Once running, navigate to **`http://localhost:3000`** in your browser to launch the portal.

---

## 📦 Production Builds

To compile and bundle client assets alongside the backend server into production targets:
```bash
npm run build
```
To run the optimized production bundle:
```bash
npm start
```

---

*Copyright &copy; 2026 SutharLabs. All rights reserved.*
