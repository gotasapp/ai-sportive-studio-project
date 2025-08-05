// src/components/marketplace/NFTGrid.tsx
'use client';

import MarketplaceCard from './MarketplaceCard';

interface NFTGridProps {
  items: any[];
  getContractByCategory: (category: string) => string;
}

export default function NFTGrid({ items, getContractByCategory }: NFTGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
      {items.map((item) => (
        <MarketplaceCard
          key={item.id}
          name={item.name}
          imageUrl={item.imageUrl}
          price={item.price || 'Not for sale'}
          collection={item.category || `By ${item.creator || 'Anonymous'}`}
          category={item.category}
          tokenId={item.tokenId}
          assetContract={item.contractAddress || getContractByCategory(item.category)}
          owner={item.owner || item.creator}
          isListed={item.isListed || false}
          listingId={item.listingId}
          isAuction={item.isAuction || false}
          auctionId={item.auctionId}
          currentBid={item.currentBid}
          endTime={item.endTime}
          activeOffers={item.activeOffers || 0}
          // Props para Custom Collections
          collectionId={item.customCollectionId || item._id}
          isCustomCollection={!!item.customCollectionId || item.type === 'custom_collection' || item.marketplace?.isCustomCollection}
        />
      ))}
    </div>
  );
} 