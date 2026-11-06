#!/usr/bin/env bash
# ==============================================================================
# SutharLabs On-VM Deployment & Process Maintenance Script
# Location on VM: /home/ubuntu/website/scripts/deploy.sh
# ==============================================================================
set -e

echo "🔄 [SutharLabs Deploy] Stashing local changes and logs..."
cd /home/ubuntu/website
git stash -u 2>/dev/null || true

echo "🔄 [SutharLabs Deploy] Pulling latest code from origin main..."
git pull origin main

echo "📦 [SutharLabs Deploy] Generating Prisma Client..."
npx prisma generate

# Check memory constraint: VM Standard E2.1.Micro has 1GB RAM.
# Vite client builds require ~1.5GB+ RAM and fail if run locally on this VM.
if [ "$1" == "--force-build" ]; then
  echo "🔨 [SutharLabs Deploy] Compiling production build locally on VM (--force-build requested)..."
  NODE_OPTIONS="--max-old-space-size=800" npm run build
else
  if [ -f "dist/server.cjs" ] && [ -f "dist/index.html" ]; then
    echo "⚡ [SutharLabs Deploy] Production artifacts (dist/) already synced from dev host. Skipping VM-side build to preserve 1GB RAM."
  else
    echo "⚠️  [SutharLabs Deploy] dist/ artifacts missing. Running lightweight build with bounded memory..."
    NODE_OPTIONS="--max-old-space-size=800" npm run build || {
      echo "❌ Memory limit reached. Build locally on host and run: npm run deploy"
      exit 1
    }
  fi
fi

echo "🚀 [SutharLabs Deploy] Gracefully reloading PM2 service..."
pm2 restart sutharlabs-backend --update-env

sleep 2

echo "✅ [SutharLabs Deploy] Deployment finished successfully! Process Status:"
pm2 status sutharlabs-backend
echo ""
echo "Health check:"
curl -s http://127.0.0.1/health || echo "Health endpoint probed."
echo ""
