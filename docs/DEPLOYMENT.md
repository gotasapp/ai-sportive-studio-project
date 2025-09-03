# 🚀 CHZ Fan Token Studio - Production Deployment Guide

## 📋 **Overview**

This guide covers the complete production deployment of CHZ Fan Token Studio across multiple platforms with best practices for security, performance, and reliability.

---

## 🏗️ **Deployment Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                      PRODUCTION STACK                           │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (Vercel)          │  Backend (Render)                 │
│  - Next.js SSR/SSG          │  - Python FastAPI                │
│  - Global CDN                │  - Auto-scaling                  │
│  - Environment variables     │  - Health monitoring             │
├─────────────────────────────────────────────────────────────────┤
│  Database (MongoDB Atlas)   │  Storage (Cloudinary + IPFS)     │
│  - Managed cluster          │  - CDN delivery                  │
│  - Automatic backups        │  - Decentralized storage         │
├─────────────────────────────────────────────────────────────────┤
│  Blockchain (Thirdweb)      │  AI Services (OpenAI)            │
│  - CHZ Chain + Polygon      │  - DALL-E 3 + GPT-4 Vision      │
│  - Smart contracts          │  - API rate limiting             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🌐 **Frontend Deployment (Vercel)**

### **Prerequisites**
- GitHub repository with your code
- Vercel account (free tier available)
- Environment variables configured

### **Step 1: Initial Setup**
```bash
# 1. Install Vercel CLI (optional)
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy from GitHub (recommended)
# Go to vercel.com → Import Project → Connect GitHub
```

### **Step 2: Configure Build Settings**
```javascript
// vercel.json (optional - Next.js auto-detected)
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "devCommand": "npm run dev"
}
```

### **Step 3: Environment Variables**
**In Vercel Dashboard → Project Settings → Environment Variables:**

```bash
# Required Variables
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
NEXTAUTH_URL=https://your-domain.vercel.app
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_client_id
THIRDWEB_SECRET_KEY=your_secret_key

# API Configuration
NEXT_PUBLIC_API_URL=https://your-render-app.onrender.com
PYTHON_API_URL=https://your-render-app.onrender.com

# Image & Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt
NEXT_PUBLIC_PINATA_GATEWAY=your-gateway.mypinata.cloud

# AI Services
OPENAI_API_KEY=your_openai_key

# Network Configuration
NEXT_PUBLIC_USE_TESTNET=false
NEXT_PUBLIC_USE_POLYGON=false

# Smart Contracts
NEXT_PUBLIC_MARKETPLACE_CONTRACT_CHZ=your_chz_marketplace_address
NEXT_PUBLIC_CONTRACT_ADDRESS_CHZ=your_chz_nft_address

# Admin Configuration
NEXT_PUBLIC_ADMIN_WALLET_ADDRESS=your_admin_wallet
NEXT_PUBLIC_ADMIN_EMAIL=admin@yourdomain.com
```

### **Step 4: Deployment Process**
```bash
# Automatic deployment (GitHub integration)
git add .
git commit -m "deploy: production ready"
git push origin main

# Manual deployment (CLI)
vercel --prod
```

### **Step 5: Custom Domain Setup**
```bash
# 1. In Vercel Dashboard → Domains
# 2. Add your custom domain
# 3. Configure DNS records:
#    - A record: @ → 76.76.19.61
#    - CNAME: www → cname.vercel-dns.com
# 4. SSL automatically configured
```

---

## 🐍 **Backend Deployment (Render)**

### **Prerequisites**
- GitHub repository with Python API code
- Render account (free tier available)
- Python dependencies properly configured

### **Step 1: Prepare Python API**
```python
# requirements.txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
openai==1.12.0
python-dotenv==1.0.0
pymongo==4.6.1
cloudinary==1.37.0
pillow==10.1.0
requests==2.31.0
```

```python
# main_unified.py - Production configuration
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="CHZ Fan Token Studio API", version="1.0.0")

# Production CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-domain.vercel.app",  # Your production domain
        "https://localhost:3000"           # Local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main_unified:app", host="0.0.0.0", port=port)
```

### **Step 2: Render Configuration**
```yaml
# render.yaml (optional)
services:
  - type: web
    name: chz-fan-token-api
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: python main_unified.py
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
      - key: PORT
        generateValue: true
```

