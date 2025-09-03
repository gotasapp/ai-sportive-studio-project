# 🔧 ENVIRONMENT VARIABLES REQUIRED FOR CHZ

## 🎯 MANDATORY VARIABLES FOR CHZ TO WORK:

### 🟢 **CHZ CONTRACTS (ESSENTIAL)**
```env
# 🏪 CHZ MARKETPLACE - MANDATORY
NEXT_PUBLIC_MARKETPLACE_CONTRACT_CHZ=0x...

# 💎 CHZ NFT DROP - MANDATORY  
NEXT_PUBLIC_NFT_DROP_CONTRACT_CHZ=0x...

# 🚀 CHZ LAUNCHPAD - MANDATORY
NEXT_PUBLIC_LAUNCHPAD_CONTRACT_CHZ=0x...
```

### 🔐 **THIRDWEB & BACKEND (ESSENTIAL)**
```env
# Thirdweb Client - MANDATORY
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_client_id

# Backend secret key - MANDATORY
THIRDWEB_SECRET_KEY=your_secret_key

# Backend wallet (same for CHZ and Amoy) - MANDATORY
BACKEND_WALLET_PRIVATE_KEY=your_backend_wallet_private_key
BACKEND_WALLET_ADDRESS=your_backend_wallet_address
```

### 📊 **DATABASE & APIS (ESSENTIAL)**
```env
# MongoDB - MANDATORY
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# WalletConnect - MANDATORY
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id-here

# Cloudinary (uploads) - MANDATORY
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key  
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

### 🎨 **PYTHON API (ESSENTIAL FOR GENERATION)**
```env
# Python API (AI generation) - MANDATORY
NEXT_PUBLIC_API_URL=https://your-api-render.onrender.com
OPENAI_API_KEY=your_openai_api_key
```

---

## 🟡 OPTIONAL VARIABLES (IMPROVEMENTS)

### 📍 **IPFS (OPTIONAL BUT RECOMMENDED)**
```env
# Pinata IPFS - OPTIONAL
NEXT_PUBLIC_PINATA_JWT=your-pinata-jwt-here
NEXT_PUBLIC_PINATA_GATEWAY=your-gateway.mypinata.cloud
```

### ⚙️ **THIRDWEB ENGINE (OPTIONAL)**
```env
# Thirdweb Engine - OPTIONAL
ENGINE_URL=https://engine.thirdweb.com
ENGINE_ADMIN_KEY=your_engine_admin_key
VAULT_ACCESS_TOKEN=your_vault_access_token
```

### 🛡️ **ADMIN & ANALYTICS (OPTIONAL)**
```env
# Admin access - OPTIONAL
NEXT_PUBLIC_ADMIN_WALLET_ADDRESS=your_admin_wallet_address
NEXT_PUBLIC_ADMIN_EMAIL=admin@yourdomain.com

# Analytics - OPTIONAL
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_APP_DOMAIN=yourdomain.com
```

---

## 🔄 AMOY COMPATIBILITY (KEEP FOR SWITCHING)

### 🟡 **AMOY CONTRACTS (FOR DEMONSTRATION)**
```env
# Amoy Marketplace (working)
NEXT_PUBLIC_MARKETPLACE_CONTRACT=0x723436a84d57150A5109eFC540B2f0b2359Ac76d

# Amoy NFT Drop (working)  
NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET=0xfF973a4aFc5A96DEc81366461A461824c4f80254

# Amoy Launchpad (working)
NEXT_PUBLIC_LAUNCHPAD_CONTRACT_ADDRESS=0xfB233A36196a2a4513DB6b7d70C90ecaD0Eec639

# Amoy RPC (optional)
NEXT_PUBLIC_POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
```

---

## 📋 COMPLETE `.env` TEMPLATE

```env
# ========================================
# 🎯 ESSENTIAL CHZ CONFIGURATION
# ========================================

# CHZ CONTRACTS (MANDATORY)
NEXT_PUBLIC_MARKETPLACE_CONTRACT_CHZ=YOUR_CHZ_MARKETPLACE_CONTRACT
NEXT_PUBLIC_NFT_DROP_CONTRACT_CHZ=YOUR_CHZ_NFT_CONTRACT
NEXT_PUBLIC_LAUNCHPAD_CONTRACT_CHZ=YOUR_CHZ_LAUNCHPAD_CONTRACT

# THIRDWEB (MANDATORY)
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=YOUR_CLIENT_ID
THIRDWEB_SECRET_KEY=YOUR_SECRET_KEY

