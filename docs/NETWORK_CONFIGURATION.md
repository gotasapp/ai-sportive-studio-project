# 🎯 NETWORK CONFIGURATION - CHZ ↔ AMOY SWITCH

## 🚀 HOW TO SWITCH NETWORKS (SUPER SIMPLE!)

### ⚡ SINGLE STEP: 
**Edit just 1 line of code to switch everything!**

```typescript
// File: src/lib/network-config.ts
// Line 7:

export const USE_CHZ_MAINNET = false; // CHANGE HERE!

// false = Polygon Amoy (TESTNET) 
// true  = CHZ Mainnet (PRODUCTION)
```

**Done! The entire system changes automatically! 🎉**

---

## 🔧 WHAT HAPPENS WHEN YOU CHANGE:

### 🟡 AMOY MODE (`USE_CHZ_MAINNET = false`)
```
✅ Network: Polygon Amoy Testnet
✅ Currency: MATIC  
✅ Contracts: Your tested Amoy contracts
✅ Explorer: amoy.polygonscan.com
✅ RPC: rpc-amoy.polygon.technology
✅ Prices: "0.1 MATIC"
```

### 🟢 CHZ MODE (`USE_CHZ_MAINNET = true`)
```  
✅ Network: Chiliz Chain
✅ Currency: CHZ
✅ Contracts: Your deployed CHZ contracts  
✅ Explorer: scan.chiliz.com
✅ RPC: rpc.ankr.com/chiliz
✅ Prices: "0.1 CHZ"
```

---

## 📋 ENVIRONMENT VARIABLES NEEDED

### For CHZ to work, you need these variables in `.env`:

```env
# CHZ MAINNET CONTRACTS (you already have!)
NEXT_PUBLIC_MARKETPLACE_CONTRACT_CHZ=0x...
NEXT_PUBLIC_NFT_DROP_CONTRACT_CHZ=0x...  
NEXT_PUBLIC_LAUNCHPAD_CONTRACT_CHZ=0x...

# AMOY CONTRACTS (already working)
NEXT_PUBLIC_MARKETPLACE_CONTRACT=0x723436a84d57150A5109eFC540B2f0b2359Ac76d
NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET=0xfF973a4aFc5A96DEc81366461A461824c4f80254
NEXT_PUBLIC_LAUNCHPAD_CONTRACT_ADDRESS=0xfB233A36196a2a4513DB6b7d70C90ecaD0Eec639

# BACKEND (same wallet works for both networks!)
THIRDWEB_SECRET_KEY=your_thirdweb_secret_key
BACKEND_WALLET_PRIVATE_KEY=your_backend_wallet_private_key
```

---

## 🎯 FEATURES THAT CHANGE AUTOMATICALLY:

### 🏪 **MARKETPLACE**
- CHZ: Shows only NFTs from CHZ network
- Amoy: Shows only NFTs from Amoy network
- Prices change automatically (CHZ vs MATIC)

### 🚀 **LAUNCHPAD** 
- Automatic deploy on chosen network
- Automatic mint on chosen network
- Claim conditions configured automatically

### 💎 **UNIQUE NFT**
- Mint on chosen network
- Metadata saved with correct network
- Trading only on specific network

### 📊 **ANALYTICS**
- Stats separated by network
- Volume in native currency (CHZ or MATIC)
- Users filtered by network

---

## 🔄 CHANGE PROCESS:

### 1. **PREPARATION**
```bash
# Make sure you have CHZ contracts deployed
# Make sure you have CHZ environment variables
```

### 2. **CHANGE CONFIGURATION**
```typescript
// src/lib/network-config.ts
export const USE_CHZ_MAINNET = true; // CHZ MODE!
```

### 3. **DEPLOY**
```bash
npm run build
# Deploy on Vercel/your platform
```

### 4. **READY!**
```
✅ The entire system now runs on CHZ!
✅ Users only see CHZ NFTs
✅ Automatic mint on CHZ  
✅ Trading on CHZ
✅ Prices in CHZ
```

---

## 🛡️ SECURITY & VALIDATION:

### ✅ **THE SYSTEM AUTOMATICALLY VALIDATES:**
- If contracts exist
- If variables are configured
- If network is responding
- If backend wallet has funds

### 🚨 **AUTOMATIC LOGS:**
```
🎯 NETWORK CONFIG LOADED: {
  network: 'Chiliz Chain',
  chainId: 88888,
  currency: 'CHZ',  
  contracts: 3,
  isChz: true
}
```

---

## 🔍 DEBUGGING:

### **To check which network is active:**
```typescript
// In browser console:
console.log('Active network:', ACTIVE_NETWORK.name);
console.log('Chain ID:', ACTIVE_NETWORK.chainId);
console.log('Contracts:', ACTIVE_NETWORK.contracts);
```

### **Server logs show:**
```
⚙️ Using active chain: {
  name: 'Chiliz Chain',
  chainId: 88888,  
  currency: 'CHZ'
}
```

---

## 🎉 FINAL RESULT:

### **AMOY MODE (DEMONSTRATION):**
- ✅ Marketplace works with Amoy NFTs
- ✅ Demonstration video runs perfectly 
- ✅ All tests pass
- ✅ Client sees complete functionality

### **CHZ MODE (PRODUCTION):**
- ✅ Identical system, but on CHZ
- ✅ Same UX, same features
- ✅ Only network and currency change
- ✅ Ready for real use

---

## 💡 ADVANTAGES OF THIS APPROACH:

### 🔧 **FOR DEVELOPMENT:**
- 1 line of code to change everything
- Same code works for both networks  
- Easy debugging and testing
- No need to maintain 2 versions

### 👤 **FOR CLIENT:**
- Simple decision: CHZ or Amoy?
- Instant change
- No risk of errors
- Total flexibility

### 🚀 **FOR DEMONSTRATION:**
- Video works on Amoy (tested)
- Production on CHZ (same code)  
- Client sees it works on both
- Total confidence in system

---

**🎯 SUMMARY: With 1 line of code you control whether the entire system runs on CHZ or Amoy. Simple, safe and flexible!**
