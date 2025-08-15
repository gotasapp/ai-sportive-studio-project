# 🔧 VARIÁVEIS DE AMBIENTE NECESSÁRIAS PARA CHZ

## 🎯 VARIÁVEIS OBRIGATÓRIAS PARA CHZ FUNCIONAR:

### 🟢 **CONTRATOS CHZ (ESSENCIAIS)**
```env
# 🏪 MARKETPLACE CHZ - OBRIGATÓRIO
NEXT_PUBLIC_MARKETPLACE_CONTRACT_CHZ=0x...

# 💎 NFT DROP CHZ - OBRIGATÓRIO  
NEXT_PUBLIC_NFT_DROP_CONTRACT_CHZ=0x...

# 🚀 LAUNCHPAD CHZ - OBRIGATÓRIO
NEXT_PUBLIC_LAUNCHPAD_CONTRACT_CHZ=0x...
```

### 🔐 **THIRDWEB & BACKEND (ESSENCIAIS)**
```env
# Cliente Thirdweb - OBRIGATÓRIO
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_client_id

# Secret key backend - OBRIGATÓRIO
THIRDWEB_SECRET_KEY=your_secret_key

# Wallet backend (mesma para CHZ e Amoy) - OBRIGATÓRIO
BACKEND_WALLET_PRIVATE_KEY=your_backend_wallet_private_key
BACKEND_WALLET_ADDRESS=your_backend_wallet_address
```

### 📊 **DATABASE & APIS (ESSENCIAIS)**
```env
# MongoDB - OBRIGATÓRIO
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# WalletConnect - OBRIGATÓRIO
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id-here

# Cloudinary (uploads) - OBRIGATÓRIO
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key  
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

### 🎨 **PYTHON API (ESSENCIAL PARA GERAÇÃO)**
```env
# API Python (geração AI) - OBRIGATÓRIO
NEXT_PUBLIC_API_URL=https://your-api-render.onrender.com
OPENAI_API_KEY=your_openai_api_key
```

---

## 🟡 VARIÁVEIS OPCIONAIS (MELHORIAS)

### 📍 **IPFS (OPCIONAL MAS RECOMENDADO)**
```env
# Pinata IPFS - OPCIONAL
NEXT_PUBLIC_PINATA_JWT=your-pinata-jwt-here
NEXT_PUBLIC_PINATA_GATEWAY=your-gateway.mypinata.cloud
```

### ⚙️ **ENGINE THIRDWEB (OPCIONAL)**
```env
# Thirdweb Engine - OPCIONAL
ENGINE_URL=https://engine.thirdweb.com
ENGINE_ADMIN_KEY=your_engine_admin_key
VAULT_ACCESS_TOKEN=your_vault_access_token
```

### 🛡️ **ADMIN & ANALYTICS (OPCIONAL)**
```env
# Admin access - OPCIONAL
NEXT_PUBLIC_ADMIN_WALLET_ADDRESS=your_admin_wallet_address
NEXT_PUBLIC_ADMIN_EMAIL=admin@yourdomain.com

# Analytics - OPCIONAL
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_APP_DOMAIN=yourdomain.com
```

---

## 🔄 COMPATIBILIDADE AMOY (MANTER PARA SWITCH)

### 🟡 **CONTRATOS AMOY (PARA DEMONSTRAÇÃO)**
```env
# Marketplace Amoy (funcionando)
NEXT_PUBLIC_MARKETPLACE_CONTRACT=0x723436a84d57150A5109eFC540B2f0b2359Ac76d

# NFT Drop Amoy (funcionando)  
NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET=0xfF973a4aFc5A96DEc81366461A461824c4f80254

# Launchpad Amoy (funcionando)
NEXT_PUBLIC_LAUNCHPAD_CONTRACT_ADDRESS=0xfB233A36196a2a4513DB6b7d70C90ecaD0Eec639

# RPC Amoy (opcional)
NEXT_PUBLIC_POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
```

---

## 📋 TEMPLATE COMPLETO `.env`

```env
# ========================================
# 🎯 CONFIGURAÇÃO CHZ ESSENCIAL
# ========================================

# CONTRATOS CHZ (OBRIGATÓRIO)
NEXT_PUBLIC_MARKETPLACE_CONTRACT_CHZ=SEU_CONTRATO_MARKETPLACE_CHZ
NEXT_PUBLIC_NFT_DROP_CONTRACT_CHZ=SEU_CONTRATO_NFT_CHZ
NEXT_PUBLIC_LAUNCHPAD_CONTRACT_CHZ=SEU_CONTRATO_LAUNCHPAD_CHZ

