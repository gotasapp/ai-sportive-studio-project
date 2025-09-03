# Marketplace Trading System - Technical Documentation

## Overview

The Marketplace Trading System is the core engine that facilitates NFT transactions, listings, and trading operations within the CHZ Fan Token Studio. It provides a comprehensive platform for users to buy, sell, and trade sports NFTs with real-time pricing, order management, and blockchain settlement.

## System Architecture

### Core Components

- **Listing Engine**: Manages NFT listings and availability
- **Order Matching**: Processes buy/sell orders and matches
- **Price Discovery**: Dynamic pricing based on market activity
- **Transaction Settlement**: Blockchain integration for final settlement
- **Market Data**: Real-time market statistics and analytics

### Technology Stack

- **Frontend**: Next.js with React hooks for state management
- **Backend**: Node.js/Express with MongoDB for data persistence
- **Blockchain**: Thirdweb SDK for smart contract interactions
- **Real-time**: WebSocket connections for live market updates
- **Cache**: Redis for high-frequency data and session management

## Data Models

### NFT Listing Schema

```typescript
interface NFTListing {
  _id: ObjectId;
  nftId: string;
  tokenId: string;
  contractAddress: string;
  sellerAddress: string;
  price: {
    amount: string;
    currency: 'CHZ' | 'USDC' | 'ETH';
    decimals: number;
  };
  status: 'active' | 'sold' | 'cancelled' | 'expired';
  listingDate: Date;
  expiryDate?: Date;
  metadata: {
    name: string;
    description: string;
    image: string;
    attributes: Record<string, any>;
  };
  blockchainData: {
    chainId: number;
    transactionHash: string;
    blockNumber: number;
  };
}
```

### Order Schema

```typescript
interface Order {
  _id: ObjectId;
  orderId: string;
  type: 'buy' | 'sell';
  nftId: string;
  buyerAddress: string;
  sellerAddress: string;
  price: {
    amount: string;
    currency: string;
    decimals: number;
  };
  status: 'pending' | 'confirmed' | 'failed' | 'cancelled';
  timestamp: Date;
  blockchainTx?: string;
  gasUsed?: number;
  gasPrice?: string;
}
```

## Trading Flow

### 1. Listing Creation

```typescript
// Create new NFT listing
const createListing = async (listingData: CreateListingRequest) => {
  // Validate NFT ownership
  const ownership = await verifyNFTOwnership(
    listingData.nftId, 
    listingData.sellerAddress
  );
  
  if (!ownership) {
    throw new Error('NFT ownership verification failed');
  }
  
  // Create listing in database
  const listing = await ListingModel.create({
    ...listingData,
    status: 'active',
    listingDate: new Date()
  });
  
  // Emit real-time update
  io.emit('listing:created', listing);
  
  return listing;
};
```

### 2. Order Processing

```typescript
// Process buy order
const processBuyOrder = async (orderData: BuyOrderRequest) => {
  // Validate listing availability
  const listing = await ListingModel.findOne({
    nftId: orderData.nftId,
    status: 'active'
  });
  
  if (!listing) {
    throw new Error('Listing not available');
  }
  
  // Check buyer balance
  const balance = await getTokenBalance(
    orderData.buyerAddress, 
    listing.price.currency
  );
  
  if (balance < listing.price.amount) {
    throw new Error('Insufficient balance');
  }
  
  // Create order
  const order = await OrderModel.create({
    ...orderData,
    status: 'pending',
    timestamp: new Date()
  });
  
  return order;
};
```

### 3. Transaction Settlement

```typescript
// Settle transaction on blockchain
const settleTransaction = async (orderId: string) => {
  const order = await OrderModel.findById(orderId);
  const listing = await ListingModel.findOne({ nftId: order.nftId });
  
  try {
    // Execute smart contract transaction
    const tx = await marketplaceContract.executeOrder(
      order.orderId,
      listing.contractAddress,
      order.nftId,
      order.price.amount
    );
    
    // Update order status
    await OrderModel.findByIdAndUpdate(orderId, {
      status: 'confirmed',
      blockchainTx: tx.hash,
      gasUsed: tx.gasUsed,
      gasPrice: tx.gasPrice
    });
    
    // Update listing status
    await ListingModel.findByIdAndUpdate(listing._id, {
      status: 'sold'
    });
    
    // Emit settlement event
    io.emit('transaction:settled', { orderId, txHash: tx.hash });
    
    return tx;
  } catch (error) {
    // Mark order as failed
    await OrderModel.findByIdAndUpdate(orderId, {
      status: 'failed'
    });
    
    throw error;
  }
};
```

## API Endpoints

### Listing Management

#### GET /api/listings
```typescript
// Query parameters
{
  status?: 'active' | 'sold' | 'cancelled';
  category?: 'jersey' | 'stadium' | 'badge';
  minPrice?: number;
  maxPrice?: number;
  sellerAddress?: string;
  page?: number;
  limit?: number;
}
```

#### POST /api/listings
```typescript
{
  nftId: string;
  price: {
    amount: string;
    currency: string;
    decimals: number;
  };
  expiryDate?: Date;
}
```

#### PUT /api/listings/:id
```typescript
{
  price?: {
    amount: string;
    currency: string;
    decimals: number;
  };
  status?: 'active' | 'cancelled';
}
```

### Trading Operations

