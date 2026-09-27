# Vercel Deployment Guide

This guide walks through deploying the SutharLabs website to Vercel. Because this project is a **full-stack Express + SQLite** application, there are important compatibility considerations you must understand before deploying.

---

## ⚠️ Architecture Compatibility Warning

Vercel is a **serverless platform** — it does not support long-running Node.js processes or persistent file-based storage. This project uses:

| Feature | Dev Setup | Vercel Compatibility |
|---|---|---|
| Frontend (Vite/React) | `vite build` | ✅ Fully supported |
| Backend (Express server) | `server.ts` | ⚠️ Requires conversion to Vercel Serverless Functions |
| Database (Prisma + SQLite) | `prisma/dev.db` | ❌ File-based DB is ephemeral on Vercel — **data will not persist** |
| File Uploads (Multer) | `/uploads` directory | ❌ Filesystem writes are not persistent on Vercel |

> **Important:** For a production-grade deployment, you must replace SQLite with a hosted database (e.g., **Turso**, **PlanetScale**, **Neon**, or **Supabase**) and migrate file uploads to cloud storage (e.g., **Cloudflare R2** or **Vercel Blob**). See [Phase 3](#phase-3-optional-migrate-the-database) for details.
>
> If you only need to deploy the **frontend** as a static site (with a separately hosted backend), skip to [Frontend-Only Deployment](#frontend-only-deployment).

---

## Phase 1: Prerequisites

1. **Vercel account** — Create one at [vercel.com](https://vercel.com) (free tier available).
2. **Vercel CLI** — Install globally:
   ```bash
   npm install -g vercel
   ```
3. **Git repository** — Your project must be pushed to GitHub, GitLab, or Bitbucket. Vercel deploys from Git.
4. **Environment variables** ready — See [Phase 2](#phase-2-configure-environment-variables).

---

## Frontend-Only Deployment

Use this approach if you plan to host the Express backend separately (e.g., on Railway, Render, or a VPS) and only want to deploy the React frontend on Vercel.

### Step 1: Create a `vercel.json`

Create a `vercel.json` file in the project root:

```json
{
  "buildCommand": "vite build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

The `rewrites` rule ensures that React Router's client-side routing works correctly — all routes are served by `index.html`.

### Step 2: Deploy via CLI

```bash
# Log in to Vercel
vercel login

# Deploy from the project root
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No → create a new one
# - Project name: sutharlabs-website
# - Directory: ./
# - Override settings? No
```

### Step 3: Set Environment Variables

In the Vercel dashboard, go to your project → **Settings** → **Environment Variables**, and add:

| Variable | Value | Notes |
|---|---|---|
| `VITE_GOOGLE_CLIENT_ID` | `your_google_client_id` | Google OAuth Client ID |
| `VITE_API_BASE_URL` | `https://your-backend.com` | URL of your separately hosted backend |

> **Note:** Vite only exposes variables prefixed with `VITE_` to the frontend bundle. Never put secrets like `GEMINI_API_KEY` in `VITE_` variables — they will be publicly visible in the browser.

After adding variables, trigger a **redeployment** from the Vercel dashboard for them to take effect.

---

## Full-Stack Deployment (Express as Serverless Functions)

This approach converts the Express server into Vercel Serverless Functions so the entire app runs on Vercel.

> **Warning:** This requires significant refactoring. SQLite **will not work** in this setup without migrating to a cloud database first.

### Step 1: Restructure for Vercel API Routes

Create an `api/` directory at the project root. Vercel treats each file here as a serverless function endpoint.

**Example: `api/[...express].ts`** — Wrap your Express app as a Vercel catch-all dynamic route to ensure `req.url` is correctly preserved without manual rewrites replacing it:

```typescript
import app, { startPromise } from '../server.js'; // export the express `app` and any async bootstrap promise from server.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Ensure the server has finished bootstrapping routes and plugins (if applicable)
  await startPromise;
  
  // Hand off to Express
  return app(req as any, res as any);
}
```

Update `server.ts` to **export** the Express app instead of calling `app.listen()`:

```typescript
// At the bottom of server.ts, change:
// app.listen(PORT, () => { ... })

// To:
export const startPromise = startServer().catch(console.error); // Ensure your bootstrapping completes
export default app;

// Only listen locally when not in serverless context
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
```

Install the Vercel types package:

```bash
npm install --save-dev @vercel/node
```

### Step 2: Update `vercel.json` for Full-Stack

To ensure Vercel does not accidentally serve `index.html` for API requests, use an explicit pass-through rewrite for `/api/(.*)` *before* your SPA catch-all rewrite:

```json
{
  "buildCommand": "npm install && npx prisma generate && vite build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### Step 3: Deploy

```bash
vercel --prod
```

---

## Phase 2: Configure Environment Variables

All required environment variables must be set in the **Vercel Dashboard** under **Settings → Environment Variables**.

### Required Variables

| Variable | Description | Where to Get It |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini AI API key | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `APP_URL` | The full public URL of your deployment | Vercel provides this after first deploy (e.g., `https://your-app.vercel.app`) |
| `DATABASE_URL` | Connection string for your hosted database | See [Phase 3](#phase-3-optional-migrate-the-database) |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID | See [Google OAuth Setup](./google-oauth-setup.md) |

> **Caution:** Never commit your `.env` file to Git. Ensure `.env` is listed in your `.gitignore`.

---

## Phase 3 (Optional): Migrate the Database

SQLite is a file-based database that cannot be used on Vercel's serverless infrastructure. You must migrate to a hosted database for data to persist.

### Recommended: Turso (SQLite-compatible, free tier)

Turso is a distributed SQLite database that is fully compatible with Prisma's SQLite dialect — making it the easiest migration path.

1. **Create a Turso account** at [turso.tech](https://turso.tech).
2. **Install the Turso CLI** and create a database:
   ```bash
   brew install tursodatabase/tap/turso
   turso auth login
   turso db create sutharlabs-db
   turso db show sutharlabs-db  # copy the URL
   turso db tokens create sutharlabs-db  # copy the auth token
   ```
3. **Update your Prisma schema** (`prisma/schema.prisma`):
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
4. **Add the `@prisma/adapter-libsql`** package:
   ```bash
   npm install @prisma/adapter-libsql @libsql/client
   ```
5. **Set environment variables** in Vercel:
   ```
   DATABASE_URL=libsql://your-db-url.turso.io
   TURSO_AUTH_TOKEN=your_turso_auth_token
   ```
6. **Push your schema** to the remote database:
   ```bash
   npx prisma db push
   ```

### Alternative: Neon (PostgreSQL, generous free tier)

If you prefer PostgreSQL, [Neon](https://neon.tech) is a great serverless option. You'll need to update your Prisma provider from `sqlite` to `postgresql` and adjust any SQLite-specific query syntax.

---

## Phase 4: Reconfigure Google OAuth

After deploying, Google OAuth will reject requests from your new Vercel domain because it's not on the allowlist.

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services → Credentials**.
2. Click on your OAuth 2.0 Client ID.
3. Under **Authorized JavaScript origins**, click **+ ADD URI** and add your production domain(s) (without a trailing slash):
   ```
   https://your-app.vercel.app
   https://www.your-custom-domain.com
   https://your-custom-domain.com
   ```
4. Under **Authorized redirect URIs**, add the exact same domains:
   ```
   https://your-app.vercel.app
   https://www.your-custom-domain.com
   https://your-custom-domain.com
   ```
   *(Note: Add the `/auth/callback` path if your application requires it, but standard Google OAuth popups often just need the root origin).*
5. Click **Save**.

> **Note:** Propagation can take a few minutes. If OAuth fails immediately after saving, wait 2–5 minutes and try again.

Also update the `APP_URL` environment variable in Vercel to match your production URL.

---

## Deployment Checklist

Before going live, verify:

- [ ] `vercel.json` is in the project root
- [ ] `.env` is in `.gitignore` — secrets are only in Vercel dashboard
- [ ] All `VITE_` prefixed variables are set (frontend)
- [ ] `GEMINI_API_KEY` and `APP_URL` are set (backend)
- [ ] `DATABASE_URL` points to a hosted database (not SQLite file path)
- [ ] Google OAuth origins updated to include the Vercel domain
- [ ] Prisma client generated (`prisma generate`) as part of the build command
- [ ] React Router rewrites configured so page refreshes don't 404
- [ ] Test a production build locally: `npm run build && npm start`

---

## Continuous Deployment

Once connected to Git, Vercel automatically redeploys on every push to your default branch (`main`). For branch previews:

- Every pull request gets a unique preview URL (e.g., `https://your-app-git-feature-branch.vercel.app`)
- Use **Environment Variable** scoping in the Vercel dashboard to set different values per environment (Production, Preview, Development)

---

## Useful Commands

```bash
# Deploy to preview (staging)
vercel

# Deploy to production
vercel --prod

# Pull remote environment variables to local .env.vercel
vercel env pull .env.vercel

# List all deployments
vercel ls

# View deployment logs
vercel logs your-app.vercel.app
```

---

## Further Reading

- [Vercel Documentation](https://vercel.com/docs)
- [Prisma on Vercel](https://www.prisma.io/docs/orm/more/deployment/deployment-guides/deploying-to-vercel)
- [Turso + Prisma Guide](https://docs.turso.tech/sdk/ts/orm/prisma)
- [Google OAuth Setup](./google-oauth-setup.md)
