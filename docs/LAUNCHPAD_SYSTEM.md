# Launchpad System - Technical Documentation

## Overview

The Launchpad System is a comprehensive platform that enables creators to deploy, manage, and launch NFT collections with advanced features including gasless minting, allowlist management, and automated distribution. It provides a complete solution for collection creation, deployment, and ongoing management within the CHZ Fan Token Studio ecosystem.

## System Architecture

### Core Components

- **Collection Deployer**: Smart contract deployment and configuration
- **Mint Engine**: Gasless minting with Thirdweb Engine integration
- **Allowlist Manager**: Whitelist and tier-based access control
- **Metadata Generator**: Dynamic NFT metadata creation and storage
- **Distribution System**: Automated NFT distribution and claiming
- **Analytics Dashboard**: Real-time collection performance metrics

### Technology Stack

- **Frontend**: Next.js with TypeScript and React hooks
- **Backend**: Node.js/Express with MongoDB for data persistence
- **Blockchain**: Thirdweb SDK v5 for smart contract operations
- **Storage**: IPFS via Pinata for decentralized metadata storage
- **Authentication**: Wallet-based authentication with admin controls
- **Real-time**: WebSocket connections for live updates

## Data Models

### Collection Schema

```typescript
interface Collection {
  _id: ObjectId;
  collectionId: string;
  name: string;
  description: string;
  symbol: string;
  contractAddress: string;
  chainId: number;
  creatorAddress: string;
  status: 'draft' | 'deployed' | 'active' | 'paused' | 'completed';
  
  // Collection Configuration
  config: {
    maxSupply: number;
    mintPrice: {
      amount: string;
      currency: string;
      decimals: number;
    };
    mintLimit: number; // Max mints per wallet
    revealStrategy: 'instant' | 'delayed' | 'progressive';
    royaltyPercentage: number;
    allowlistRequired: boolean;
  };
  
  // Metadata Configuration
  metadata: {
    baseURI: string;
    placeholderImage: string;
    attributes: Array<{
      trait_type: string;
      value: string;
      rarity: number;
    }>;
  };
  
  // Launch Configuration
  launch: {
    startDate: Date;
    endDate?: Date;
    allowlistStart?: Date;
    publicStart?: Date;
    maxMintsPerTx: number;
  };
  
  // Statistics
  stats: {
    totalMinted: number;
    totalRevenue: string;
    uniqueHolders: number;
    floorPrice?: string;
    volume24h?: string;
  };
  
  // Timestamps
  createdAt: Date;
  deployedAt?: Date;
  updatedAt: Date;
}
```

### Allowlist Schema

```typescript
interface Allowlist {
  _id: ObjectId;
  collectionId: string;
  name: string;
  description: string;
  
  // Access Control
  access: {
    type: 'whitelist' | 'tiered' | 'merkle';
    maxMints: number;
    discountPercentage?: number;
    earlyAccessMinutes?: number;
  };
  
  // Member Management
  members: Array<{
    address: string;
    tier?: string;
    maxMints: number;
    mintsUsed: number;
    addedAt: Date;
  }>;
  
  // Merkle Tree (for gas-efficient verification)
  merkleRoot?: string;
  merkleProofs?: Record<string, string[]>;
  
  createdAt: Date;
  updatedAt: Date;
}
```

### Mint Transaction Schema

```typescript
interface MintTransaction {
  _id: ObjectId;
  collectionId: string;
  tokenId: number;
  minterAddress: string;
  allowlistId?: string;
  
  // Transaction Details
  transaction: {
    hash: string;
    gasUsed: number;
    gasPrice: string;
    blockNumber: number;
    timestamp: Date;
  };
  
  // Mint Details
  mint: {
    quantity: number;
    price: {
      amount: string;
      currency: string;
      decimals: number;
    };
    discountApplied?: number;
    allowlistDiscount?: number;
  };
  
  // Metadata
  metadata: {
    name: string;
    description: string;
    image: string;
    attributes: Record<string, any>;
  };
  
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: Date;
  confirmedAt?: Date;
}
```

