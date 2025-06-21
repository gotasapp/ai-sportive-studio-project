# 🚀 AI Sports NFT Generator - Deployment Guide

## Overview
This guide will help you deploy the AI Sports NFT Generator so other participants can access and test the live application.

## Architecture
- **Frontend**: Next.js (React) application
- **Backend APIs**: Python services (Jersey Generator + Stadium Generator)
- **Blockchain**: Thirdweb integration with CHZ and Polygon networks
- **AI Services**: DALL-E 3 for image generation
- **Storage**: IPFS via Pinata

## 🎯 Deployment Strategy

### Option 1: Full Production Deploy (Recommended)
- **Frontend**: Vercel (free, easy Next.js deployment)
- **Backend APIs**: Railway or Render (Python hosting)
- **Database**: PostgreSQL (for Engine, if using gasless mints)

### Option 2: Demo Deploy (Quick & Free)
- **Frontend**: Vercel
- **Backend APIs**: Temporarily on local/VPS
- **Use testnet only** (free tokens, no real cost)

## 📋 Pre-Deployment Checklist

### 1. Environment Variables Setup
Create `.env.local` with production values:

```env
# Required for Production
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-reown-project-id
OPENAI_API_KEY=your-openai-api-key
NEXT_PUBLIC_PINATA_JWT=your-pinata-jwt
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your-thirdweb-client-id

# Production API URLs (update these)
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
NEXT_PUBLIC_STADIUM_API_URL=https://your-backend-domain.com:8004

# Use Testnet for Demo (Free Tokens)
NEXT_PUBLIC_USE_TESTNET=true
NEXT_PUBLIC_USE_POLYGON=true

# Existing Working Contracts (Polygon Amoy)
NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET=0x7822698cE3728Ccd54e36E60c413a70b665A1407
```

### 2. Fix Hardcoded URLs
Update these files for production:

#### Fix `src/lib/services/stadium-service.ts`:
```typescript
private baseUrl = process.env.NEXT_PUBLIC_STADIUM_API_URL || 'http://localhost:8004';
```

#### Verify `src/lib/services/dalle3-service.ts`:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
```

## 🌐 Step-by-Step Deployment

### Step 1: Frontend Deployment (Vercel)

1. **Push to GitHub** (if not already):
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin master
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Set environment variables in Vercel dashboard
   - Deploy automatically

3. **Set Environment Variables in Vercel**:
   ```
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
   NEXT_PUBLIC_PINATA_JWT
   NEXT_PUBLIC_THIRDWEB_CLIENT_ID
   NEXT_PUBLIC_API_URL
   NEXT_PUBLIC_STADIUM_API_URL
   NEXT_PUBLIC_USE_TESTNET=true
   NEXT_PUBLIC_USE_POLYGON=true
   NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET=0x7822698cE3728Ccd54e36E60c413a70b665A1407
   ```

### Step 2: Backend Deployment (Railway/Render)

#### Option A: Railway (Recommended)
1. Go to [railway.app](https://railway.app)
2. Create new project
3. Deploy from GitHub
4. Add environment variables:
   ```
   OPENAI_API_KEY=your-key
   PORT=8000
   ```

#### Option B: Render
1. Go to [render.com](https://render.com)
2. Create new Web Service
3. Connect your repository
4. Configure:
   - Build Command: `cd api && pip install -r requirements.txt`
   - Start Command: `cd api && python jersey_api_dalle3.py`

### Step 3: Update Frontend URLs
After backend is deployed, update in Vercel:
```
NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app
NEXT_PUBLIC_STADIUM_API_URL=https://your-railway-app.railway.app
```

## 🔧 Quick Fix for Immediate Testing

If you need to show the app working **right now**, here's a quick solution:

### 1. Fix Stadium Service URL
```typescript
// src/lib/services/stadium-service.ts
private baseUrl = process.env.NEXT_PUBLIC_STADIUM_API_URL || 'http://localhost:8004';
```

### 2. Deploy Frontend Only
- Deploy to Vercel with localhost backend URLs
- Run backend APIs locally
- Use ngrok to expose local APIs to internet

### 3. Using ngrok (Temporary Solution)
```bash
# Terminal 1: Start Jersey API
cd api && python jersey_api_dalle3.py

# Terminal 2: Start Stadium API  
cd api && python stadium_reference_api.py

# Terminal 3: Expose Jersey API
ngrok http 8000

# Terminal 4: Expose Stadium API
ngrok http 8004
```

Then update Vercel environment variables with ngrok URLs.

## 🚨 Critical Issues to Fix

### 1. Stadium Service Hardcoded URL
**URGENT**: `src/lib/services/stadium-service.ts` has hardcoded localhost

### 2. CORS Configuration
Backend APIs need CORS for production:
```python
from flask_cors import CORS
CORS(app, origins=["https://your-vercel-app.vercel.app"])
```

### 3. Environment-Based Configuration
All APIs should read from environment variables.

## 🧪 Testing Checklist

Once deployed, test these features:
- [ ] Wallet connection works
- [ ] Jersey generation works
- [ ] Stadium generation works
- [ ] Mint functionality works (testnet)
- [ ] Admin panel loads
- [ ] All pages responsive

## 🔗 Service Accounts Needed

### Free Accounts Required:
1. **Reown** (WalletConnect): [cloud.reown.com](https://cloud.reown.com)
2. **Pinata** (IPFS): [app.pinata.cloud](https://app.pinata.cloud)
3. **Thirdweb**: [thirdweb.com/dashboard](https://thirdweb.com/dashboard)
4. **OpenAI**: [platform.openai.com](https://platform.openai.com)
5. **Vercel**: [vercel.com](https://vercel.com)
6. **Railway**: [railway.app](https://railway.app)

## 🆘 Emergency Deploy Solution

If you need it working **in 30 minutes**:

1. **Fix the stadium service URL** (critical bug)
2. **Deploy frontend to Vercel** 
3. **Use ngrok for backend APIs** (temporary)
4. **Test with testnet only** (free)

This will give you a working demo that others can access immediately.

## 📞 Next Steps

1. Fix the hardcoded URLs (highest priority)
2. Deploy frontend to Vercel
3. Choose backend hosting solution
4. Test all functionality
5. Share the live URL with participants

Would you like me to start with the urgent fixes first? 