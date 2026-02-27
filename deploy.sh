#!/bin/bash
# TKX Fast Deploy Script
# Builds Plane web frontend locally and copies to the running container
# Usage: ./deploy.sh

set -e
export PNPM_HOME="/root/.local/share/pnpm"
export PATH="$PNPM_HOME:$PATH"

echo "🔨 Building Plane web frontend..."
cd /opt/plane-fork

# Create .env if missing
touch apps/web/.env

# Build just the web app
echo "  Running turbo build..."
time pnpm --filter web build 2>&1 | tail -20

echo ""
echo "📦 Copying build output to running container..."

# Find the build output
BUILD_DIR="apps/web/build/client"
if [ ! -d "$BUILD_DIR" ]; then
    echo "ERROR: Build output not found at $BUILD_DIR"
    exit 1
fi

# Copy to the running container
docker cp $BUILD_DIR/. community-web-1:/usr/share/nginx/html/
# Also copy server build if it exists (for SSR routes)
if [ -d "apps/web/build/server" ]; then
    docker cp apps/web/build/server/. community-web-1:/usr/share/nginx/html/server/ 2>/dev/null || true
fi

echo "🔄 Reloading nginx..."
docker exec community-web-1 nginx -s reload 2>/dev/null || docker restart community-web-1

echo ""
echo "✅ Deploy complete! Hard refresh your browser."
