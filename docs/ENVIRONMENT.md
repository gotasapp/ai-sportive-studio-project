# Environment Configuration Guide

This document provides a comprehensive guide for configuring all required environment variables for the CHZ Fantoken Studio project.

## Table of Contents

1. [Overview](#overview)
2. [Required Environment Variables](#required-environment-variables)
3. [Optional Environment Variables](#optional-environment-variables)
4. [Environment Setup by Service](#environment-setup-by-service)
5. [Deployment Configuration](#deployment-configuration)
6. [Security Best Practices](#security-best-practices)
7. [Troubleshooting](#troubleshooting)

## Overview

The project requires environment variables for:
- **Database**: MongoDB Atlas connection
- **Blockchain**: Thirdweb SDK, Engine, and smart contracts
- **AI Services**: OpenAI API for content generation
- **Storage**: Cloudinary for images, IPFS/Pinata for metadata
- **Network Configuration**: RPC URLs and contract addresses

## Required Environment Variables

### Database Configuration

```env
# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB_NAME=chz-app-db
```

### Thirdweb SDK & Blockchain

```env
# Thirdweb Core Configuration
THIRDWEB_SECRET_KEY=your_thirdweb_secret_key_here
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id_here

# Backend Wallet (for gasless transactions)
BACKEND_WALLET_ADDRESS=0xYourBackendWalletAddress
BACKEND_WALLET_PRIVATE_KEY=your_backend_wallet_private_key_here

# Network Configuration
NEXT_PUBLIC_POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
```

### Smart Contract Addresses

```env
# NFT Collection Contracts
NEXT_PUBLIC_NFT_COLLECTION_CONTRACT_ADDRESS=0xContractAddressHere
NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET=0xContractAddressHere

# Launchpad Contract
NEXT_PUBLIC_LAUNCHPAD_CONTRACT_ADDRESS=0xLaunchpadContractAddress
```

### AI Generation Services

```env
# OpenAI API for DALL-E 3 & GPT-4 Vision
OPENAI_API_KEY=sk-your_openai_api_key_here
```

### Image & Metadata Storage

```env
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# IPFS/Pinata Configuration
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_token
NEXT_PUBLIC_PINATA_GATEWAY=gateway.pinata.cloud
```

## Optional Environment Variables

### Thirdweb Engine (for gasless transactions)

```env
# Engine Configuration
ENGINE_URL=https://your-engine-instance.thirdweb.com
VAULT_ACCESS_TOKEN=your_vault_access_token
NEXT_PUBLIC_ENGINE_URL=https://your-engine-instance.thirdweb.com
NEXT_PUBLIC_THIRDWEB_SECRET_KEY=your_thirdweb_secret_key
```

### Additional Contract Addresses

```env
# Alternative Networks (if using mainnet)
NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON=0xMainnetContractAddress
NEXT_PUBLIC_NFT_DROP_CONTRACT_CHZ_TESTNET=0xCHZTestnetAddress
NEXT_PUBLIC_NFT_DROP_CONTRACT_CHZ=0xCHZMainnetAddress

# Edition Contracts (ERC-1155)
NEXT_PUBLIC_NFT_EDITION_CONTRACT_POLYGON_TESTNET=0xEditionContractAddress
NEXT_PUBLIC_NFT_EDITION_CONTRACT_POLYGON=0xMainnetEditionAddress
```

### Marketplace Configuration

```env
# Marketplace Contract (Thirdweb Marketplace V3)
NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS=0xMarketplaceContractAddress
```

## Environment Setup by Service

### 1. MongoDB Atlas Setup

1. Create a MongoDB Atlas cluster
2. Get connection string from Atlas dashboard
3. Replace `<username>`, `<password>`, and `<cluster>` in URI
4. Ensure IP whitelist includes your deployment IPs

**Required Collections:**
- `users` - User profiles and settings
- `nfts` - NFT metadata and ownership
- `custom_collections` - User-created collections
- `launchpad_collections` - Launchpad collections
- `launchpad_collection_mints` - Minted launchpad NFTs
- `badges`, `jerseys`, `stadiums` - Standard NFT categories

### 2. Thirdweb Configuration

1. **Create Thirdweb Account**: https://thirdweb.com/dashboard
2. **Get API Keys**:
   - Client ID: From dashboard settings
   - Secret Key: For backend operations
3. **Deploy Contracts**:
   - NFT Drop (ERC-721): For unique NFTs
   - Edition Drop (ERC-1155): For limited editions
   - Marketplace V3: For trading functionality
4. **Engine Setup** (optional):
   - Deploy Engine instance for gasless transactions
   - Configure backend wallet for sponsoring gas

### 3. OpenAI API Setup

1. Create OpenAI account: https://platform.openai.com/
2. Generate API key from dashboard
3. Ensure sufficient credits for DALL-E 3 generation
4. Configure usage limits and monitoring

### 4. Cloudinary Setup

1. Create Cloudinary account: https://cloudinary.com/
2. Get cloud name, API key, and secret from dashboard
3. Configure upload presets and transformations
4. Set up folder structure for NFT categories

### 5. IPFS/Pinata Setup

1. Create Pinata account: https://pinata.cloud/
2. Generate JWT token for API access
3. Configure gateway preferences
4. Set up folders for metadata organization

## Deployment Configuration

### Development Environment (.env.local)

```env
# Use testnet configurations
NODE_ENV=development
NEXT_PUBLIC_ENVIRONMENT=development

# MongoDB local or development cluster
MONGODB_URI=mongodb+srv://dev-user:password@dev-cluster.mongodb.net/chz-app-dev

# Testnet contracts and cheaper operations
NEXT_PUBLIC_POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
NEXT_PUBLIC_LAUNCHPAD_CONTRACT_ADDRESS=0xTestnetLaunchpadAddress
```

### Production Environment (.env)

```env
# Use mainnet configurations
NODE_ENV=production
NEXT_PUBLIC_ENVIRONMENT=production

# Production MongoDB cluster
MONGODB_URI=mongodb+srv://prod-user:password@prod-cluster.mongodb.net/chz-app-prod

# Mainnet contracts and production settings
# (Update with actual mainnet addresses when deploying)
```

### Vercel Deployment

1. **Environment Variables**: Add all required variables in Vercel dashboard
2. **Build Command**: `npm run build`
3. **Output Directory**: `.next`
4. **Node Version**: 18.x or higher

#### Critical Vercel Settings:
```
# Build & Development Settings
Build Command: npm run build
Output Directory: .next
Install Command: npm install
Development Command: npm run dev

# Environment Variables
Add all variables from Required section above
Use "Production" environment for main branch
Use "Development" environment for preview branches
```

### Render Backend Deployment

1. **Repository**: Connect GitHub repository
2. **Build Command**: `cd jersey-generator-ai && npm install`
3. **Start Command**: `cd jersey-generator-ai && npm start`
4. **Environment**: Node.js

## Security Best Practices

### 1. Secret Management

- **Never commit** `.env` files to version control
- Use different keys for development/production environments
- Rotate API keys regularly
- Monitor API usage and set up alerts

### 2. Wallet Security

- **Backend Wallet**: Use dedicated wallet for backend operations only
- **Private Keys**: Store securely, never in client-side code
- **Permissions**: Limit backend wallet permissions to required functions only
- **Monitoring**: Set up transaction monitoring and alerts

### 3. API Key Protection

- **Client vs Server**: Use public keys for client-side, secrets for server-side
- **Rate Limiting**: Implement API rate limiting for OpenAI and other services
- **CORS**: Configure proper CORS settings for production
- **Validation**: Validate all environment variables on startup

### 4. Database Security

- **Connection**: Use connection pooling and proper timeout settings
- **Authentication**: Use strong passwords and enable 2FA on MongoDB Atlas
- **Network**: Whitelist only necessary IP addresses
- **Backup**: Configure automated backups and test restore procedures

## Troubleshooting

### Common Issues

#### 1. "Invalid/Missing environment variable: MONGODB_URI"
**Solution**: Check MongoDB connection string format and credentials

#### 2. "getContract validation error - invalid address"
**Solution**: Verify contract addresses are correct for the target network

#### 3. "OpenAI API error: Insufficient credits"
**Solution**: Add credits to OpenAI account or check usage limits

#### 4. "Cloudinary upload failed"
**Solution**: Verify API credentials and upload preset configuration

#### 5. "IPFS upload failed"
**Solution**: Check Pinata JWT token and gateway configuration

### Environment Validation

Add this check in your application startup:

```typescript
// Environment validation function
function validateEnvironment() {
  const required = [
    'MONGODB_URI',
    'THIRDWEB_SECRET_KEY',
    'NEXT_PUBLIC_THIRDWEB_CLIENT_ID',
    'BACKEND_WALLET_ADDRESS',
    'OPENAI_API_KEY',
    'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'NEXT_PUBLIC_PINATA_JWT'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
```

### Network Configuration Testing

Test network connectivity:

```bash
# Test MongoDB connection
curl -i "mongodb+srv://your-connection-string"

# Test RPC endpoint
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  https://rpc-amoy.polygon.technology

# Test Cloudinary
curl -X GET "https://res.cloudinary.com/your-cloud-name/image/upload/sample"

# Test Pinata Gateway
curl -X GET "https://gateway.pinata.cloud/ipfs/test-hash"
```

## Environment Variables Checklist

- [ ] MongoDB URI and database name configured
- [ ] Thirdweb client ID and secret key added
- [ ] Backend wallet address and private key set
- [ ] Smart contract addresses for target network
- [ ] OpenAI API key with sufficient credits
- [ ] Cloudinary credentials and cloud name
- [ ] Pinata JWT token and gateway URL
- [ ] RPC URLs for blockchain networks
- [ ] All variables added to deployment platform
- [ ] Production and development environments separated
- [ ] Environment validation implemented in application

---

**Note**: Always use testnet configurations during development to avoid unnecessary costs and mainnet transaction fees. Switch to mainnet configurations only when ready for production deployment.