## Collection Deployment Flow

### 1. Collection Creation

```typescript
// Create new collection
const createCollection = async (collectionData: CreateCollectionRequest) => {
  // Validate creator permissions
  const isAuthorized = await validateCreatorPermissions(
    collectionData.creatorAddress
  );
  
  if (!isAuthorized) {
    throw new Error('Unauthorized creator address');
  }
  
  // Generate unique collection ID
  const collectionId = generateCollectionId();
  
  // Create collection record
  const collection = await CollectionModel.create({
    ...collectionData,
    collectionId,
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  // Initialize statistics
  await initializeCollectionStats(collectionId);
  
  return collection;
};
```

### 2. Smart Contract Deployment

```typescript
// Deploy collection smart contract
const deployCollection = async (collectionId: string) => {
  const collection = await CollectionModel.findOne({ collectionId });
  
  if (!collection) {
    throw new Error('Collection not found');
  }
  
  try {
    // Deploy ERC-721 contract via Thirdweb
    const contract = await deployERC721Contract({
      name: collection.name,
      symbol: collection.symbol,
      baseURI: collection.metadata.baseURI,
      maxSupply: collection.config.maxSupply,
      mintPrice: collection.config.mintPrice,
      royaltyPercentage: collection.config.royaltyPercentage
    });
    
    // Update collection with contract address
    await CollectionModel.findByIdAndUpdate(collection._id, {
      contractAddress: contract.address,
      status: 'deployed',
      deployedAt: new Date(),
      updatedAt: new Date()
    });
    
    // Emit deployment event
    io.emit('collection:deployed', {
      collectionId,
      contractAddress: contract.address
    });
    
    return contract;
  } catch (error) {
    // Mark deployment as failed
    await CollectionModel.findByIdAndUpdate(collection._id, {
      status: 'deployment_failed',
      updatedAt: new Date()
    });
    
    throw error;
  }
};
```

### 3. Allowlist Configuration

```typescript
// Configure allowlist for collection
const configureAllowlist = async (
  collectionId: string, 
  allowlistData: AllowlistConfig
) => {
  const collection = await CollectionModel.findOne({ collectionId });
  
  if (!collection) {
    throw new Error('Collection not found');
  }
  
  // Create allowlist record
  const allowlist = await AllowlistModel.create({
    collectionId,
    ...allowlistData,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  // Generate merkle tree if using merkle verification
  if (allowlistData.access.type === 'merkle') {
    const merkleData = generateMerkleTree(allowlistData.members);
    
    await AllowlistModel.findByIdAndUpdate(allowlist._id, {
      merkleRoot: merkleData.root,
      merkleProofs: merkleData.proofs
    });
  }
  
  // Update collection allowlist requirement
  await CollectionModel.findByIdAndUpdate(collection._id, {
    'config.allowlistRequired': true,
    updatedAt: new Date()
  });
  
  return allowlist;
};
```

## Minting Engine

### Gasless Minting Implementation

```typescript
// Process gasless mint request
const processGaslessMint = async (mintRequest: GaslessMintRequest) => {
  const { collectionId, quantity, minterAddress, allowlistId } = mintRequest;
  
  // Validate collection status
  const collection = await validateCollectionForMinting(collectionId);
  
  // Validate allowlist access
  if (collection.config.allowlistRequired) {
    const allowlistAccess = await validateAllowlistAccess(
      allowlistId,
      minterAddress,
      collectionId
    );
    
    if (!allowlistAccess.allowed) {
      throw new Error('Allowlist access denied');
    }
  }
  
  // Check mint limits
  const mintLimits = await validateMintLimits(
    collectionId,
    minterAddress,
    quantity
  );
  
  if (!mintLimits.valid) {
    throw new Error(`Mint limit exceeded: ${mintLimits.reason}`);
  }
  
  // Calculate mint price with discounts
  const mintPrice = calculateMintPrice(
    collection.config.mintPrice,
    allowlistId,
    quantity
  );
  
  // Create mint transaction record
  const mintTx = await MintTransactionModel.create({
    collectionId,
    minterAddress,
    allowlistId,
    mint: {
      quantity,
      price: mintPrice,
      discountApplied: mintPrice.discountApplied
    },
    status: 'pending',
    createdAt: new Date()
  });
  
  // Execute gasless mint via Thirdweb Engine
  const engineMint = await executeEngineMint({
    collectionAddress: collection.contractAddress,
    to: minterAddress,
    quantity,
    price: mintPrice.amount,
    transactionId: mintTx._id.toString()
  });
  
  return {
    mintTransaction: mintTx,
    engineTransaction: engineMint
  };
};
```

