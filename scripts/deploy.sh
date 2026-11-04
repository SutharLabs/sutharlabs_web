#!/usr/bin/env bash
# ==============================================================================
# SutharLabs One-Command Production VM Deployment Script
# ==============================================================================
set -e

echo "🔄 [SutharLabs Deploy] Pulling latest code from origin main..."
cd /home/ubuntu/website
git pull origin main

echo "📦 [SutharLabs Deploy] Generating Prisma Client..."
npx prisma generate

echo "🔨 [SutharLabs Deploy] Compiling production build..."
npm run build

echo "🚀 [SutharLabs Deploy] Gracefully reloading PM2 service..."
pm2 restart sutharlabs-backend --update-env

echo "✅ [SutharLabs Deploy] Deployment finished successfully! Health status:"
curl -s http://127.0.0.1/health
echo ""
