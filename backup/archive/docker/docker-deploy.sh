#!/bin/bash

# Docker Deploy Script for Chiliz Fan NFT
echo "🚀 Starting Docker deployment for Chiliz Fan NFT..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with all required environment variables."
    exit 1
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Remove old images (optional)
echo "🧹 Cleaning up old images..."
docker system prune -f

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service status
echo "📊 Checking service status..."
docker-compose ps

# Show logs
echo "📋 Recent logs:"
docker-compose logs --tail=20

echo "✅ Deployment completed!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "⚡ Thirdweb Engine: http://localhost:3005"
echo "🗄️ MongoDB: localhost:27017"
echo "🐘 PostgreSQL: localhost:5432"
echo "🔴 Redis: localhost:6379"

echo ""
echo "📝 Useful commands:"
echo "  View logs: docker-compose logs -f"
echo "  Stop services: docker-compose down"
echo "  Restart services: docker-compose restart"
echo "  Update services: docker-compose pull && docker-compose up -d"
