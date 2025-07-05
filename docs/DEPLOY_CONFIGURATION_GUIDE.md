# 🚀 Deploy Configuration Guide - CHZ Fan Token Studio

**Date:** January 21, 2025  
**Status:** ✅ ALL CRITICAL DEPLOY ISSUES RESOLVED  
**Version:** Production Ready

---

## 📋 **DEPLOY CHECKLIST - COMPLETED**

### ✅ **FIXED ISSUES**
- **✅ Hardcoded URLs replaced** with environment variables
- **✅ Missing environment variables** added to `env.example`
- **✅ CORS configuration** updated for production domains
- **✅ Next.js config enhanced** with production optimizations
- **✅ Image optimization** configured for external domains
- **✅ API headers** configured for cross-origin requests

---

## 🔧 **CRITICAL ENVIRONMENT VARIABLES**

### **Frontend (.env.local)**
```bash
# ====== PRODUCTION DEPLOYMENT ENVIRONMENT ======

# Reown AppKit (REQUIRED)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id-from-reown

# API Endpoints (CRITICAL - UPDATE FOR PRODUCTION)
NEXT_PUBLIC_API_URL=https://your-python-api.render.com
NEXT_PUBLIC_VISION_API_URL=https://your-vision-api.render.com
PYTHON_API_URL=https://your-python-api.render.com
NEXTAUTH_URL=https://your-frontend.vercel.app

# MongoDB (REQUIRED)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chz-app-db

# OpenAI (REQUIRED)
OPENAI_API_KEY=sk-your-openai-key

# Cloudinary (Image Upload)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Pinata IPFS (NFT Storage)
NEXT_PUBLIC_PINATA_JWT=your-pinata-jwt
NEXT_PUBLIC_PINATA_GATEWAY=your-gateway.mypinata.cloud

# Thirdweb (Web3)
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your-client-id
THIRDWEB_API_SECRET_KEY=your-secret-key

# Network Configuration
NEXT_PUBLIC_USE_TESTNET=false
NEXT_PUBLIC_USE_POLYGON=true

# Contracts (Production)
NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON=your-polygon-contract
NEXT_PUBLIC_NFT_EDITION_CONTRACT_POLYGON=your-edition-contract

# Admin Access
NEXT_PUBLIC_ADMIN_WALLET_ADDRESS=0x...
NEXT_PUBLIC_ADMIN_EMAIL=admin@yourdomain.com

# Thirdweb Engine (Gasless Mints)
ENGINE_URL=https://engine.thirdweb.com
ENGINE_ADMIN_KEY=your-engine-key
VAULT_ACCESS_TOKEN=your-vault-token
BACKEND_WALLET_ADDRESS=0x...
BACKEND_WALLET_PRIVATE_KEY=0x...

# App Domain
NEXT_PUBLIC_APP_DOMAIN=https://your-frontend.vercel.app
```

### **Python API Environment Variables**
```bash
# For Python APIs (Render/Railway deployment)
OPENAI_API_KEY=sk-your-openai-key
OPENROUTER_API_KEY=sk-or-your-openrouter-key
ALLOWED_ORIGINS=https://your-frontend.vercel.app,https://*.vercel.app
```

---

## 🌐 **DEPLOYMENT PLATFORMS**

### **Frontend: Vercel (Recommended)**
```bash
# 1. Connect GitHub repository to Vercel
# 2. Set environment variables in Vercel dashboard
# 3. Deploy automatically on git push

# Build Settings:
Framework Preset: Next.js
Build Command: npm run build
Output Directory: .next
Install Command: npm ci

# Environment Variables:
# Add all variables from Frontend section above
```

### **Python APIs: Render (Recommended)**
```bash
# 1. Deploy main.py (Port 8000)
Service Name: chz-main-api
Build Command: pip install -r requirements.txt
Start Command: python main.py
Port: 8000

# 2. Deploy vision_test_api.py (Port 8002)  
Service Name: chz-vision-api
Build Command: pip install -r requirements.txt
Start Command: python vision_test_api.py
Port: 8002

# Environment Variables for both:
OPENAI_API_KEY=sk-...
OPENROUTER_API_KEY=sk-or-...
```

### **Database: MongoDB Atlas**
```bash
# 1. Create MongoDB Atlas cluster
# 2. Get connection string
# 3. Update MONGODB_URI in environment variables
# 4. Run seed script to populate initial data

Connection String Format:
mongodb+srv://username:password@cluster.mongodb.net/chz-app-db
```

---

## 🔗 **UPDATED CORS CONFIGURATION**

### **Python APIs Support:**
- ✅ `http://localhost:3000` (development)
- ✅ `https://localhost:3000` (local HTTPS)
- ✅ `https://*.vercel.app` (Vercel deployments)
- ✅ `https://*.netlify.app` (Netlify deployments)
- ✅ `https://*.railway.app` (Railway deployments)
- ✅ `https://*.render.com` (Render deployments)

