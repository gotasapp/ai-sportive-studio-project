# Testing Guide

This document provides comprehensive testing instructions for all major functionalities of the CHZ Fantoken Studio project.

## Table of Contents

1. [Overview](#overview)
2. [Test Environment Setup](#test-environment-setup)
3. [Frontend Testing](#frontend-testing)
4. [API Testing](#api-testing)
5. [Blockchain Integration Testing](#blockchain-integration-testing)
6. [End-to-End User Flows](#end-to-end-user-flows)
7. [Performance Testing](#performance-testing)
8. [Security Testing](#security-testing)
9. [Automated Testing](#automated-testing)
10. [Troubleshooting Tests](#troubleshooting-tests)

## Overview

The testing strategy covers:
- **Frontend Components**: UI/UX functionality
- **API Endpoints**: Backend services and data flow
- **Blockchain Integration**: Minting, trading, and marketplace
- **User Flows**: Complete user journeys
- **Performance**: Load and response times
- **Security**: Authentication and authorization

## Test Environment Setup

### Prerequisites

```bash
# Clone and install dependencies
git clone [repository]
cd jersey-generator-ai
npm install

# Setup environment variables
cp .env.example .env.local
# Configure all required environment variables
```

### Test Database Setup

```bash
# Use separate test database
MONGODB_URI=mongodb+srv://test-user:password@test-cluster.mongodb.net/chz-app-test
```

### Test Wallet Configuration

```bash
# Use testnet wallets only
USE_TESTNET=true
USE_POLYGON=false  # or true for Polygon Amoy

# Test wallet with sufficient funds
BACKEND_WALLET_ADDRESS=0xTestWalletAddress
BACKEND_WALLET_PRIVATE_KEY=test_private_key
```

## Frontend Testing

### 1. Component Testing

#### Jersey Generator
```bash
# Test Steps:
1. Navigate to /jerseys
2. Select team (e.g., "Flamengo")
3. Choose style (modern, retro, etc.)
4. Enter player name and number
5. Click "Generate Jersey"
6. Verify AI generation works
7. Test image preview and editing
8. Test mint functionality

# Expected Results:
✅ Jersey generates successfully
✅ Image preview loads correctly
✅ Mint button becomes enabled
✅ Transaction initiates properly
```

#### Stadium Generator
```bash
# Test Steps:
1. Navigate to /stadiums
2. Select team stadium
3. Choose atmosphere type
4. Generate stadium image
5. Test customization options
6. Mint stadium NFT

# Expected Results:
✅ Stadium generates with correct team branding
✅ Atmosphere effects apply correctly
✅ Mint process completes successfully
```

#### Badge Generator
```bash
# Test Steps:
1. Navigate to /badges
2. Select team
3. Enter badge details
4. Generate badge
5. Test mint process

# Expected Results:
✅ Badge generates with team colors
✅ Text and graphics render properly
✅ NFT mints to correct wallet
```

### 2. Marketplace Testing

#### Browse Marketplace
```bash
# Test Steps:
1. Navigate to /marketplace
2. Test category filters (jerseys, stadiums, badges)
3. Test team filters
4. Test price sorting
5. Test search functionality
6. Click on individual NFTs

# Expected Results:
✅ All categories display correctly
✅ Filters work properly
✅ Search returns relevant results
✅ NFT details load completely
```

#### Buy/Sell Flow
```bash
# Test Steps:
1. Connect wallet
2. Navigate to owned NFT
3. Click "List for Sale"
4. Set price and create listing
5. Verify listing appears in marketplace
6. Test purchasing flow with different wallet

# Expected Results:
✅ Listing creates successfully
✅ NFT appears in marketplace
✅ Purchase completes and transfers ownership
✅ Seller receives payment
```

### 3. Launchpad Testing

#### Create Collection
```bash
# Test Steps:
1. Navigate to /launchpad
2. Click "Create Collection"
3. Fill collection details
4. Upload collection image
5. Set mint parameters
6. Deploy collection

# Expected Results:
✅ Collection creates successfully
✅ Smart contract deploys
✅ Collection appears in launchpad
✅ Mint functionality works
```

#### Mint from Launchpad
```bash
# Test Steps:
1. Browse launchpad collections
2. Select active collection
3. Click "Mint NFT"
4. Complete transaction
5. Verify NFT in wallet

# Expected Results:
✅ Mint transaction succeeds
✅ NFT appears in user wallet
✅ Collection mint count updates
✅ Metadata loads correctly
```

### 4. User Profile Testing

#### Profile Management
```bash
# Test Steps:
1. Connect wallet
2. Navigate to /profile
3. Edit profile information
4. Upload avatar
5. Save changes
6. Verify updates persist

# Expected Results:
✅ Profile updates save correctly
✅ Avatar uploads successfully
✅ Changes reflect across app
✅ Data persists after refresh
```

## API Testing

### 1. Manual API Testing

#### Authentication Endpoints
```bash
# Test user profile creation
curl -X POST http://localhost:3000/api/users/0xWalletAddress \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","bio":"Test bio"}'

# Test user profile retrieval
curl -X GET http://localhost:3000/api/users/0xWalletAddress
```

#### NFT Generation Endpoints
```bash
# Test jersey generation
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Flamengo jersey, modern style, red and black",
    "teamName": "Flamengo",
    "playerName": "Test Player",
    "playerNumber": "10"
  }'

# Test image upload
curl -X POST http://localhost:3000/api/upload \
  -F "file=@test-image.jpg"
```

#### Marketplace Endpoints
```bash
# Test marketplace NFTs retrieval
curl -X GET "http://localhost:3000/api/marketplace/nfts?category=jerseys&limit=10"

# Test collection units
curl -X GET "http://localhost:3000/api/marketplace/collection-units?collectionId=123&category=launchpad"
```

#### Launchpad Endpoints
```bash
# Test launchpad collections
curl -X GET http://localhost:3000/api/launchpad/collections

# Test launchpad mint
curl -X POST http://localhost:3000/api/launchpad/mint \
  -H "Content-Type: application/json" \
  -d '{"to":"0xWalletAddress","collectionId":"123"}'
```

### 2. API Response Validation

#### Success Response Format
```json
{
  "success": true,
  "data": {...},
  "message": "Operation completed successfully"
}
```

#### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Blockchain Integration Testing

### 1. Minting Tests

#### Standard NFT Mint
```bash
# Test Steps:
1. Generate NFT content
2. Upload to IPFS
3. Create metadata
4. Initiate mint transaction
5. Verify on blockchain
6. Check wallet balance

# Verification Commands:
# Check transaction on explorer
https://amoy.polygonscan.com/tx/[transaction-hash]

# Verify NFT ownership
curl -X POST https://rpc-amoy.polygon.technology \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"eth_call",
    "params":[{
      "to":"0xContractAddress",
      "data":"0x6352211e[tokenId-hex]"
    },"latest"],
    "id":1
  }'
```

#### Gasless Mint (Engine)
```bash
# Test Steps:
1. Configure Thirdweb Engine
2. Test backend wallet balance
3. Initiate gasless mint
4. Verify transaction success
5. Confirm user receives NFT

# Engine Status Check:
curl -X GET "https://engine.thirdweb.com/transaction/status/[queueId]" \
  -H "Authorization: Bearer [access-token]"
```

### 2. Marketplace Tests

#### Listing Creation
```bash
# Test Steps:
1. Approve marketplace contract
2. Create listing
3. Verify listing on-chain
4. Check marketplace UI updates

# Verify Listing:
curl -X POST https://rpc-amoy.polygon.technology \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"eth_call",
    "params":[{
      "to":"0xMarketplaceAddress",
      "data":"0x[getListing-signature][listingId-hex]"
    },"latest"],
    "id":1
  }'
```

#### Purchase Transaction
```bash
# Test Steps:
1. Find active listing
2. Approve payment token (if needed)
3. Execute buy transaction
4. Verify ownership transfer
5. Confirm payment transfer

# Check NFT Transfer:
# Verify new owner in contract
# Check previous owner no longer owns NFT
# Confirm marketplace listing is removed
```

### 3. Contract Interaction Tests

#### Claim Conditions
```bash
# Test Steps:
1. Set claim conditions
2. Test different claim phases
3. Verify wallet limits
4. Test allowlist functionality

# Test Commands:
# Check claim conditions
# Verify phase transitions
# Test exceeding wallet limit
# Validate allowlist addresses
```

## End-to-End User Flows

### 1. Complete Creator Journey

```bash
# Flow: Generate → Mint → List → Sell
1. User connects wallet
2. Generates jersey with custom details
3. Mints NFT with gasless transaction
4. Lists NFT on marketplace
5. Another user purchases NFT
6. Creator receives royalties

# Validation Points:
✅ Wallet connection successful
✅ Content generation works
✅ Gasless mint completes
✅ Listing appears in marketplace
✅ Purchase transfers ownership
✅ Royalties distributed correctly
```

### 2. Complete Collector Journey

```bash
# Flow: Browse → Buy → Trade → Profile
1. User browses marketplace
2. Filters by preferred team/category
3. Purchases desired NFT
4. Views NFT in profile
5. Re-lists for higher price
6. Tracks portfolio value

# Validation Points:
✅ Marketplace browsing works
✅ Filters return correct results
✅ Purchase completes successfully
✅ Profile shows owned NFTs
✅ Re-listing functionality works
✅ Portfolio tracking accurate
```

### 3. Launchpad Creator Flow

```bash
# Flow: Create Collection → Deploy → Launch → Mint
1. Creator designs collection concept
2. Fills launchpad application
3. Deploys collection contract
4. Sets up claim conditions
5. Launches public mint
6. Monitors mint progress

# Validation Points:
✅ Collection creation successful
✅ Contract deployment works
✅ Claim conditions set correctly
✅ Public mint functions properly
✅ Progress tracking accurate
```

## Performance Testing

### 1. Load Testing

#### API Endpoints
```bash
# Install artillery for load testing
npm install -g artillery

# Test API performance
artillery run load-test-config.yml

# Example load test config:
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "API Load Test"
    requests:
      - get:
          url: "/api/marketplace/nfts"
      - get:
          url: "/api/launchpad/collections"
```

#### Frontend Performance
```bash
# Use Lighthouse for performance audit
npx lighthouse http://localhost:3000 --output=json

# Key Metrics to Monitor:
- First Contentful Paint (FCP) < 2s
- Largest Contentful Paint (LCP) < 2.5s
- Cumulative Layout Shift (CLS) < 0.1
- Time to Interactive (TTI) < 3.5s
```

### 2. Database Performance

#### Query Performance
```bash
# Monitor MongoDB performance
# Check slow queries in MongoDB Atlas
# Verify indexes are being used

# Example performance checks:
db.nfts.explain("executionStats").find({owner: "0xAddress"})
db.collections.explain("executionStats").find({status: "active"})
```

## Security Testing

### 1. Authentication Testing

#### Wallet Authentication
```bash
# Test Steps:
1. Test with valid wallet signature
2. Test with invalid signature
3. Test replay attack prevention
4. Test session expiration

# Expected Results:
✅ Valid signatures authenticate
❌ Invalid signatures rejected
❌ Replay attacks blocked
✅ Sessions expire correctly
```

#### API Security
```bash
# Test unauthorized access
curl -X POST http://localhost:3000/api/admin/users
# Should return 401 Unauthorized

# Test input validation
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"<script>alert(1)</script>"}'
# Should sanitize input
```

### 2. Smart Contract Security

#### Contract Permissions
```bash
# Test Steps:
1. Verify only owner can mint
2. Test marketplace permissions
3. Validate transfer restrictions
4. Check upgrade controls

# Security Checklist:
✅ Proper access controls
✅ Reentrancy protection
✅ Integer overflow protection
✅ Input validation
```

## Automated Testing

### 1. Unit Tests

```bash
# Run unit tests
npm run test

# Run with coverage
npm run test:coverage

# Test specific components
npm run test -- --testPathPattern=components/marketplace
```

### 2. Integration Tests

```bash
# Setup test environment
npm run test:setup

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

### 3. Continuous Testing

```bash
# GitHub Actions workflow example
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test
      - run: npm run test:integration
```

## Troubleshooting Tests

### Common Test Issues

#### 1. "Network connection failed"
```bash
# Check RPC endpoints
curl -X POST https://rpc-amoy.polygon.technology \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"net_version","params":[],"id":1}'

# Verify environment variables
echo $NEXT_PUBLIC_POLYGON_AMOY_RPC_URL
```

#### 2. "Transaction failed"
```bash
# Check wallet balance
# Verify contract addresses
# Check gas settings
# Review transaction logs
```

#### 3. "API timeout"
```bash
# Check MongoDB connection
# Verify external API keys
# Review server logs
# Check rate limiting
```

#### 4. "Image generation failed"
```bash
# Verify OpenAI API key
# Check image upload limits
# Review Cloudinary configuration
# Test IPFS connectivity
```

### Test Data Management

#### Reset Test Environment
```bash
# Clear test database
mongo "mongodb+srv://test-cluster.mongodb.net/chz-app-test" \
  --eval "db.dropDatabase()"

# Reset test wallets
# Clear uploaded images
# Reset contract state (if using local testnet)
```

#### Seed Test Data
```bash
# Create test users
# Generate sample NFTs
# Setup test collections
# Create sample listings

# Example seed script
npm run seed:test-data
```

## Test Reporting

### Generate Test Reports

```bash
# Performance report
npm run test:performance > performance-report.txt

# Security audit
npm audit --audit-level=moderate

# Code coverage
npm run test:coverage -- --coverageReporters=lcov

# API documentation testing
npm run test:api-docs
```

### Test Metrics to Track

- **API Response Times**: < 500ms average
- **Page Load Times**: < 2s first load
- **Transaction Success Rate**: > 95%
- **Error Rate**: < 1%
- **Test Coverage**: > 80%
- **Security Score**: No high/critical issues

---

**Note**: Always run tests in a safe environment with test wallets and test networks. Never use real funds or production data for testing.