### **Step 3: Deploy to Render**
```bash
# 1. Go to render.com → New Web Service
# 2. Connect GitHub repository
# 3. Configure:
#    - Name: chz-fan-token-api
#    - Environment: Python 3
#    - Build Command: pip install -r requirements.txt
#    - Start Command: python main_unified.py
#    - Instance Type: Free (or paid for production)
```

### **Step 4: Environment Variables**
**In Render Dashboard → Environment:**

```bash
# AI Services
OPENAI_API_KEY=your_openai_key
OPENROUTER_API_KEY=your_openrouter_key

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Image Services
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend URL
NEXTAUTH_URL=https://your-domain.vercel.app

# Python specific
PYTHONPATH=/opt/render/project/src
PORT=10000
```

### **Step 5: Health Monitoring**
```python
# Add health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }
```

---

## 🗄️ **Database Setup (MongoDB Atlas)**

### **Step 1: Create Cluster**
```bash
# 1. Go to mongodb.com/atlas
# 2. Create free account
# 3. Build a Database → M0 Sandbox (Free)
# 4. Choose region (closest to your users)
# 5. Name cluster: chz-fan-token-cluster
```

### **Step 2: Security Configuration**
```bash
# Database Access
# 1. Create database user:
#    - Username: chz-app-user
#    - Password: Generate secure password
#    - Roles: Read and write to any database

# Network Access
# 1. Add IP addresses:
#    - 0.0.0.0/0 (Allow access from anywhere) - for production
#    - Or specific IPs for better security
```

### **Step 3: Connection String**
```bash
# Get connection string from Atlas
# Replace <password> with your actual password
MONGODB_URI=mongodb+srv://chz-app-user:<password>@chz-fan-token-cluster.xxxxx.mongodb.net/chz-app-db?retryWrites=true&w=majority
```

### **Step 4: Initialize Database**
```bash
# Run database population script
npm run db:seed

# Or manually create collections:
# - jerseys
# - stadiums  
# - badges
# - launchpad_collections
# - launchpad_collection_mints
# - users
```

---

## 📦 **Storage & CDN Setup**

### **Cloudinary Configuration**
```bash
# 1. Sign up at cloudinary.com
# 2. Go to Dashboard → Account Details
# 3. Copy:
#    - Cloud Name
#    - API Key  
#    - API Secret
# 4. Configure upload presets (optional)
```

### **IPFS Configuration (Pinata)**
```bash
# 1. Sign up at pinata.cloud
# 2. Go to API Keys → New Key
# 3. Generate JWT token
# 4. Create dedicated gateway (optional)
# 5. Configure:
NEXT_PUBLIC_PINATA_JWT=your_jwt_token
NEXT_PUBLIC_PINATA_GATEWAY=your-gateway.mypinata.cloud
```

---

## ⛓️ **Blockchain Configuration**

### **Thirdweb Setup**
```bash
# 1. Go to thirdweb.com/dashboard
# 2. Create account and project
# 3. Get Client ID and Secret Key
# 4. Deploy contracts:
#    - NFT Collection (ERC-721)
#    - Marketplace V3
#    - Edition Drop (ERC-1155) - optional
```

### **Smart Contract Deployment**
```bash
# CHZ Chain Mainnet (88888)
NEXT_PUBLIC_MARKETPLACE_CONTRACT_CHZ=0xYourMarketplaceContract
NEXT_PUBLIC_CONTRACT_ADDRESS_CHZ=0xYourNFTContract

# Polygon Mainnet (137) - Optional
NEXT_PUBLIC_MARKETPLACE_CONTRACT_POLYGON=0xYourPolygonMarketplace
NEXT_PUBLIC_CONTRACT_ADDRESS_POLYGON=0xYourPolygonNFT
```

### **Thirdweb Engine (Gasless Minting)**
```bash
# 1. Go to thirdweb.com/engine
# 2. Create Engine instance
# 3. Configure backend wallet
# 4. Set environment variables:
ENGINE_URL=https://your-engine-instance.engine.thirdweb.com
ENGINE_ADMIN_KEY=your_admin_key
BACKEND_WALLET_ADDRESS=0xYourBackendWallet
```

---

## 🔧 **CI/CD Pipeline**