#### POST /api/orders/buy
```typescript
{
  listingId: string;
  buyerAddress: string;
  gasEstimate?: number;
}
```

#### POST /api/orders/sell
```typescript
{
  nftId: string;
  price: {
    amount: string;
    currency: string;
    decimals: number;
  };
  sellerAddress: string;
}
```

#### GET /api/orders/:id
```typescript
{
  orderId: string;
  type: 'buy' | 'sell';
  status: string;
  price: object;
  timestamp: Date;
  blockchainTx?: string;
}
```

## Market Data and Analytics

### Real-time Market Statistics

```typescript
interface MarketStats {
  totalListings: number;
  activeListings: number;
  totalVolume: {
    [currency: string]: number;
  };
  averagePrice: {
    [category: string]: number;
  };
  trendingCollections: Array<{
    collectionId: string;
    volume24h: number;
    change24h: number;
  }>;
}
```

### Price Discovery Algorithm

```typescript
const calculateMarketPrice = (nftData: NFTData): PriceData => {
  // Get recent sales data
  const recentSales = await getRecentSales(nftData.nftId);
  
  // Calculate moving average
  const avgPrice = recentSales.reduce((sum, sale) => 
    sum + parseFloat(sale.price.amount), 0
  ) / recentSales.length;
  
  // Apply market conditions
  const marketMultiplier = getMarketMultiplier(nftData.category);
  
  // Consider rarity and demand
  const rarityScore = calculateRarityScore(nftData.attributes);
  const demandScore = calculateDemandScore(nftData.collectionId);
  
  return {
    suggestedPrice: avgPrice * marketMultiplier * rarityScore * demandScore,
    confidence: calculateConfidence(recentSales.length),
    lastUpdated: new Date()
  };
};
```

## Security and Compliance

### Anti-Fraud Measures

1. **Ownership Verification**: Blockchain-based NFT ownership validation
2. **Price Manipulation Detection**: Algorithmic detection of unusual price movements
3. **Wash Trading Prevention**: Identification of self-trading patterns
4. **Rate Limiting**: Protection against automated trading abuse

### Compliance Features

- **KYC Integration**: Optional identity verification for high-value trades
- **Transaction Monitoring**: Automated suspicious activity detection
- **Regulatory Reporting**: Compliance with local trading regulations
- **Audit Trail**: Complete transaction history for regulatory purposes

## Performance Optimization

### Database Optimization

```javascript
// MongoDB indexes for optimal trading queries
db.listings.createIndex({ status: 1, category: 1, price: 1 });
db.listings.createIndex({ sellerAddress: 1, status: 1 });
db.orders.createIndex({ status: 1, timestamp: -1 });
db.orders.createIndex({ buyerAddress: 1, sellerAddress: 1 });
```

### Caching Strategy

- **Redis Cache**: Store frequently accessed market data
- **CDN Integration**: Optimize image and metadata delivery
- **Database Connection Pooling**: Efficient database connection management
- **Query Result Caching**: Cache expensive aggregation queries

## Error Handling and Monitoring

### Error Categories

1. **Validation Errors**: Invalid input data or business rule violations
2. **Blockchain Errors**: Smart contract execution failures
3. **Network Errors**: API connectivity and timeout issues
4. **System Errors**: Database or infrastructure failures

### Monitoring and Alerting

```typescript
// Error tracking and alerting
const trackError = async (error: Error, context: ErrorContext) => {
  // Log error details
  await ErrorLogModel.create({
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date()
  });
  
  // Send alert for critical errors
  if (isCriticalError(error)) {
    await sendAlert({
      level: 'critical',
      message: `Critical trading error: ${error.message}`,
      context
    });
  }
};
```

## Testing and Quality Assurance

### Test Coverage

- **Unit Tests**: Individual function and component testing
- **Integration Tests**: API endpoint and database interaction testing
- **End-to-End Tests**: Complete trading flow validation
- **Performance Tests**: Load testing and stress testing

### Test Scenarios

```typescript
describe('Trading Flow Tests', () => {
  test('Complete buy order flow', async () => {
    // Create listing
    const listing = await createTestListing();
    
    // Place buy order
    const order = await placeBuyOrder(listing.id);
    
    // Verify order creation
    expect(order.status).toBe('pending');
    
    // Simulate blockchain settlement
    const settlement = await settleTransaction(order.id);
    
    // Verify final state
    expect(settlement.status).toBe('confirmed');
  });
});
```

## Future Enhancements

### Planned Features

1. **Advanced Order Types**: Limit orders, stop-loss, and conditional trading
2. **Liquidity Pools**: Automated market making for popular collections
3. **Cross-Chain Trading**: Multi-blockchain NFT trading support
4. **Derivatives Trading**: Options and futures for NFT positions

### Technical Improvements

- **Microservices Architecture**: Scalable service decomposition
- **GraphQL API**: More efficient data querying
- **Machine Learning**: AI-powered price prediction and fraud detection
- **Layer 2 Solutions**: Reduced gas costs and faster settlement

## Conclusion

The Marketplace Trading System provides a robust, secure, and scalable foundation for NFT trading operations. Its comprehensive feature set, performance optimizations, and security measures ensure reliable operation while maintaining user experience and regulatory compliance.

---

*Last Updated: [Current Date]*
*Version: 1.0.0*
