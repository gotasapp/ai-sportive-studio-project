# Docker Setup & Deployment

## Overview

This project uses Docker for containerized deployment with the following services:

- **Frontend**: Next.js application (Port 3000)
- **Backend**: Python FastAPI for AI generation (Port 8000)
- **Thirdweb Engine**: Gasless transactions (Port 3005)
- **MongoDB**: Main database (Port 27017)
- **PostgreSQL**: Thirdweb Engine database (Port 5432)
- **Redis**: Caching layer (Port 6379)
- **Nginx**: Reverse proxy (Port 80/443)

## 🎯 Deploy Options

### **Current Deploy (Production)**
```
Frontend (Next.js) → Vercel (automatic)
Backend (Python) → Render (automatic)
Thirdweb Engine → Separate server
MongoDB → MongoDB Atlas (cloud)
```

### **Docker Deploy (Optional)**
```
Frontend + Backend + Engine + MongoDB → Single server
```

## 📊 Deploy Comparison

| Aspecto | Current Deploy | Docker Deploy |
|---------|---------------|---------------|
| **Frontend** | Vercel (free) | Container |
| **Backend** | Render (free) | Container |
| **Engine** | Separate server | Container |
| **MongoDB** | Atlas (free) | Container |
| **Setup** | Multiple platforms | Single server |
| **Cost** | Free (hobby) | $5-20/month |
| **Maintenance** | Platform managed | Manual |
| **Scalability** | Automatic | Manual |

## 🚀 Deployment Strategies

### **Strategy 1: Hybrid (Recommended)**
Keep current deploy + Docker for demo:

```bash
# Production (current)
Frontend: Vercel
Backend: Render
MongoDB: Atlas

# Demo (Docker)
docker-compose -f docker-compose.demo.yml up -d
```

### **Strategy 2: Full Docker**
Migrate everything to Docker:

```bash
# Complete migration
docker-compose up --build -d
```

## 📁 Docker Files

### **Development (Safe Testing)**
- `docker-compose.dev.yml` - Test without affecting current deploy
- `docker-test.sh` - Safe testing script

### **Demo (Complete Demo)**
- `docker-compose.demo.yml` - Full demo environment
- `docker-demo.sh` - Demo startup script

### **Production (Full Migration)**
- `docker-compose.yml` - Complete production setup
- `docker-deploy.sh` - Production deployment script

## Prerequisites

- Docker
- Docker Compose
- Git

## Quick Start

### **1. Test Docker (Safe)**
```bash
# Test without affecting current deploy
chmod +x docker-test.sh
./docker-test.sh
```

### **2. Run Demo (Complete)**
```bash
# Run complete demo environment
chmod +x docker-demo.sh
./docker-demo.sh
```

### **3. Full Production**
```bash
# Complete migration (optional)
chmod +x docker-deploy.sh
./docker-deploy.sh
```

## Manual Deployment

### **Development Testing**
```bash
# Test only Thirdweb Engine
docker-compose -f docker-compose.dev.yml up engine postgres redis -d

# Test frontend/backend (optional)
docker-compose -f docker-compose.dev.yml --profile optional up frontend backend -d
```

### **Demo Environment**
```bash
# Complete demo environment
docker-compose -f docker-compose.demo.yml up --build -d

# Access demo
# Frontend: http://localhost:3001
# Backend: http://localhost:8001
# Engine: http://localhost:3005
# Proxy: http://localhost
```

### **Production Environment**
```bash
# Complete production setup
docker-compose up --build -d

# Access production
# Frontend: http://localhost
# Backend: http://localhost:8000
# Engine: http://localhost:3005
```

## Service Architecture

### Frontend (Next.js)
- **Port**: 3000 (3001 for demo)
- **Purpose**: User interface for NFT generation and marketplace
- **Dependencies**: Backend API, Thirdweb Engine

### Backend (Python FastAPI)
- **Port**: 8000 (8001 for demo)
- **Purpose**: AI image generation, database operations
- **Dependencies**: MongoDB, OpenAI API, Cloudinary, Pinata

### Thirdweb Engine
- **Port**: 3005
- **Purpose**: Gasless NFT minting transactions
- **Dependencies**: PostgreSQL

