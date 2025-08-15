# CHZ Mainnet Configuration Guide

This document explains how to configure the project to use **CHZ Mainnet** instead of Polygon Amoy testnet, including all required environment variables.

## Overview

The project has a configurable switch system that allows switching between different blockchain networks. By default, it's configured for **Polygon Amoy (testnet)**, but can be easily changed to **CHZ Mainnet**.

## Network Switch Configuration

### 1. Main Configuration File

In the `src/lib/config.ts` file, there are network control settings:

```typescript
// Network Configuration - To use CHZ Mainnet
const USE_TESTNET = false;  // ❌ Disable testnet
const USE_POLYGON = false;  // ❌ Disable Polygon
```

**For CHZ Mainnet, configure:**
```typescript
const USE_TESTNET = false;  // Use mainnet
const USE_POLYGON = false;  // Use CHZ instead of Polygon
```

### 2. Environment Variables for CHZ Mainnet

#### Core CHZ Configuration

```env
# CHZ Mainnet Network
USE_TESTNET=false
USE_POLYGON=false

# CHZ Mainnet RPC
NEXT_PUBLIC_CHZ_MAINNET_RPC_URL=https://rpc.ankr.com/chiliz
# or alternative:
# NEXT_PUBLIC_CHZ_MAINNET_RPC_URL=https://rpc.chiliz.com

# CHZ Chain ID
NEXT_PUBLIC_CHAIN_ID=88888
```

#### Smart Contract Addresses (CHZ Mainnet)

```env
# NFT Contracts on CHZ Mainnet
NEXT_PUBLIC_NFT_DROP_CONTRACT_CHZ=0xYourCHZMainnetContract
NEXT_PUBLIC_NFT_EDITION_CONTRACT_CHZ=0xYourCHZEditionContract
NEXT_PUBLIC_LAUNCHPAD_CONTRACT_ADDRESS=0xYourCHZLaunchpadContract

# Marketplace Contract on CHZ
NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS=0xYourCHZMarketplaceContract
```

#### Thirdweb Configuration

```env
# Thirdweb for CHZ Mainnet
THIRDWEB_SECRET_KEY=your_thirdweb_secret_key
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id

# Backend Wallet (CHZ Mainnet)
BACKEND_WALLET_ADDRESS=0xYourCHZMainnetBackendWallet
BACKEND_WALLET_PRIVATE_KEY=your_chz_mainnet_private_key
```

#### Database and Other Services (Unchanged)

```env
# MongoDB (same for all networks)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB_NAME=chz-app-db

# OpenAI (same for all networks)
OPENAI_API_KEY=sk-your_openai_api_key

# Cloudinary (same for all networks)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# IPFS/Pinata (same for all networks)
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_token
NEXT_PUBLIC_PINATA_GATEWAY=gateway.pinata.cloud
```

## Detailed Network Configuration

### CHZ Mainnet Network Details

```typescript
// CHZ Mainnet Configuration (src/lib/config.ts)
chz_mainnet: {
  chainId: 88888,
  name: 'Chiliz Chain',
  currency: 'CHZ',
  explorerUrl: 'https://scan.chiliz.com',
  rpcUrl: 'https://rpc.ankr.com/chiliz',
  faucet: null,
  isTestnet: false
}
```

### Smart Contracts That Need to be Deployed

To use CHZ Mainnet, you need to have the following contracts deployed:

1. **NFT Drop Contract (ERC-721)**: For unique NFTs
2. **NFT Edition Contract (ERC-1155)**: For limited editions  
3. **Launchpad Contract**: For drops system
4. **Marketplace Contract**: For NFT trading

### How to Deploy Contracts

1. **Via Thirdweb Dashboard**:
   - Access: https://thirdweb.com/dashboard
   - Select "Chiliz Chain" as network
   - Deploy required contracts
   - Copy addresses to environment variables

2. **Recommended Contracts**:
   - **ERC721Drop**: For unique NFTs with claim conditions
   - **ERC1155Drop**: For limited editions
   - **Marketplace V3**: For trading functionalities

## Environment Files by Environment

### Development (.env.local)
```env
# CHZ Testnet for development
USE_TESTNET=true
USE_POLYGON=false

NEXT_PUBLIC_CHZ_TESTNET_RPC_URL=https://spicy-rpc.chiliz.com
NEXT_PUBLIC_CHAIN_ID=88882

# Test contracts on CHZ Testnet
NEXT_PUBLIC_NFT_DROP_CONTRACT_CHZ_TESTNET=0xTestnetContract
NEXT_PUBLIC_LAUNCHPAD_CONTRACT_ADDRESS=0xTestnetLaunchpad
```

### Production (.env)
```env
# CHZ Mainnet for production
USE_TESTNET=false
USE_POLYGON=false

NEXT_PUBLIC_CHZ_MAINNET_RPC_URL=https://rpc.ankr.com/chiliz
NEXT_PUBLIC_CHAIN_ID=88888

# Real contracts on CHZ Mainnet
NEXT_PUBLIC_NFT_DROP_CONTRACT_CHZ=0xMainnetContract
NEXT_PUBLIC_LAUNCHPAD_CONTRACT_ADDRESS=0xMainnetLaunchpad
```

## Important Considerations

### 1. Transaction Costs
- **CHZ Mainnet**: Transactions cost real CHZ
- **CHZ Testnet**: Free CHZ via faucet
- Configure appropriately to avoid unnecessary costs

### 2. Backend Wallet
- Use a dedicated wallet for backend operations
- Maintain sufficient CHZ for gasless transactions
- Configure low balance alerts

### 3. Smart Contracts
- All contracts must be deployed on CHZ network
- Configure claim conditions appropriately
- Test all contracts before launch

### 4. IPFS and Metadata
- Metadata remains the same regardless of network
- IPFS URLs work on any blockchain
- Ensure metadata is accessible

## CHZ Migration Checklist

- [ ] Configure `USE_TESTNET=false` and `USE_POLYGON=false`
- [ ] Set CHZ Mainnet RPC URL
- [ ] Deploy smart contracts on CHZ Mainnet
- [ ] Configure contract addresses in env vars
- [ ] Configure backend wallet with CHZ
- [ ] Test mint, trade and all functionalities
- [ ] Configure monitoring and alerts
- [ ] Document contract addresses for the team

## CHZ Troubleshooting

### Common Issues

1. **"Network not supported"**
   - Check if `chainId: 88888` is configured
   - Confirm RPC URL is correct

2. **"Contract not found"**
   - Verify contracts are deployed on CHZ
   - Confirm addresses in environment variables

3. **"Insufficient CHZ for gas"**
   - Add CHZ to backend wallet
   - Configure low balance alerts

4. **"RPC Error"**
   - Try alternative RPC: `https://rpc.chiliz.com`
   - Check for rate limiting

### Test Commands

```bash
# Test CHZ Mainnet RPC
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
  https://rpc.ankr.com/chiliz

# Expected response: {"jsonrpc":"2.0","id":1,"result":"0x15b38"} (88888 in hex)

# Test backend wallet balance
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0xYourBackendWallet","latest"],"id":1}' \
  https://rpc.ankr.com/chiliz
```

## Useful Links

- **CHZ Explorer**: https://scan.chiliz.com
- **CHZ Faucet (Testnet)**: https://faucet.chiliz.com
- **Thirdweb Dashboard**: https://thirdweb.com/dashboard
- **CHZ Documentation**: https://docs.chiliz.com
- **Ankr RPC**: https://rpc.ankr.com/chiliz

---

**Note**: Always test on CHZ Testnet before deploying to mainnet. CHZ mainnet involves real transaction costs.
