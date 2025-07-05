#!/bin/bash

# Railway Production Build Script
set -e

echo "Starting production build..."

# Build frontend
echo "Building frontend..."
npx vite build

# Build backend for production
echo "Building backend..."
npx esbuild server/production.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/production.js

echo "Build completed successfully!"
echo "Frontend: dist/public/"
echo "Backend: dist/production.js"