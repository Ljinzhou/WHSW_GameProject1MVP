#!/bin/bash

# 部署脚本: 拉取代码并重新构建

echo "1. Pulling latest code..."
git pull origin main

echo "2. Installing dependencies..."
pnpm install

echo "3. Building project..."
pnpm run build

echo "Deployment / Update Complete!"
echo "Make sure Nginx is pointing to the 'dist' directory."