# BACKEND WALLET (MANDATORY)
BACKEND_WALLET_PRIVATE_KEY=YOUR_PRIVATE_KEY
BACKEND_WALLET_ADDRESS=YOUR_WALLET_ADDRESS

# DATABASE (MANDATORY)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# WALLETCONNECT (MANDATORY)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=YOUR_PROJECT_ID

# CLOUDINARY (MANDATORY)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=YOUR_CLOUD_NAME
CLOUDINARY_API_KEY=YOUR_API_KEY  
CLOUDINARY_API_SECRET=YOUR_API_SECRET

# PYTHON API (MANDATORY)
NEXT_PUBLIC_API_URL=https://your-api.onrender.com
OPENAI_API_KEY=YOUR_OPENAI_KEY

# ========================================
# 🟡 AMOY COMPATIBILITY (DEMONSTRATION)
# ========================================

# AMOY CONTRACTS (WORKING)
NEXT_PUBLIC_MARKETPLACE_CONTRACT=0x723436a84d57150A5109eFC540B2f0b2359Ac76d
NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET=0xfF973a4aFc5A96DEc81366461A461824c4f80254
NEXT_PUBLIC_LAUNCHPAD_CONTRACT_ADDRESS=0xfB233A36196a2a4513DB6b7d70C90ecaD0Eec639

# ========================================
# 📍 OPTIONAL (IMPROVEMENTS)
# ========================================

# IPFS
NEXT_PUBLIC_PINATA_JWT=your-pinata-jwt-here
NEXT_PUBLIC_PINATA_GATEWAY=your-gateway.mypinata.cloud

# ENGINE
ENGINE_URL=https://engine.thirdweb.com
ENGINE_ADMIN_KEY=your_engine_admin_key

# ADMIN
NEXT_PUBLIC_ADMIN_WALLET_ADDRESS=your_admin_wallet
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

---

## ✅ CHECKLIST FOR CHZ:

### 🔥 **CRITICAL (MUST HAVE):**
- [ ] `NEXT_PUBLIC_MARKETPLACE_CONTRACT_CHZ` - CHZ marketplace contract
- [ ] `NEXT_PUBLIC_NFT_DROP_CONTRACT_CHZ` - CHZ NFT contract  
- [ ] `NEXT_PUBLIC_LAUNCHPAD_CONTRACT_CHZ` - CHZ launchpad contract
- [ ] `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` - Thirdweb client ID
- [ ] `THIRDWEB_SECRET_KEY` - Backend secret key
- [ ] `BACKEND_WALLET_PRIVATE_KEY` - Backend wallet private key
- [ ] `MONGODB_URI` - Database connection
- [ ] `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - WalletConnect
- [ ] `CLOUDINARY_*` - Image uploads
- [ ] `NEXT_PUBLIC_API_URL` - Python generation API

### 🟡 **IMPORTANT (RECOMMENDED):**
- [ ] `NEXT_PUBLIC_PINATA_JWT` - IPFS storage
- [ ] `ENGINE_*` - Thirdweb Engine (gasless)
- [ ] `NEXT_PUBLIC_ADMIN_*` - Admin access

### 🟢 **OPTIONAL (NICE TO HAVE):**
- [ ] `NEXT_PUBLIC_ENABLE_ANALYTICS` - Analytics
- [ ] Amoy variables (for demonstration)

---

## 🚨 AUTOMATIC VALIDATION:

The system will automatically validate if CHZ variables are configured:

```javascript
// Automatic console logs:
🎯 NETWORK CONFIG LOADED: {
  network: 'Chiliz Chain',
  chainId: 88888,
  currency: 'CHZ',
  contracts: 3,
  isChz: true
}

❌ MANDATORY CONTRACTS MISSING! {
  network: 'Chiliz Chain',
  marketplace: undefined,  // ← PROBLEM!
  nftDrop: undefined,      // ← PROBLEM!
  launchpad: undefined     // ← PROBLEM!
}
```

---

## 🎯 PRIORITIES FOR DELIVERY:

### **TODAY (AMOY DEMO):**
✅ Keep `USE_CHZ_MAINNET = false`
✅ Use working Amoy contracts
✅ Perfect demo

### **CHZ PRODUCTION:**
🎯 Configure the 10 essential CHZ variables
🎯 Change `USE_CHZ_MAINNET = true`  
🎯 Deploy and ready!

**Total: 10 mandatory variables + CHZ contracts = 100% CHZ System! 🚀**
