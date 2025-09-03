# Upvote System - Technical Documentation

## Overview

The Upvote System is a core feature that enables community-driven content curation and ranking within the CHZ Fan Token Studio marketplace. It provides a democratic way for users to influence which NFTs and collections gain visibility and prominence.

## Architecture

### Core Components

- **Upvote Model**: MongoDB schema for storing vote data
- **Vote Controller**: API endpoints for vote operations
- **Vote Validation**: Business logic for vote integrity
- **Real-time Updates**: WebSocket integration for live vote counts

### Database Schema

```typescript
interface Vote {
  _id: ObjectId;
  userId: string;
  targetId: string;
  targetType: 'nft' | 'collection' | 'user';
  voteType: 'upvote' | 'downvote';
  timestamp: Date;
  blockchainTx?: string; // Optional on-chain verification
}
```

## Implementation Details

### Vote Types

1. **Upvote (+1)**: Positive endorsement of content
2. **Downvote (-1)**: Negative feedback (optional feature)
3. **Neutral (0)**: Vote removal or cancellation

### Target Types

- **NFT**: Individual token voting
- **Collection**: Series or drop voting
- **User**: Creator reputation voting

## API Endpoints

### POST /api/votes/upvote
```typescript
{
  targetId: string;
  targetType: 'nft' | 'collection' | 'user';
  userId: string;
}
```

### POST /api/votes/downvote
```typescript
{
  targetId: string;
  targetType: 'nft' | 'collection' | 'user';
  userId: string;
}
```

### GET /api/votes/:targetId
```typescript
{
  upvotes: number;
  downvotes: number;
  totalScore: number;
  userVote?: 'upvote' | 'downvote' | null;
}
```

## Business Logic

### Vote Validation Rules

1. **One Vote Per User**: Users can only vote once per target
2. **Vote Change**: Users can change their vote (upvote → downvote)
3. **Vote Removal**: Users can remove their vote entirely
4. **Anti-Spam**: Rate limiting on vote operations

### Score Calculation

```typescript
const calculateScore = (upvotes: number, downvotes: number): number => {
  return upvotes - downvotes;
};

const calculatePercentage = (upvotes: number, total: number): number => {
  return total > 0 ? (upvotes / total) * 100 : 0;
};
```

## Frontend Integration

### Vote Components

- **VoteButton**: Interactive upvote/downvote button
- **VoteCounter**: Display current vote counts
- **VoteHistory**: User's voting activity
- **TrendingIndicator**: Visual feedback for trending content

### State Management

```typescript
interface VoteState {
  [targetId: string]: {
    upvotes: number;
    downvotes: number;
    userVote: 'upvote' | 'downvote' | null;
    isLoading: boolean;
  };
}
```

## Security Features

### Anti-Manipulation

1. **Rate Limiting**: Maximum votes per user per time period
2. **IP Tracking**: Monitor for suspicious voting patterns
3. **Wallet Verification**: Optional blockchain-based vote verification
4. **Admin Oversight**: Manual review of unusual voting activity

### Data Integrity

- **Atomic Operations**: Database transactions for vote consistency
- **Audit Trail**: Complete history of all vote changes
- **Backup Verification**: Regular validation of vote counts

## Performance Optimization

### Caching Strategy

- **Redis Cache**: Store vote counts for frequently accessed content
- **Aggregation Pipeline**: MongoDB aggregation for vote statistics
- **Lazy Loading**: Load vote data on-demand

### Database Indexes

```javascript
// MongoDB indexes for optimal vote queries
db.votes.createIndex({ targetId: 1, targetType: 1 });
db.votes.createIndex({ userId: 1, targetId: 1 });
db.votes.createIndex({ timestamp: -1 });
```

## Analytics and Reporting

### Vote Metrics

- **Vote Velocity**: Rate of votes over time
- **Engagement Rate**: Percentage of users who vote
- **Trending Content**: Content with rapid vote accumulation
- **User Participation**: Most active voters and creators

### Admin Dashboard

- **Vote Activity**: Real-time voting statistics
- **Suspicious Patterns**: Automated detection of vote manipulation
- **Content Performance**: Vote-based content ranking
- **User Analytics**: Voting behavior insights

## Future Enhancements

### Planned Features

1. **Weighted Voting**: Different vote weights based on user reputation
2. **Delegated Voting**: Allow users to delegate voting power
3. **Vote Staking**: Stake tokens to increase vote influence
4. **Cross-Chain Voting**: Vote verification on multiple blockchains

### Technical Improvements

- **GraphQL Integration**: More efficient vote data queries
- **Real-time Updates**: WebSocket implementation for live vote counts
- **Machine Learning**: AI-powered vote fraud detection
- **Decentralized Voting**: Smart contract-based vote verification

## Troubleshooting

### Common Issues

1. **Vote Count Mismatch**: Database consistency checks
2. **Performance Degradation**: Query optimization and indexing
3. **Real-time Update Failures**: WebSocket connection management
4. **Vote Validation Errors**: Business rule enforcement

### Debug Tools

- **Vote Logs**: Detailed logging of all vote operations
- **Performance Metrics**: Response time and throughput monitoring
- **Error Tracking**: Comprehensive error logging and alerting
- **Health Checks**: System status monitoring endpoints

## Conclusion

The Upvote System provides a robust foundation for community-driven content curation. Its scalable architecture, security features, and performance optimizations ensure reliable operation at scale while maintaining data integrity and preventing manipulation.

---

*Last Updated: [Current Date]*
*Version: 1.0.0*