### Mint Validation and Limits

```typescript
// Validate minting limits
const validateMintLimits = async (
  collectionId: string,
  minterAddress: string,
  quantity: number
): Promise<MintValidationResult> => {
  const collection = await CollectionModel.findOne({ collectionId });
  const userMints = await MintTransactionModel.aggregate([
    {
      $match: {
        collectionId,
        minterAddress,
        status: 'confirmed'
      }
    },
    {
      $group: {
        _id: null,
        totalMinted: { $sum: '$mint.quantity' }
      }
    }
  ]);
  
  const totalUserMints = userMints[0]?.totalMinted || 0;
  const remainingMints = collection.config.mintLimit - totalUserMints;
  
  if (quantity > remainingMints) {
    return {
      valid: false,
      reason: `Exceeds personal mint limit. Remaining: ${remainingMints}`
    };
  }
  
  if (collection.stats.totalMinted + quantity > collection.config.maxSupply) {
    return {
      valid: false,
      reason: 'Exceeds collection maximum supply'
    };
  }
  
  return { valid: true };
};
```

## API Endpoints

### Collection Management

#### POST /api/collections
```typescript
{
  name: string;
  description: string;
  symbol: string;
  maxSupply: number;
  mintPrice: {
    amount: string;
    currency: string;
    decimals: number;
  };
  mintLimit: number;
  royaltyPercentage: number;
  metadata: {
    baseURI: string;
    placeholderImage: string;
    attributes: Array<object>;
  };
}
```

#### PUT /api/collections/:id
```typescript
{
  name?: string;
  description?: string;
  status?: 'active' | 'paused' | 'completed';
  launch?: {
    startDate: Date;
    endDate?: Date;
    allowlistStart?: Date;
    publicStart?: Date;
  };
}
```

#### GET /api/collections/:id
```typescript
{
  collection: Collection;
  allowlists: Allowlist[];
  recentMints: MintTransaction[];
  statistics: CollectionStats;
}
```

### Minting Operations

#### POST /api/collections/:id/mint
```typescript
{
  quantity: number;
  allowlistId?: string;
  minterAddress: string;
  signature?: string; // For allowlist verification
}
```

#### GET /api/collections/:id/mints
```typescript
// Query parameters
{
  minterAddress?: string;
  status?: 'pending' | 'confirmed' | 'failed';
  page?: number;
  limit?: number;
}
```

### Allowlist Management

#### POST /api/collections/:id/allowlists
```typescript
{
  name: string;
  description: string;
  access: {
    type: 'whitelist' | 'tiered' | 'merkle';
    maxMints: number;
    discountPercentage?: number;
    earlyAccessMinutes?: number;
  };
  members: Array<{
    address: string;
    tier?: string;
    maxMints: number;
  }>;
}
```

#### POST /api/collections/:id/allowlists/:allowlistId/verify
```typescript
{
  address: string;
  signature?: string;
  merkleProof?: string[];
}
```

## Security Features

### Access Control

1. **Creator Authorization**: Only authorized creators can deploy collections
2. **Allowlist Verification**: Secure allowlist access with signature verification
3. **Mint Rate Limiting**: Protection against automated minting abuse
4. **Transaction Validation**: Blockchain-based transaction verification

### Anti-Fraud Measures

