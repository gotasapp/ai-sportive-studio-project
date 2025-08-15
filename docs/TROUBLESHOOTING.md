# Troubleshooting Guide

This comprehensive guide helps resolve common issues encountered in the CHZ Fantoken Studio project.

## Table of Contents

1. [General Troubleshooting](#general-troubleshooting)
2. [Frontend Issues](#frontend-issues)
3. [API & Backend Issues](#api--backend-issues)
4. [Blockchain & Wallet Issues](#blockchain--wallet-issues)
5. [Database Issues](#database-issues)
6. [AI Generation Issues](#ai-generation-issues)
7. [Deployment Issues](#deployment-issues)
8. [Performance Issues](#performance-issues)
9. [Environment Configuration Issues](#environment-configuration-issues)
10. [Debug Tools & Commands](#debug-tools--commands)

## General Troubleshooting

### Quick Diagnostic Steps

1. **Check Environment Variables**
   ```bash
   # Verify all required env vars are set
   node -e "console.log(process.env.MONGODB_URI ? '✅ MongoDB' : '❌ MongoDB missing')"
   node -e "console.log(process.env.THIRDWEB_SECRET_KEY ? '✅ Thirdweb' : '❌ Thirdweb missing')"
   node -e "console.log(process.env.OPENAI_API_KEY ? '✅ OpenAI' : '❌ OpenAI missing')"
   ```

2. **Check Network Connectivity**
   ```bash
   # Test external API connectivity
   curl -I https://api.openai.com/v1/models
   curl -I https://api.cloudinary.com/v1_1/test/ping
   curl -I https://gateway.pinata.cloud/ipfs/test
   ```

3. **Check Service Status**
   ```bash
   # Test MongoDB connection
   mongosh "mongodb+srv://your-connection-string" --eval "db.runCommand('ping')"
   
   # Test RPC endpoint
   curl -X POST https://rpc-amoy.polygon.technology \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
   ```

## Frontend Issues

### 1. "Application Not Loading"

#### Symptoms
- Blank white screen
- Loading spinner indefinitely
- Console errors about missing modules

#### Solutions
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# Check Next.js build
npm run build

# Verify environment variables
cat .env.local | grep -v "^#" | grep -v "^$"
```

#### Common Causes
- Missing environment variables
- Incompatible Node.js version
- Corrupted node_modules
- Missing build files

### 2. "Wallet Connection Failed"

#### Symptoms
- "Connect Wallet" button not responding
- "Unsupported network" error
- Wallet modal not appearing

#### Solutions
```typescript
// Check wallet configuration
const walletConfig = {
  chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '80002'),
  rpcUrl: process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL,
  explorerUrl: 'https://amoy.polygonscan.com'
};

// Verify network configuration
console.log('Wallet Config:', walletConfig);
```

#### Debug Steps
1. Check browser console for wallet errors
2. Verify MetaMask is installed and unlocked
3. Confirm network is added to wallet
4. Check RPC URL is accessible
5. Verify chain ID matches configuration

### 3. "NFT Images Not Loading"

#### Symptoms
- Broken image icons
- Images loading slowly
- IPFS timeout errors

#### Solutions
```typescript
// Image URL debugging
function debugImageUrl(url: string) {
  console.log('Original URL:', url);
  
  if (url.startsWith('ipfs://')) {
    const ipfsHash = url.replace('ipfs://', '');
    const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
    console.log('Gateway URL:', gatewayUrl);
    return gatewayUrl;
  }
  
  return url;
}

// Test image accessibility
async function testImageLoad(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('Image load failed:', error);
    return false;
  }
}
```

#### Common Solutions
- Use IPFS gateway URLs instead of ipfs:// protocol
- Implement image fallbacks
- Add loading states and error handling
- Use multiple IPFS gateways for redundancy

## API & Backend Issues

### 1. "API Request Failed"

#### Symptoms
- 500 Internal Server Error
- API timeouts
- CORS errors
- Authentication failures

#### Debug Process
```bash
# Check API endpoint health
curl -I http://localhost:3000/api/health

# Test specific endpoint with verbose output
curl -v -X GET http://localhost:3000/api/marketplace/nfts

# Check API logs
npm run dev # Watch console output
```

#### Common Solutions
```typescript
// Add proper error handling
export async function handleAPIError(error: any): Promise<void> {
  console.error('API Error Details:', {
    message: error.message,
    status: error.status,
    response: error.response?.data,
    stack: error.stack
  });
  
  // Log to monitoring service
  if (process.env.NODE_ENV === 'production') {
    await logError(error);
  }
}
```

### 2. "Database Connection Issues"

#### Symptoms
- "MongoServerError: Authentication failed"
- "Connection timeout"
- "No replica set members found"

#### Solutions
```bash
# Test MongoDB connection
mongosh "mongodb+srv://username:password@cluster.mongodb.net/database" \
  --eval "db.runCommand({connectionStatus: 1})"

# Check connection string format
node -e "
const uri = process.env.MONGODB_URI;
console.log('URI format:', uri ? 'Valid' : 'Missing');
console.log('Contains password:', uri?.includes(':') ? 'Yes' : 'No');
"
```

#### Connection Troubleshooting
```typescript
// Enhanced MongoDB connection with retry logic
import { MongoClient } from 'mongodb';

async function connectWithRetry(retries = 3): Promise<MongoClient> {
  for (let i = 0; i < retries; i++) {
    try {
      const client = new MongoClient(process.env.MONGODB_URI!, {
        connectTimeoutMS: 10000,
        socketTimeoutMS: 10000,
        maxPoolSize: 10,
        retryWrites: true,
        retryReads: true
      });
      
      await client.connect();
      console.log('✅ MongoDB connected successfully');
      return client;
    } catch (error) {
      console.error(`❌ MongoDB connection attempt ${i + 1} failed:`, error);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
    }
  }
  
  throw new Error('MongoDB connection failed after all retries');
}
```

### 3. "Rate Limiting Errors"

#### Symptoms
- "Too Many Requests" (429 status)
- API calls being blocked
- Sudden increase in response times

#### Solutions
```typescript
// Implement exponential backoff
async function apiCallWithRetry<T>(
  apiCall: () => Promise<T>, 
  maxRetries = 3
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error: any) {
      if (error.status === 429 && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`Rate limited, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  
  throw new Error('Max retries exceeded');
}
```

## Blockchain & Wallet Issues

### 1. "Transaction Failed"

#### Symptoms
- "Transaction reverted"
- "Insufficient funds for gas"
- "Nonce too low/high"
- "Contract call failed"

#### Debug Process
```bash
# Check transaction on explorer
echo "Check transaction: https://amoy.polygonscan.com/tx/YOUR_TX_HASH"

# Verify contract address
curl -X POST https://rpc-amoy.polygon.technology \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"eth_getCode",
    "params":["0xContractAddress","latest"],
    "id":1
  }'
```

#### Common Solutions
```typescript
// Enhanced transaction error handling
async function executeTransaction(transaction: any): Promise<string> {
  try {
    const tx = await transaction;
    console.log('✅ Transaction successful:', tx.hash);
    return tx.hash;
  } catch (error: any) {
    console.error('❌ Transaction failed:', {
      message: error.message,
      code: error.code,
      data: error.data,
      transaction: error.transaction
    });
    
    // Provide user-friendly error messages
    if (error.message.includes('insufficient funds')) {
      throw new Error('Insufficient funds for gas. Please add more tokens to your wallet.');
    } else if (error.message.includes('user rejected')) {
      throw new Error('Transaction was rejected by user.');
    } else if (error.message.includes('nonce too low')) {
      throw new Error('Transaction nonce error. Please try again.');
    } else {
      throw new Error(`Transaction failed: ${error.message}`);
    }
  }
}
```

### 2. "Smart Contract Interaction Issues"

#### Symptoms
- "Contract call reverted"
- "Function not found"
- "Invalid token ID"
- "Not authorized" errors

#### Debug Steps
```typescript
// Contract interaction debugging
async function debugContractCall(
  contract: any, 
  method: string, 
  params: any[]
): Promise<void> {
  try {
    // Check if contract is deployed
    const code = await contract.provider.getCode(contract.address);
    if (code === '0x') {
      throw new Error('Contract not deployed at this address');
    }
    
    // Verify method exists
    if (!contract[method]) {
      throw new Error(`Method '${method}' not found on contract`);
    }
    
    // Test call before transaction
    const result = await contract.callStatic[method](...params);
    console.log('Call simulation successful:', result);
    
    // Execute transaction
    const tx = await contract[method](...params);
    console.log('Transaction submitted:', tx.hash);
    
  } catch (error) {
    console.error('Contract call debug:', error);
    throw error;
  }
}
```

### 3. "Network Configuration Issues"

#### Symptoms
- "Unsupported network"
- "Wrong chain ID"
- "RPC endpoint unreachable"

#### Solutions
```typescript
// Network configuration validation
async function validateNetworkConfig(): Promise<void> {
  const requiredVars = [
    'NEXT_PUBLIC_CHAIN_ID',
    'NEXT_PUBLIC_POLYGON_AMOY_RPC_URL'
  ];
  
  const missing = requiredVars.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
  
  // Test RPC connectivity
  try {
    const response = await fetch(process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_chainId',
        params: [],
        id: 1
      })
    });
    
    const data = await response.json();
    const chainId = parseInt(data.result, 16);
    const expectedChainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID!);
    
    if (chainId !== expectedChainId) {
      throw new Error(`Chain ID mismatch: expected ${expectedChainId}, got ${chainId}`);
    }
    
    console.log('✅ Network configuration valid');
  } catch (error) {
    console.error('❌ Network validation failed:', error);
    throw error;
  }
}
```

## Database Issues

### 1. "Collection Not Found"

#### Symptoms
- "Collection does not exist"
- Empty query results
- Document insertion fails

#### Debug Process
```bash
# List all collections
mongosh "mongodb+srv://connection-string" --eval "
  db.adminCommand('listCollections').cursor.firstBatch.forEach(
    collection => print(collection.name)
  )
"

# Check specific collection
mongosh "mongodb+srv://connection-string" --eval "
  db.launchpad_collections.findOne()
"

# Verify indexes
mongosh "mongodb+srv://connection-string" --eval "
  db.launchpad_collections.getIndexes()
"
```

#### Solutions
```typescript
// Collection existence check
async function ensureCollectionExists(db: any, collectionName: string): Promise<void> {
  const collections = await db.listCollections().toArray();
  const exists = collections.some((col: any) => col.name === collectionName);
  
  if (!exists) {
    console.log(`Creating collection: ${collectionName}`);
    await db.createCollection(collectionName);
  }
}

// Safe query with error handling
async function safeQuery(collection: any, query: any): Promise<any[]> {
  try {
    const results = await collection.find(query).toArray();
    console.log(`Query returned ${results.length} documents`);
    return results;
  } catch (error) {
    console.error('Query failed:', {
      collection: collection.collectionName,
      query,
      error: error.message
    });
    throw error;
  }
}
```

### 2. "Query Performance Issues"

#### Symptoms
- Slow query responses
- Timeout errors
- High memory usage

#### Solutions
```typescript
// Add proper indexing
async function createOptimalIndexes(db: any): Promise<void> {
  const collections = [
    {
      name: 'launchpad_collections',
      indexes: [
        { contractAddress: 1 },
        { status: 1, createdAt: -1 },
        { 'creator.wallet': 1 }
      ]
    },
    {
      name: 'nfts',
      indexes: [
        { owner: 1 },
        { tokenId: 1, contractAddress: 1 },
        { 'marketplace.isListed': 1 }
      ]
    }
  ];
  
  for (const col of collections) {
    const collection = db.collection(col.name);
    for (const index of col.indexes) {
      await collection.createIndex(index);
      console.log(`✅ Index created: ${col.name}`, index);
    }
  }
}

// Query optimization
async function optimizedQuery(collection: any, filters: any): Promise<any[]> {
  return await collection
    .find(filters)
    .sort({ createdAt: -1 })
    .limit(100)
    .project({ sensitiveField: 0 }) // Exclude unnecessary fields
    .toArray();
}
```

## AI Generation Issues

### 1. "Image Generation Failed"

#### Symptoms
- "OpenAI API error"
- "Content policy violation"
- "Rate limit exceeded"
- Generated images are poor quality

#### Debug Process
```bash
# Test OpenAI API directly
curl -X POST https://api.openai.com/v1/images/generations \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "dall-e-3",
    "prompt": "A simple test image",
    "n": 1,
    "size": "1024x1024"
  }'
```

#### Solutions
```typescript
// Enhanced prompt engineering
function enhancePrompt(userPrompt: string, teamName: string): string {
  const baseConstraints = [
    'high quality',
    'professional sports design',
    'clean background',
    'vibrant colors'
  ];
  
  const teamConstraints = getTeamConstraints(teamName);
  const styleConstraints = [
    'modern athletic wear',
    'authentic team colors',
    'professional photography style'
  ];
  
  return [
    userPrompt,
    ...baseConstraints,
    ...teamConstraints,
    ...styleConstraints
  ].join(', ');
}

// Error handling with retry logic
async function generateImageWithRetry(prompt: string): Promise<string> {
  const maxRetries = 3;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: enhancePrompt(prompt, teamName),
        n: 1,
        size: "1024x1024",
        quality: "standard"
      });
      
      return response.data[0].url!;
    } catch (error: any) {
      console.error(`Generation attempt ${attempt + 1} failed:`, error.message);
      
      if (error.message.includes('content_policy_violation')) {
        throw new Error('Content violates policy. Please modify your prompt.');
      } else if (error.message.includes('rate_limit_exceeded')) {
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        }
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      
      if (attempt === maxRetries - 1) throw error;
    }
  }
  
  throw new Error('Image generation failed after all retries');
}
```

### 2. "Upload to IPFS Failed"

#### Symptoms
- "Pinata upload error"
- "IPFS gateway timeout"
- "Metadata not accessible"

#### Solutions
```typescript
// Robust IPFS upload with multiple gateways
const IPFS_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://gateway.ipfs.io/ipfs/'
];

async function uploadToIPFSWithRetry(
  file: Blob, 
  filename: string
): Promise<string> {
  try {
    // Upload to Pinata
    const upload = await pinata.upload.file(file).name(filename);
    const ipfsHash = upload.IpfsHash;
    
    // Verify upload by testing gateways
    const workingGateway = await findWorkingGateway(ipfsHash);
    
    return `${workingGateway}${ipfsHash}`;
  } catch (error) {
    console.error('IPFS upload failed:', error);
    throw new Error('Failed to upload to IPFS. Please try again.');
  }
}

async function findWorkingGateway(ipfsHash: string): Promise<string> {
  for (const gateway of IPFS_GATEWAYS) {
    try {
      const response = await fetch(`${gateway}${ipfsHash}`, { 
        method: 'HEAD',
        timeout: 5000 
      });
      if (response.ok) {
        return gateway;
      }
    } catch (error) {
      continue;
    }
  }
  
  // Fallback to first gateway
  return IPFS_GATEWAYS[0];
}
```

## Deployment Issues

### 1. "Vercel Build Failures"

#### Symptoms
- Build timeouts
- "Module not found" errors
- Environment variable issues
- Static generation failures

#### Solutions
```bash
# Local build test
npm run build

# Check build logs
vercel logs [deployment-id]

# Verify environment variables
vercel env ls
```

#### Common Fixes
```json
// vercel.json configuration
{
  "functions": {
    "app/api/**/*.js": {
      "maxDuration": 30
    }
  },
  "env": {
    "MONGODB_URI": "@mongodb-uri-prod"
  },
  "build": {
    "env": {
      "NEXT_TELEMETRY_DISABLED": "1"
    }
  }
}
```

### 2. "Render Deployment Issues"

#### Symptoms
- Service start failures
- Port binding errors
- Environment variable problems

#### Debug Process
```bash
# Check Render logs
render logs --service=your-service-name --tail

# Verify service configuration
render services list

# Test health endpoint
curl https://your-service.onrender.com/health
```

#### Solutions
```dockerfile
# Proper port configuration
ENV PORT=10000
EXPOSE $PORT

# Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString() 
  });
});

app.listen(process.env.PORT || 3000, '0.0.0.0', () => {
  console.log(`Server running on port ${process.env.PORT || 3000}`);
});
```

## Performance Issues

### 1. "Slow Page Loading"

#### Symptoms
- Long initial page load times
- Large bundle sizes
- Poor Core Web Vitals scores

#### Solutions
```typescript
// Code splitting and lazy loading
import dynamic from 'next/dynamic';

const LazyMarketplace = dynamic(() => import('./Marketplace'), {
  loading: () => <div>Loading marketplace...</div>,
  ssr: false
});

// Image optimization
import Image from 'next/image';

function OptimizedNFTImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={400}
      height={400}
      priority={false}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ..."
    />
  );
}

// API response caching
export async function GET(request: Request) {
  const data = await fetchExpensiveData();
  
  return new Response(JSON.stringify(data), {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
    }
  });
}
```

### 2. "Memory Leaks"

#### Symptoms
- Increasing memory usage
- Browser tab crashes
- Server memory exhaustion

#### Solutions
```typescript
// Proper cleanup in React components
import { useEffect, useRef } from 'react';

function Component() {
  const intervalRef = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      // Some periodic task
    }, 1000);
    
    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  return <div>Component content</div>;
}

// MongoDB connection pooling
const clientOptions = {
  maxPoolSize: 10,
  minPoolSize: 5,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000,
};
```

## Environment Configuration Issues

### 1. "Environment Variables Not Loading"

#### Symptoms
- `undefined` values for environment variables
- Different behavior between environments
- Build-time vs runtime variable issues

#### Debug Process
```bash
# Check .env file loading
node -e "require('dotenv').config(); console.log(Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC')))"

# Verify variable accessibility
node -e "console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set')"

# Check Next.js environment loading
npm run dev -- --inspect
```

#### Solutions
```typescript
// Environment validation
function validateEnvironment(): void {
  const required = [
    'MONGODB_URI',
    'THIRDWEB_SECRET_KEY',
    'OPENAI_API_KEY',
    'NEXT_PUBLIC_THIRDWEB_CLIENT_ID'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing);
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
  
  console.log('✅ All required environment variables are set');
}

// Call validation on app startup
validateEnvironment();
```

## Debug Tools & Commands

### 1. Development Debug Commands

```bash
# Enable debug mode
DEBUG=* npm run dev

# Specific debug namespaces
DEBUG=thirdweb:* npm run dev
DEBUG=mongodb:* npm run dev

# Memory usage monitoring
node --inspect --max-old-space-size=4096 server.js

# Performance profiling
node --prof server.js
```

### 2. Production Monitoring

```typescript
// Error tracking setup
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

// Performance monitoring
export function performanceMonitor(operation: string) {
  const start = Date.now();
  
  return {
    end: () => {
      const duration = Date.now() - start;
      console.log(`${operation} took ${duration}ms`);
      
      if (duration > 1000) {
        console.warn(`Slow operation detected: ${operation}`);
      }
    }
  };
}
```

### 3. API Testing Tools

```bash
# Test all endpoints
curl -X GET http://localhost:3000/api/health
curl -X GET http://localhost:3000/api/marketplace/nfts
curl -X GET http://localhost:3000/api/launchpad/collections

# Load testing
npx artillery quick --count 10 --num 5 http://localhost:3000/api/marketplace/nfts

# API documentation testing
npx swagger-codegen-cli validate -i http://localhost:3000/api/docs
```

### 4. Database Debug Queries

```javascript
// MongoDB debug queries
// Check collection sizes
db.stats()

// Find slow operations
db.currentOp({"active": true, "secs_running": {"$gt": 1}})

// Explain query performance
db.nfts.find({owner: "0x123"}).explain("executionStats")

// Check index usage
db.nfts.aggregate([
  {"$indexStats": {}}
])
```

---

## Emergency Procedures

### Critical Issues
1. **System Down**: Check Vercel/Render status, verify DNS
2. **Database Unavailable**: Check MongoDB Atlas status, connection strings
3. **Smart Contract Issues**: Verify contract addresses, network status
4. **Security Breach**: Follow incident response plan in SECURITY.md

### Contact Information
- **Development Team**: dev@company.com
- **DevOps/Infrastructure**: ops@company.com
- **Security Issues**: security@company.com

**Last Updated**: [Current Date]
