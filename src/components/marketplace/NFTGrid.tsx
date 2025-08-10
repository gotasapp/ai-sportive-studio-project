// src/components/marketplace/NFTGrid.tsx
'use client';

import MarketplaceCard from './MarketplaceCard';
import CollectionOverviewCard from './CollectionOverviewCard';

interface NFTGridProps {
  items: any[];
  getContractByCategory: (category: string) => string;
}

export default function NFTGrid({ items, getContractByCategory }: NFTGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
      {items.map((item) => {
        // 🎯 DECISÃO CRÍTICA: Usar CollectionOverviewCard para collections
        const isCollection = item.isCollection || item.marketplace?.isCollection || false;
        
        if (isCollection) {
          return (
            <CollectionOverviewCard
              key={item.id}
              name={item.name}
              imageUrl={item.imageUrl}
              collection={item.category || `By ${item.creator || 'Anonymous'}`}
              category={item.category}
              collectionId={item.collectionId || item._id}
              isCustomCollection={item.isCustomCollection || item.marketplace?.isCustomCollection || false}
              
              // Collection stats from marketplace data
              mintedUnits={item.mintedUnits || 0}
              totalUnits={item.totalUnits || 0}
              availableUnits={item.availableUnits || 0}
              floorPrice={item.price || '0 MATIC'}
              totalVolume="0 MATIC" // TODO: Calculate from historical data
              uniqueOwners={item.uniqueOwners || 0}
              listedCount={item.listedCount || 0}
              auctionCount={item.auctionCount || 0}
            />
          );
        }
        
        // 🎯 Para NFTs individuais, usar MarketplaceCard normal
        return (
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
            // Props para Custom Collections (caso seja NFT de collection)
            collectionId={item.customCollectionId || item._id}
            isCustomCollection={!!item.customCollectionId || item.type === 'custom_collection' || item.marketplace?.isCustomCollection}
          />
        );
      })}
    </div>
  );
} 