- **Sybil Attack Prevention**: Wallet-based minting limits
- **Price Manipulation Protection**: Fixed pricing during mint phases
- **Bulk Minting Detection**: Monitoring for unusual minting patterns
- **Allowlist Abuse Prevention**: Secure allowlist verification mechanisms

## Performance Optimization

### Database Optimization

```javascript
// MongoDB indexes for optimal launchpad queries
db.collections.createIndex({ creatorAddress: 1, status: 1 });
db.collections.createIndex({ status: 1, 'launch.startDate': 1 });
db.mintTransactions.createIndex({ collectionId: 1, minterAddress: 1 });
db.mintTransactions.createIndex({ collectionId: 1, status: 1, createdAt: -1 });
db.allowlists.createIndex({ collectionId: 1, 'members.address': 1 });
```

### Caching Strategy

- **Collection Cache**: Redis caching for frequently accessed collection data
- **Allowlist Cache**: In-memory caching for allowlist verification
- **Mint Statistics**: Real-time statistics with periodic database updates
- **Metadata Cache**: IPFS metadata caching for faster loading

## Analytics and Reporting

### Collection Performance Metrics

```typescript
interface CollectionAnalytics {
  // Minting Statistics
  minting: {
    totalMinted: number;
    mintRate: number; // mints per hour
    uniqueMinters: number;
    averageMintsPerWallet: number;
  };
  
  // Revenue Analytics
  revenue: {
    totalRevenue: string;
    revenueByCurrency: Record<string, string>;
    averageMintPrice: string;
    revenueTimeline: Array<{
      date: string;
      revenue: string;
      mints: number;
    }>;
  };
  
  // Holder Analytics
  holders: {
    totalHolders: number;
    holderRetention: number;
    topHolders: Array<{
      address: string;
      tokenCount: number;
      percentage: number;
    }>;
  };
  
  // Market Performance
  market: {
    floorPrice: string;
    volume24h: string;
    priceChange24h: number;
    tradingVolume: Array<{
      date: string;
      volume: string;
      transactions: number;
    }>;
  };
}
```

### Real-time Dashboard

- **Live Minting Activity**: Real-time mint transaction monitoring
- **Collection Performance**: Live statistics and metrics
- **Allowlist Status**: Current allowlist access and usage
- **Revenue Tracking**: Real-time revenue and mint price analytics

## Testing and Quality Assurance

### Test Coverage

- **Unit Tests**: Individual function and component testing
- **Integration Tests**: API endpoint and database interaction testing
- **Smart Contract Tests**: Solidity contract functionality testing
- **End-to-End Tests**: Complete collection deployment and minting flow

### Test Scenarios

```typescript
describe('Collection Deployment Tests', () => {
  test('Complete collection deployment flow', async () => {
    // Create collection
    const collection = await createTestCollection();
    
    // Deploy smart contract
    const contract = await deployCollection(collection.collectionId);
    
    // Verify deployment
    expect(contract.address).toBeDefined();
    expect(collection.status).toBe('deployed');
    
    // Test minting
    const mint = await testMint(collection.collectionId);
    expect(mint.status).toBe('confirmed');
  });
});
```

## Future Enhancements

### Planned Features

1. **Multi-chain Deployment**: Support for multiple blockchain networks
2. **Advanced Minting Strategies**: Dutch auctions, blind boxes, and mystery reveals
3. **Social Features**: Community voting and collection curation
4. **Cross-collection Mechanics**: Inter-collection interactions and benefits

### Technical Improvements

- **Layer 2 Integration**: Reduced gas costs and faster transactions
- **AI-powered Pricing**: Dynamic pricing based on market conditions
- **Advanced Analytics**: Machine learning for collection performance prediction
- **Decentralized Governance**: DAO-based collection management

## Conclusion

The Launchpad System provides a comprehensive and secure platform for NFT collection creation, deployment, and management. Its advanced features, performance optimizations, and security measures ensure reliable operation while maintaining user experience and creator control.

---

*Last Updated: [Current Date]*
*Version: 1.0.0*