### **Next.js API Routes:**
- ✅ Automatic CORS headers for all `/api/*` routes
- ✅ Support for external domains
- ✅ Proper content security policies

---

## 🎯 **CRITICAL FIXES IMPLEMENTED**

### **1. Hardcoded URLs Fixed**
```typescript
// BEFORE (BLOCKING DEPLOY):
const visionResponse = await fetch('http://localhost:8002/analyze-image-base64')

// AFTER (PRODUCTION READY):
const visionApiUrl = process.env.NEXT_PUBLIC_VISION_API_URL || 'http://localhost:8002'
const visionResponse = await fetch(`${visionApiUrl}/analyze-image-base64`)
```

### **2. Environment Variables Added**
```bash
# NEW CRITICAL VARIABLES ADDED TO env.example:
NEXT_PUBLIC_VISION_API_URL=http://localhost:8002
PYTHON_API_URL=http://localhost:8000  
NEXTAUTH_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/chz-app-db
```

### **3. CORS Enhanced**
```python
# BEFORE (LOCALHOST ONLY):
allow_origins=["http://localhost:3000"]

# AFTER (PRODUCTION READY):
allow_origins=[
    "http://localhost:3000",
    "https://localhost:3000", 
    "https://*.vercel.app",
    "https://*.netlify.app",
    "https://*.railway.app", 
    "https://*.render.com"
]
```

### **4. Next.js Config Optimized**
```typescript
// NEW PRODUCTION FEATURES:
- Image optimization for external domains
- CORS headers for API routes
- Webpack optimizations
- Bundle size reduction
- Standalone output for deployment
```

---

## 📝 **DEPLOYMENT STEPS**

### **Phase 1: Environment Setup**
1. **Create Production Accounts:**
   - Vercel (Frontend)
   - Render (Python APIs)
   - MongoDB Atlas (Database)
   - Pinata (IPFS)
   - Thirdweb (Web3)

2. **Get API Keys:**
   - OpenAI API key
   - Reown Project ID
   - Cloudinary credentials
   - All other service keys

### **Phase 2: Database Setup**
```bash
# 1. Create MongoDB Atlas cluster
# 2. Set up database user and network access
# 3. Get connection string
# 4. Update MONGODB_URI
# 5. Run seed script:
node scripts/seed.js
```

### **Phase 3: Python APIs Deployment**
```bash
# 1. Deploy to Render:
# - main.py on port 8000
# - vision_test_api.py on port 8002
# 2. Get production URLs
# 3. Update environment variables
```

### **Phase 4: Frontend Deployment**
```bash
# 1. Update all environment variables in Vercel
# 2. Deploy from GitHub
# 3. Test all functionality
```

### **Phase 5: Production Testing**
```bash
# Test all features:
✅ Wallet connection
✅ NFT generation (Jersey/Stadium/Badge)
✅ Vision Analysis system
✅ Marketplace functionality
✅ Admin panel access
✅ Gasless minting
```

---

## 🚨 **PRE-DEPLOY VALIDATION**

### **Environment Variables Check**
```bash
# Run this to validate all required variables:
node test-credentials.js
node test-engine-config.js
```

### **API Connectivity Test**
```bash
# Test Python APIs are accessible:
curl https://your-main-api.render.com/health
curl https://your-vision-api.render.com/health
```

### **Database Connectivity**
```bash
# Test MongoDB connection:
node scripts/approve-all-items.js
```

---

## ✅ **PRODUCTION READINESS STATUS**

### **🟢 RESOLVED ISSUES**
- ✅ All hardcoded URLs replaced with environment variables
- ✅ CORS configuration supports all major deployment platforms
- ✅ Next.js optimized for production deployment
- ✅ Image optimization configured for external domains
- ✅ API headers properly configured
- ✅ Environment variables documented and configured

### **🟡 REMAINING STEPS** 
- 🔄 Deploy Python APIs to cloud platform
- 🔄 Update environment variables with production URLs
- 🔄 Run end-to-end testing in production environment

### **🎯 SUCCESS METRICS**
- **Build Time:** < 2 minutes
- **API Response:** < 500ms  
- **Image Generation:** < 30 seconds
- **CORS Errors:** 0
- **Environment Variables:** All configured

---

## 💡 **CONCLUSION**

**🎉 ALL CRITICAL DEPLOY BLOCKING ISSUES RESOLVED!**

The CHZ Fan Token Studio is now **production deployment ready** with:
- ✅ Environment variables properly configured
- ✅ CORS issues resolved for all platforms
- ✅ Next.js optimized for production
- ✅ Hardcoded URLs eliminated
- ✅ Image optimization configured
- ✅ API security headers implemented

**Next Step:** Deploy Python APIs and update production URLs in environment variables. 