# THIRDWEB (OBRIGATÓRIO)
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=SEU_CLIENT_ID
THIRDWEB_SECRET_KEY=SEU_SECRET_KEY

# BACKEND WALLET (OBRIGATÓRIO)
BACKEND_WALLET_PRIVATE_KEY=SUA_PRIVATE_KEY
BACKEND_WALLET_ADDRESS=SEU_WALLET_ADDRESS

# DATABASE (OBRIGATÓRIO)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# WALLETCONNECT (OBRIGATÓRIO)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=SEU_PROJECT_ID

# CLOUDINARY (OBRIGATÓRIO)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=SEU_CLOUD_NAME
CLOUDINARY_API_KEY=SEU_API_KEY  
CLOUDINARY_API_SECRET=SEU_API_SECRET

# PYTHON API (OBRIGATÓRIO)
NEXT_PUBLIC_API_URL=https://sua-api.onrender.com
OPENAI_API_KEY=SEU_OPENAI_KEY

# ========================================
# 🟡 AMOY COMPATIBILITY (DEMONSTRAÇÃO)
# ========================================

# CONTRATOS AMOY (FUNCIONANDO)
NEXT_PUBLIC_MARKETPLACE_CONTRACT=0x723436a84d57150A5109eFC540B2f0b2359Ac76d
NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET=0xfF973a4aFc5A96DEc81366461A461824c4f80254
NEXT_PUBLIC_LAUNCHPAD_CONTRACT_ADDRESS=0xfB233A36196a2a4513DB6b7d70C90ecaD0Eec639

# ========================================
# 📍 OPCIONAIS (MELHORIAS)
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

## ✅ CHECKLIST PARA CHZ:

### 🔥 **CRÍTICO (DEVE TER):**
- [ ] `NEXT_PUBLIC_MARKETPLACE_CONTRACT_CHZ` - Contrato marketplace CHZ
- [ ] `NEXT_PUBLIC_NFT_DROP_CONTRACT_CHZ` - Contrato NFT CHZ  
- [ ] `NEXT_PUBLIC_LAUNCHPAD_CONTRACT_CHZ` - Contrato launchpad CHZ
- [ ] `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` - Client ID Thirdweb
- [ ] `THIRDWEB_SECRET_KEY` - Secret key backend
- [ ] `BACKEND_WALLET_PRIVATE_KEY` - Private key wallet backend
- [ ] `MONGODB_URI` - Conexão database
- [ ] `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - WalletConnect
- [ ] `CLOUDINARY_*` - Upload de imagens
- [ ] `NEXT_PUBLIC_API_URL` - API Python geração

### 🟡 **IMPORTANTE (RECOMENDADO):**
- [ ] `NEXT_PUBLIC_PINATA_JWT` - IPFS storage
- [ ] `ENGINE_*` - Thirdweb Engine (gasless)
- [ ] `NEXT_PUBLIC_ADMIN_*` - Admin access

### 🟢 **OPCIONAL (NICE TO HAVE):**
- [ ] `NEXT_PUBLIC_ENABLE_ANALYTICS` - Analytics
- [ ] Variáveis Amoy (para demonstração)

---

## 🚨 VALIDAÇÃO AUTOMÁTICA:

O sistema validará automaticamente se as variáveis CHZ estão configuradas:

```javascript
// Logs automáticos no console:
🎯 NETWORK CONFIG LOADED: {
  network: 'Chiliz Chain',
  chainId: 88888,
  currency: 'CHZ',
  contracts: 3,
  isChz: true
}

❌ CONTRATOS OBRIGATÓRIOS FALTANDO! {
  network: 'Chiliz Chain',
  marketplace: undefined,  // ← PROBLEMA!
  nftDrop: undefined,      // ← PROBLEMA!
  launchpad: undefined     // ← PROBLEMA!
}
```

---

## 🎯 PRIORIDADES PARA ENTREGA:

### **HOJE (DEMO AMOY):**
✅ Manter `USE_CHZ_MAINNET = false`
✅ Usar contratos Amoy funcionando
✅ Demo perfeita

### **PRODUÇÃO CHZ:**
🎯 Configurar as 10 variáveis CHZ essenciais
🎯 Mudar `USE_CHZ_MAINNET = true`  
🎯 Deploy e pronto!

**Total: 10 variáveis obrigatórias + contratos CHZ = Sistema 100% CHZ! 🚀**