### Databases
- **MongoDB**: Main application data (users, NFTs, collections)
- **PostgreSQL**: Thirdweb Engine transaction data
- **Redis**: Caching and session management

## Environment Variables

Required environment variables in `.env`:

```env
# Frontend
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_client_id
NEXT_PUBLIC_API_URL=http://backend:8000
NEXT_PUBLIC_ENGINE_URL=http://engine:3005

# Backend
OPENAI_API_KEY=your_openai_key
MONGODB_URI=mongodb://mongodb:27017/chiliz_fan_nft
CLOUDINARY_URL=your_cloudinary_url
PINATA_API_KEY=your_pinata_key
PINATA_SECRET_KEY=your_pinata_secret

# Thirdweb Engine
THIRDWEB_API_SECRET_KEY=your_secret_key
ADMIN_WALLET_ADDRESS=your_wallet_address

# Databases
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=password
MONGO_DATABASE=chiliz_fan_nft
```

## Development vs Production

### Development
```bash
# Run only specific services
docker-compose -f docker-compose.dev.yml up frontend backend -d

# Run with hot reload
docker-compose -f docker-compose.dev.yml up frontend backend --build
```

### Production
```bash
# Full production deployment
docker-compose -f docker-compose.yml up -d

# With custom environment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Monitoring & Maintenance

### View Service Status
```bash
# Development
docker-compose -f docker-compose.dev.yml ps

# Demo
docker-compose -f docker-compose.demo.yml ps

# Production
docker-compose ps
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.demo.yml logs -f

# Specific service
docker-compose -f docker-compose.demo.yml logs -f demo-frontend
docker-compose -f docker-compose.demo.yml logs -f demo-backend
docker-compose -f docker-compose.demo.yml logs -f engine
```

### Database Backups
```bash
# MongoDB backup
docker exec mongodb mongodump --out /backup

# PostgreSQL backup
docker exec postgres pg_dump -U engine engine > backup.sql
```

### Updates
```bash
# Pull latest images
docker-compose -f docker-compose.demo.yml pull

# Rebuild and restart
docker-compose -f docker-compose.demo.yml up --build -d
```

## Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check what's using the port
   lsof -i :3001
   lsof -i :8001
   
   # Stop conflicting service
   docker-compose -f docker-compose.demo.yml down
   ```

2. **Environment variables not loaded**
   ```bash
   # Verify .env file
   cat .env
   
   # Restart services
   docker-compose -f docker-compose.demo.yml restart
   ```

3. **Database connection issues**
   ```bash
   # Check database status
   docker-compose -f docker-compose.demo.yml logs postgres
   ```

### Performance Optimization

1. **Resource limits**
   ```yaml
   # Add to docker-compose.yml
   deploy:
     resources:
       limits:
         memory: 2G
         cpus: '1.0'
   ```

2. **Volume optimization**
   ```bash
   # Use named volumes for better performance
   docker volume create chiliz_fan_nft_mongodb_data
   ```

## Security Considerations

1. **Network isolation**: All services use internal Docker network
2. **Non-root users**: Services run as non-root users
3. **Environment variables**: Sensitive data stored in .env
4. **Health checks**: Services include health check endpoints

## Scaling

### Horizontal Scaling
```bash
# Scale backend services
docker-compose -f docker-compose.demo.yml up --scale demo-backend=3 -d
```

### Load Balancing
The Nginx configuration includes load balancing for multiple backend instances.

## Backup Strategy

1. **Database backups**: Daily automated backups
2. **Volume backups**: Weekly volume snapshots
3. **Configuration backups**: Version control for configs

## Migration Guide

For detailed migration instructions, see [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md).

## Support

For Docker-related issues:
1. Check logs: `docker-compose -f docker-compose.demo.yml logs`
2. Verify environment: `docker-compose -f docker-compose.demo.yml config`
3. Check resource usage: `docker stats`

## Cost Analysis

### Current Deploy (Free)
- Vercel: Free (hobby plan)
- Render: Free (hobby plan)
- MongoDB Atlas: Free (512MB)
- Total: $0/month

### Docker Deploy (Paid)
- Server: $5-20/month (DigitalOcean, AWS, etc.)
- Total: $5-20/month

### Recommendation
- **Development/Demo**: Use current free deploy
- **Production**: Consider Docker for full control
- **Enterprise**: Docker for scalability and customization