### **GitHub Actions (Optional)**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      # Vercel automatically deploys on push

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      # Render automatically deploys on push
```

---

## 📊 **Monitoring & Analytics**

### **Vercel Analytics**
```bash
# Enable in Vercel Dashboard:
# 1. Project Settings → Analytics
# 2. Enable Web Analytics
# 3. Monitor performance metrics
```

### **Application Monitoring**
```javascript
// Add to your app for error tracking
// pages/_app.tsx or app/layout.tsx

if (process.env.NODE_ENV === 'production') {
  // Add Sentry, LogRocket, or similar service
}
```

### **Health Checks**
```bash
# Frontend health check
curl https://your-domain.vercel.app/api/health

# Backend health check  
curl https://your-render-app.onrender.com/health

# API documentation
curl https://your-domain.vercel.app/docs
```

---

## 🔐 **Security Checklist**

### **Environment Security**
- ✅ All secrets in environment variables (never in code)
- ✅ Different keys for development and production
- ✅ API keys with proper scopes and rate limits
- ✅ Database with restricted network access
- ✅ HTTPS enforced on all domains

### **Application Security**
- ✅ Input validation on all endpoints
- ✅ CORS properly configured
- ✅ Rate limiting on sensitive endpoints
- ✅ Wallet signature verification
- ✅ Admin routes protected

### **Smart Contract Security**
- ✅ Use Thirdweb audited contracts
- ✅ Proper permission management
- ✅ Gasless minting through Engine
- ✅ Test on testnet before mainnet

---

## 🚀 **Deployment Checklist**

### **Pre-Deployment**
- [ ] All environment variables configured
- [ ] Database populated with initial data
- [ ] Smart contracts deployed and verified
- [ ] API endpoints tested
- [ ] Build process successful
- [ ] Security audit completed

### **Post-Deployment**
- [ ] Health checks passing
- [ ] API documentation accessible
- [ ] Wallet connections working
- [ ] NFT minting functional
- [ ] Marketplace trading operational
- [ ] Admin panel accessible
- [ ] Analytics tracking enabled

### **Domain Configuration**
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] DNS records propagated
- [ ] Redirects configured (www → non-www or vice versa)

---

## 🔄 **Maintenance & Updates**

### **Regular Maintenance**
```bash
# Weekly tasks:
- Monitor error logs
- Check API response times
- Verify database performance
- Update dependencies (security patches)

# Monthly tasks:
- Review usage analytics
- Optimize database queries
- Update documentation
- Security audit
```

### **Update Process**
```bash
# 1. Test changes locally
npm run dev

# 2. Test on staging/preview
git push origin feature-branch
# Test on Vercel preview deployment

# 3. Deploy to production
git push origin main
# Vercel and Render auto-deploy
```

---

## 🆘 **Troubleshooting**

### **Common Issues**

**Frontend build fails:**
```bash
# Check build logs in Vercel
# Common solutions:
- Update Node.js version
- Clear npm cache: npm cache clean --force
- Check environment variables
- Verify TypeScript errors
```

**Backend deployment fails:**
```bash
# Check Render logs
# Common solutions:
- Verify Python version compatibility
- Check requirements.txt syntax
- Ensure all environment variables set
- Test locally with production settings
```

**Database connection issues:**
```bash
# Check MongoDB Atlas
# Common solutions:
- Verify connection string
- Check network access whitelist
- Confirm user permissions
- Test connection with MongoDB Compass
```

### **Emergency Procedures**
```bash
# Rollback deployment (Vercel)
vercel --prod --env=staging

# Rollback deployment (Render)
# Use Render dashboard to redeploy previous version

# Database backup
# MongoDB Atlas automatic backups available
# Manual backup: mongodump --uri="your_connection_string"
```

---

## 📞 **Support & Resources**

### **Platform Documentation**
- [Vercel Docs](https://vercel.com/docs)
- [Render Docs](https://render.com/docs)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [Thirdweb Docs](https://portal.thirdweb.com/)

### **Monitoring URLs**
- Frontend: `https://your-domain.vercel.app`
- Backend API: `https://your-render-app.onrender.com`
- API Docs: `https://your-domain.vercel.app/docs`
- Admin Panel: `https://your-domain.vercel.app/admin`

---

This deployment guide ensures a **secure**, **scalable**, and **maintainable** production environment for CHZ Fan Token Studio. 🚀
